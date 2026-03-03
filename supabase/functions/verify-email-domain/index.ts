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

function toFqdn(recordName: string, zone: string): string {
  const cleanZone = zone.replace(/\.$/, "");
  const cleanName = (recordName || "@").replace(/\.$/, "");

  if (cleanName === "@") return cleanZone;
  if (cleanName.endsWith(cleanZone)) return cleanName;

  // Detect overlap: e.g. name="send.mail", zone="mail.agwebi.com" → "send.mail.agwebi.com"
  const zoneParts = cleanZone.split(".");
  for (let i = 1; i < zoneParts.length; i++) {
    const zonePrefix = zoneParts.slice(0, i).join(".");
    if (cleanName.endsWith(`.${zonePrefix}`) || cleanName === zonePrefix) {
      const zoneSuffix = zoneParts.slice(i).join(".");
      return `${cleanName}.${zoneSuffix}`;
    }
  }

  return `${cleanName}.${cleanZone}`;
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

async function registerDomainOnResend(
  apiKey: string,
  domain: string,
  attempt = 1
): Promise<{ id: string; records: any[]; status?: string; conflict?: boolean } | null> {
  try {
    console.log(`Registering domain ${domain} on Resend (attempt ${attempt})...`);
    const response = await fetch("https://api.resend.com/domains", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: domain, region: "sa-east-1" }),
    });
    const data = await response.json();
    console.log(`Resend register response for ${domain}: status=${response.status}, body=${JSON.stringify(data)}`);

    if (!response.ok) {
      if (data?.message?.includes("already") || data?.name === "validation_error" || response.status === 409 || response.status === 422 || response.status === 403) {
        await delay(700);
        const found = await findDomainOnResend(apiKey, domain);
        if (found) return found;
        // Domain registered on another Resend account - return conflict marker
        console.warn(`Domain ${domain} is registered on another Resend account (status ${response.status}).`);
        return { id: '', records: [], status: 'conflict', conflict: true };
      }

      if (response.status === 429 && attempt < 6) {
        const waitMs = 1200 * attempt;
        console.warn(`Rate limited registering ${domain}. Retry ${attempt}/5 in ${waitMs}ms`);
        await delay(waitMs);
        return await registerDomainOnResend(apiKey, domain, attempt + 1);
      }

      console.error("Failed to register domain on Resend:", JSON.stringify(data));
      return null;
    }

    return { id: data.id, records: data.records || [], status: data.status || null };
  } catch (error) {
    console.error("Error registering domain on Resend:", error);
    return null;
  }
}

