import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function resolveDNS(name: string, type: string): Promise<string[]> {
  try {
    const resp = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
      { headers: { Accept: "application/dns-json" } }
    );
    const data = await resp.json();
    if (!data.Answer) return [];
    return data.Answer.map((a: any) => a.data);
  } catch {
    return [];
  }
}

function checkSPF(records: string[]): boolean {
  return records.some(
    (r) => r.includes("v=spf1") && (r.includes("include:") || r.includes("ip4:") || r.includes("a ") || r.includes("mx "))
  );
}

function checkDKIM(records: string[]): boolean {
  return records.some((r) => r.includes("v=DKIM1") || r.includes("p="));
}

function checkDMARC(records: string[]): boolean {
  return records.some((r) => r.includes("v=DMARC1"));
}

function checkMX(records: string[]): boolean {
  return records.length > 0;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Resend API helpers ---
async function getResendApiKey(supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from("organization_integrations")
    .select("config")
    .eq("integration_type", "resend")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const config = data.config as Record<string, string>;
  return config?.api_key || null;
}

async function registerDomainOnResend(apiKey: string, domain: string): Promise<{ id: string; records: any[] } | null> {
  try {
    const response = await fetch("https://api.resend.com/domains", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: domain, region: "sa-east-1" }),
    });
    const data = await response.json();
    if (!response.ok) {
      if (data?.message?.includes("already") || response.status === 409 || response.status === 422) {
        await delay(600);
        return await findDomainOnResend(apiKey, domain);
      }
      if (response.status === 429) {
        console.warn(`Rate limited registering ${domain}, retrying after delay...`);
        await delay(1500);
        return await registerDomainOnResend(apiKey, domain);
      }
      console.error("Failed to register domain on Resend:", data);
      return null;
    }
    return { id: data.id, records: data.records || [] };
  } catch (error) {
    console.error("Error registering domain on Resend:", error);
    return null;
  }
}

async function findDomainOnResend(apiKey: string, domain: string): Promise<{ id: string; records: any[] } | null> {
  try {
    const response = await fetch("https://api.resend.com/domains", {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const found = data.data?.find((d: any) => d.name === domain);
    if (found) return { id: found.id, records: found.records || [] };
    return null;
  } catch {
    return null;
  }
}

async function enableReceiving(apiKey: string, domainId: string): Promise<void> {
  try {
    await fetch(`https://api.resend.com/domains/${domainId}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ capabilities: { sending: "enabled", receiving: "enabled" } }),
    });
  } catch (e) {
    console.error("Error enabling receiving:", e);
  }
}

async function verifyDomainOnResend(apiKey: string, domainId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function getDomainDetails(apiKey: string, domainId: string): Promise<{ status: string | null; records: any[] }> {
  try {
    const response = await fetch(`https://api.resend.com/domains/${domainId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!response.ok) return { status: null, records: [] };
    const data = await response.json();
    return { status: data.status || null, records: data.records || [] };
  } catch {
    return { status: null, records: [] };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { domain_id } = await req.json();
    if (!domain_id) {
      return new Response(JSON.stringify({ error: "domain_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: domainRecord, error: domainError } = await supabase
      .from("email_domains").select("*").eq("id", domain_id).single();
    if (domainError || !domainRecord) {
      return new Response(JSON.stringify({ error: "Domain not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isMember } = await supabase.rpc("is_org_admin", {
      _org_id: domainRecord.organization_id, _user_id: user.id,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domain = domainRecord.domain;
    const resendApiKey = await getResendApiKey(supabase);
    let providerDomainId = domainRecord.provider_domain_id || null;
    let resendStatus: string | null = null;
    let resendRecords: any[] = [];
    let inboundDomainId: string | null = null;
    let inboundRecords: any[] = [];

    if (resendApiKey) {
      // --- Register main sending domain ---
      if (!providerDomainId) {
        // First try to find if it already exists
        const existing = await findDomainOnResend(resendApiKey, domain);
        if (existing) {
          providerDomainId = existing.id;
          resendRecords = existing.records;
          console.log(`Domain ${domain} already exists on Resend: ${providerDomainId}`);
        } else {
          await delay(600);
          const result = await registerDomainOnResend(resendApiKey, domain);
          if (result) {
            providerDomainId = result.id;
            resendRecords = result.records;
            console.log(`Domain ${domain} registered on Resend: ${providerDomainId}`);
          }
        }
      }

      await delay(600);

      // --- Register inbound subdomain for receiving emails ---
      const inboundSubdomain = `inbound.${domain}`;
      const foundInbound = await findDomainOnResend(resendApiKey, inboundSubdomain);
      if (foundInbound) {
        inboundDomainId = foundInbound.id;
        inboundRecords = foundInbound.records;
      } else {
        await delay(600);
        const inboundResult = await registerDomainOnResend(resendApiKey, inboundSubdomain);
        if (inboundResult) {
          inboundDomainId = inboundResult.id;
          inboundRecords = inboundResult.records;
          console.log(`Inbound subdomain ${inboundSubdomain} registered: ${inboundDomainId}`);
        }
      }

      // Enable receiving on inbound subdomain
      if (inboundDomainId) {
        await delay(600);
        await enableReceiving(resendApiKey, inboundDomainId);
        await delay(600);
        await verifyDomainOnResend(resendApiKey, inboundDomainId);
      }

      // Verify main domain and get latest records
      if (providerDomainId) {
        await delay(600);
        await verifyDomainOnResend(resendApiKey, providerDomainId);
        await delay(600);
        const details = await getDomainDetails(resendApiKey, providerDomainId);
        resendStatus = details.status;
        if (details.records.length > 0) resendRecords = details.records;
        console.log(`Resend status for ${domain}: ${resendStatus}`);
      }
    }

    // --- DNS checks ---
    const [txtRecords, dkimRecords, dmarcRecords, mxRecords] = await Promise.all([
      resolveDNS(domain, "TXT"),
      resolveDNS(`default._domainkey.${domain}`, "TXT"),
      resolveDNS(`_dmarc.${domain}`, "TXT"),
      resolveDNS(domain, "MX"),
    ]);

    const spfVerified = checkSPF(txtRecords);
    const dkimVerified = checkDKIM(dkimRecords);
    const dmarcVerified = checkDMARC(dmarcRecords);
    const mxVerified = checkMX(mxRecords);
    const dnsAllVerified = spfVerified && dkimVerified && dmarcVerified;
    const newStatus = (resendStatus === "verified" || !resendApiKey) && dnsAllVerified ? "verified" : "pending";

    // --- Build update ---
    const updateData: Record<string, any> = {
      spf_verified: spfVerified, dkim_verified: dkimVerified,
      dmarc_verified: dmarcVerified, mx_verified: mxVerified,
      last_verified_at: new Date().toISOString(), status: newStatus,
    };

    if (providerDomainId) updateData.provider_domain_id = providerDomainId;
    if (inboundDomainId) updateData.inbound_subdomain = `inbound.${domain}`;

    // Merge main + inbound records for display
    const allRecords = [...resendRecords];
    for (const r of inboundRecords) {
      allRecords.push({ ...r, _source: 'inbound' });
    }
    if (allRecords.length > 0) {
      updateData.dns_records = allRecords.map((r: any) => {
        const isInbound = r._source === 'inbound';
        return {
          type: r.type || 'TXT',
          name: r.name || r.record || '',
          value: r.value || r.data || '',
          purpose: r.type === 'MX' ? 'MX (Inbound)' : (r.name?.includes('_domainkey') ? 'DKIM' : (r.name?.includes('_dmarc') ? 'DMARC' : (r.type === 'TXT' ? 'SPF' : r.type))),
          description: r.type === 'MX'
            ? `Registro MX para recebimento via inbound.${domain}`
            : r.name?.includes('_domainkey') ? `DKIM${isInbound ? ' (inbound)' : ''}`
            : r.name?.includes('_dmarc') ? `DMARC${isInbound ? ' (inbound)' : ''}`
            : `SPF${isInbound ? ' (inbound)' : ''}`,
          status: r.status || 'pending',
          is_inbound: isInbound,
        };
      });
    }

    if (newStatus === "verified" && !domainRecord.verified_at) {
      updateData.verified_at = new Date().toISOString();
      updateData.is_active = true;
    }

    if (newStatus !== "verified") {
      const missing = [];
      if (!spfVerified) missing.push("SPF");
      if (!dkimVerified) missing.push("DKIM");
      if (!dmarcVerified) missing.push("DMARC");
      if (resendApiKey && resendStatus && resendStatus !== "verified") missing.push(`Resend (${resendStatus})`);
      updateData.verification_error = missing.length > 0 ? `Pendente: ${missing.join(", ")}` : null;
    } else {
      updateData.verification_error = null;
    }

    await supabase.from("email_domains").update(updateData).eq("id", domain_id);

    return new Response(JSON.stringify({
      spf_verified: spfVerified, dkim_verified: dkimVerified,
      dmarc_verified: dmarcVerified, mx_verified: mxVerified,
      status: newStatus, resend_status: resendStatus,
      resend_domain_id: providerDomainId,
      inbound_domain_id: inboundDomainId,
      inbound_subdomain: `inbound.${domain}`,
      resend_records: resendRecords, inbound_records: inboundRecords,
      spf_records: txtRecords.filter((r) => r.includes("spf")),
      dkim_records: dkimRecords, dmarc_records: dmarcRecords, mx_records: mxRecords,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error verifying domain:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