async function findDomainOnResend(apiKey: string, domain: string): Promise<{ id: string; records: any[]; status?: string } | null> {
  try {
    const response = await fetch("https://api.resend.com/domains", {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const found = data.data?.find((d: any) => d.name === domain);
    if (found) return { id: found.id, records: found.records || [], status: found.status || null };
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
    let domainConflict = false;

    if (resendApiKey) {
      // --- Register or recover main sending domain (mandatory) ---
      if (!providerDomainId) {
        const existing = await findDomainOnResend(resendApiKey, domain);
        if (existing) {
          providerDomainId = existing.id;
          resendRecords = existing.records;
          resendStatus = existing.status || null;
          console.log(`Domain ${domain} already exists on Resend: ${providerDomainId}`);
        } else {
          await delay(700);
          const result = await registerDomainOnResend(resendApiKey, domain);
          if (result) {
            if (result.conflict) {
              domainConflict = true;
              console.warn(`Domain ${domain} is registered on another Resend account. User must remove it there first.`);
            } else {
              providerDomainId = result.id;
              resendRecords = result.records;
              resendStatus = result.status || null;
              console.log(`Domain ${domain} registered on Resend: ${providerDomainId}`);
            }
          }
        }
      }

      if (!providerDomainId && !domainConflict) {
        console.warn(`Could not register/find root domain ${domain} on Resend. DNS checks will still proceed.`);
      }

      await delay(700);

      // --- Register inbound subdomain for receiving emails ---
      const inboundSubdomain = `mail.${domain}`;
      const foundInbound = await findDomainOnResend(resendApiKey, inboundSubdomain);
      if (foundInbound) {
        inboundDomainId = foundInbound.id;
        inboundRecords = foundInbound.records;
      } else {
        await delay(700);
        const inboundResult = await registerDomainOnResend(resendApiKey, inboundSubdomain);
        if (inboundResult) {
          inboundDomainId = inboundResult.id;
          inboundRecords = inboundResult.records;
          console.log(`Inbound subdomain ${inboundSubdomain} registered: ${inboundDomainId}`);
        }
      }

      // Enable receiving on inbound subdomain
      if (inboundDomainId) {
        await delay(700);
        await enableReceiving(resendApiKey, inboundDomainId);
      }

      // For existing root domain, refresh status/records from provider
      if (providerDomainId && resendRecords.length === 0) {
        await delay(700);
        const details = await getDomainDetails(resendApiKey, providerDomainId);
        resendStatus = details.status;
        if (details.records.length > 0) resendRecords = details.records;
        console.log(`Resend status for ${domain}: ${resendStatus}`);
      }
    }

    // --- DNS checks (root + common provider subdomains) ---
    const [
      txtRootRecords,
      txtSendRecords,
      txtMailRecords,
      dkimDefaultTxtRecords,
      dkimDefaultCnameRecords,
      dkimResendTxtRecords,
      dkimResendCnameRecords,
      dmarcRecords,
      mxRootRecords,
      mxMailRecords,
      mxSendRecords,
      mxReceivingRecords,
    ] = await Promise.all([
      resolveDNS(domain, "TXT"),
      resolveDNS(`send.${domain}`, "TXT"),
      resolveDNS(`mail.${domain}`, "TXT"),
      resolveDNS(`default._domainkey.${domain}`, "TXT"),
      resolveDNS(`default._domainkey.${domain}`, "CNAME"),
      resolveDNS(`resend._domainkey.${domain}`, "TXT"),
      resolveDNS(`resend._domainkey.${domain}`, "CNAME"),
      resolveDNS(`_dmarc.${domain}`, "TXT"),
      resolveDNS(domain, "MX"),
      resolveDNS(`mail.${domain}`, "MX"),
      resolveDNS(`send.${domain}`, "MX"),
      resolveDNS(`receiving.${domain}`, "MX"),
    ]);

    const providerSpfVerified = [...resendRecords, ...inboundRecords].some((r: any) => {
      const purpose = String(r?.purpose || "").toLowerCase();
      return r?.type === "TXT" && purpose.includes("spf") && String(r?.status || "").toLowerCase() === "verified";
    });

    const providerDkimVerified = [...resendRecords, ...inboundRecords].some((r: any) => {
      const purpose = String(r?.purpose || "").toLowerCase();
      return purpose.includes("dkim") && String(r?.status || "").toLowerCase() === "verified";
    });

    const providerMxVerified = [...resendRecords, ...inboundRecords].some((r: any) => {
      return r?.type === "MX" && String(r?.status || "").toLowerCase() === "verified";
    });

    const allSpfRecords = [...txtRootRecords, ...txtSendRecords, ...txtMailRecords];
    const allDkimRecords = [
      ...dkimDefaultTxtRecords,
      ...dkimDefaultCnameRecords,
      ...dkimResendTxtRecords,
      ...dkimResendCnameRecords,
    ];
    const allMxRecords = [...mxRootRecords, ...mxMailRecords, ...mxSendRecords, ...mxReceivingRecords];

    const spfVerified = providerSpfVerified || checkSPF(allSpfRecords);
    const dkimVerified = providerDkimVerified || checkDKIM(allDkimRecords);
    const dmarcVerified = checkDMARC(dmarcRecords);
    const mxVerified = providerMxVerified || checkMX(allMxRecords);
    const dnsAllVerified = spfVerified && dkimVerified && dmarcVerified && mxVerified;
    const newStatus = (resendStatus === "verified" || !resendApiKey) && dnsAllVerified ? "verified" : "pending";

    // --- Build update ---
    const updateData: Record<string, any> = {
      spf_verified: spfVerified, dkim_verified: dkimVerified,
      dmarc_verified: dmarcVerified, mx_verified: mxVerified,
      last_verified_at: new Date().toISOString(), status: newStatus,
    };

    if (providerDomainId) updateData.provider_domain_id = providerDomainId;
    if (inboundDomainId) updateData.inbound_subdomain = `mail.${domain}`;

    // Merge main + inbound records for display
    const allRecords = [...resendRecords];
    for (const r of inboundRecords) {
      allRecords.push({ ...r, _source: 'inbound' });
    }
    if (allRecords.length > 0) {
      updateData.dns_records = allRecords.map((r: any) => {
        const isInbound = r._source === 'inbound';
        const zone = isInbound ? `mail.${domain}` : domain;
        const rawName = r.name || r.record || '@';
        const normalizedName = toFqdn(rawName, zone);

        return {
          type: r.type || 'TXT',
          host: rawName,
          name: normalizedName,
          value: r.value || r.data || '',
          zone,
          ttl: r.ttl || 'auto',
          priority: r.priority || null,
          purpose: r.type === 'MX' ? 'MX (Mail)' : (rawName?.includes('_domainkey') ? 'DKIM' : (rawName?.includes('_dmarc') ? 'DMARC' : (r.type === 'TXT' ? 'SPF' : r.type))),
          description: r.type === 'MX'
            ? `Registro MX para recebimento via mail.${domain}`
            : rawName?.includes('_domainkey') ? `DKIM${isInbound ? ' (mail)' : ''}`
            : rawName?.includes('_dmarc') ? `DMARC${isInbound ? ' (mail)' : ''}`
            : `SPF${isInbound ? ' (mail)' : ''}`,
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
      if (domainConflict) {
        missing.push("Resend (domínio registrado em outra conta)");
      } else if (resendApiKey && resendStatus && resendStatus !== "verified") {
        missing.push(`Resend (${resendStatus})`);
      }
      updateData.verification_error = missing.length > 0 ? `Pendente: ${missing.join(", ")}` : null;
    } else {
      updateData.verification_error = null;
    }

    await supabase.from("email_domains").update(updateData).eq("id", domain_id);

    return new Response(JSON.stringify({
      spf_verified: spfVerified, dkim_verified: dkimVerified,
      dmarc_verified: dmarcVerified, mx_verified: mxVerified,
      status: newStatus, resend_status: domainConflict ? 'conflict' : resendStatus,
      resend_domain_id: providerDomainId,
      domain_conflict: domainConflict,
      inbound_domain_id: inboundDomainId,
      inbound_subdomain: `mail.${domain}`,
      resend_records: resendRecords, inbound_records: inboundRecords,
      spf_records: allSpfRecords.filter((r) => String(r).toLowerCase().includes("spf")),
      dkim_records: allDkimRecords,
      dmarc_records: dmarcRecords, mx_records: allMxRecords,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error verifying domain:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
