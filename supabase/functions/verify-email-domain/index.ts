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

// --- Resend Domain API integration ---
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

async function enableReceiving(apiKey: string, domainId: string): Promise<void> {
  try {
    const response = await fetch(`https://api.resend.com/domains/${domainId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        capabilities: { sending: "enabled", receiving: "enabled" },
      }),
    });
    if (response.ok) {
      console.log(`Receiving enabled for domain ${domainId}`);
    } else {
      const err = await response.text();
      console.error(`Failed to enable receiving for domain ${domainId}:`, err);
    }
  } catch (e) {
    console.error("Error enabling receiving:", e);
  }
}

// Register the sending domain + a separate inbound subdomain for receiving
async function registerDomainOnResend(apiKey: string, domain: string): Promise<{ id: string; records: any[]; inbound_domain_id?: string; inbound_records?: any[] } | null> {
  try {
    // 1. Register main sending domain
    const response = await fetch("https://api.resend.com/domains", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain, region: "sa-east-1" }),
    });

    const data = await response.json();
    let mainId = data?.id;
    let mainRecords = data?.records || [];
    
    if (!response.ok) {
      if (data?.message?.includes("already") || response.status === 409 || response.status === 422) {
        console.log("Domain may already exist on Resend, trying to find it...");
        const found = await findDomainOnResend(apiKey, domain);
        if (found) {
          mainId = found.id;
          mainRecords = found.records;
        } else {
          return null;
        }
      } else {
        console.error("Failed to register domain on Resend:", data);
        return null;
      }
    }

    // 2. Register inbound subdomain (inbound.domain.com) for receiving
    const inboundDomain = `inbound.${domain}`;
    let inboundId: string | undefined;
    let inboundRecords: any[] = [];
    
    try {
      const inboundResp = await fetch("https://api.resend.com/domains", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: inboundDomain, region: "sa-east-1" }),
      });
      const inboundData = await inboundResp.json();

      if (inboundResp.ok && inboundData.id) {
        inboundId = inboundData.id;
        inboundRecords = inboundData.records || [];
        console.log(`Inbound subdomain ${inboundDomain} registered with ID: ${inboundId}`);
      } else if (inboundData?.message?.includes("already") || inboundResp.status === 409 || inboundResp.status === 422) {
        const foundInbound = await findDomainOnResend(apiKey, inboundDomain);
        if (foundInbound) {
          inboundId = foundInbound.id;
          inboundRecords = foundInbound.records;
        }
      } else {
        console.error("Failed to register inbound subdomain:", inboundData);
      }
    } catch (e) {
      console.error("Error registering inbound subdomain:", e);
    }

    // 3. Enable receiving on the inbound subdomain
    if (inboundId) {
      await enableReceiving(apiKey, inboundId);
    }

    // Also enable receiving on main domain as fallback
    if (mainId) {
      await enableReceiving(apiKey, mainId);
    }

    return { id: mainId, records: mainRecords, inbound_domain_id: inboundId, inbound_records: inboundRecords };
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
    if (found) {
      // Enable receiving if not already enabled
      if (found.receiving !== "enabled") {
        await enableReceiving(apiKey, found.id);
      }
      return { id: found.id, records: found.records || [] };
    }
    return null;
  } catch {
    return null;
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

async function getDomainStatusOnResend(apiKey: string, domainId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.resend.com/domains/${domainId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.status || null;
  } catch {
    return null;
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { domain_id } = await req.json();
    if (!domain_id) {
      return new Response(JSON.stringify({ error: "domain_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch domain record
    const { data: domainRecord, error: domainError } = await supabase
      .from("email_domains")
      .select("*")
      .eq("id", domain_id)
      .single();

    if (domainError || !domainRecord) {
      return new Response(JSON.stringify({ error: "Domain not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user is org admin
    const { data: isMember } = await supabase.rpc("is_org_admin", {
      _org_id: domainRecord.organization_id,
      _user_id: user.id,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domain = domainRecord.domain;

    // --- Step 1: Register on Resend if not already ---
    const resendApiKey = await getResendApiKey(supabase);
    let providerDomainId = domainRecord.provider_domain_id || null;
    let resendStatus: string | null = null;
    let resendRecords: any[] = [];

    let inboundDomainId: string | null = null;
    let inboundRecords: any[] = [];

    if (resendApiKey) {
      if (!providerDomainId) {
        // Register domain + inbound subdomain on Resend
        const result = await registerDomainOnResend(resendApiKey, domain);
        if (result) {
          providerDomainId = result.id;
          resendRecords = result.records;
          inboundDomainId = result.inbound_domain_id || null;
          inboundRecords = result.inbound_records || [];
          console.log(`Domain ${domain} registered on Resend with ID: ${providerDomainId}, inbound: ${inboundDomainId}`);
        }
      } else {
        // Domain already registered, check/register inbound subdomain
        const inboundSubdomain = `inbound.${domain}`;
        const foundInbound = await findDomainOnResend(resendApiKey, inboundSubdomain);
        if (foundInbound) {
          inboundDomainId = foundInbound.id;
          inboundRecords = foundInbound.records;
          await enableReceiving(resendApiKey, foundInbound.id);
        } else {
          // Register inbound subdomain
          try {
            const ibResp = await fetch("https://api.resend.com/domains", {
              method: "POST",
              headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ name: inboundSubdomain, region: "sa-east-1" }),
            });
            const ibData = await ibResp.json();
            if (ibResp.ok && ibData.id) {
              inboundDomainId = ibData.id;
              inboundRecords = ibData.records || [];
              await enableReceiving(resendApiKey, ibData.id);
              console.log(`Inbound subdomain ${inboundSubdomain} registered: ${inboundDomainId}`);
            }
          } catch (e) {
            console.error("Error registering inbound subdomain:", e);
          }
        }
      }

      if (providerDomainId) {
        await enableReceiving(resendApiKey, providerDomainId);
        await verifyDomainOnResend(resendApiKey, providerDomainId);
        resendStatus = await getDomainStatusOnResend(resendApiKey, providerDomainId);
        console.log(`Resend domain status for ${domain}: ${resendStatus}`);
      }

      // Also verify inbound subdomain
      if (inboundDomainId) {
        await verifyDomainOnResend(resendApiKey, inboundDomainId);
        const inboundStatus = await getDomainStatusOnResend(resendApiKey, inboundDomainId);
        console.log(`Inbound subdomain status for inbound.${domain}: ${inboundStatus}`);
      }
    }

    // --- Step 2: Run DNS checks in parallel ---
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

    // Domain is verified if DNS checks pass AND Resend confirms it (or no Resend configured)
    const dnsAllVerified = spfVerified && dkimVerified && dmarcVerified;
    const resendVerified = resendStatus === "verified" || resendStatus === "not_started" || !resendApiKey;
    const allVerified = dnsAllVerified && (resendVerified || resendStatus === "verified");
    const newStatus = (resendStatus === "verified" || !resendApiKey) && dnsAllVerified ? "verified" : "pending";

    // --- Step 3: Update domain record ---
    const updateData: Record<string, any> = {
      spf_verified: spfVerified,
      dkim_verified: dkimVerified,
      dmarc_verified: dmarcVerified,
      mx_verified: mxVerified,
      last_verified_at: new Date().toISOString(),
      status: newStatus,
    };

    if (providerDomainId) {
      updateData.provider_domain_id = providerDomainId;
    }

    // Save actual DNS records from Resend (main + inbound) so user sees correct values
    const allProviderRecords = [...resendRecords];
    
    // Add inbound subdomain records with clear labeling
    if (inboundRecords && inboundRecords.length > 0) {
      for (const r of inboundRecords) {
        allProviderRecords.push({ ...r, _source: 'inbound' });
      }
    }

    if (allProviderRecords.length > 0) {
      const formattedRecords = allProviderRecords.map((r: any) => {
        const isInbound = r._source === 'inbound';
        return {
          type: r.type || 'TXT',
          name: r.name || r.record || '',
          value: r.value || r.data || '',
          purpose: r.type === 'MX' ? 'MX (Inbound)' : (r.name?.includes('_domainkey') ? 'DKIM' : (r.name?.includes('_dmarc') ? 'DMARC' : (r.type === 'TXT' ? 'SPF' : r.type))),
          description: r.type === 'MX' ? `Registro MX para recebimento de e-mails via inbound.${domain}` :
            r.name?.includes('_domainkey') ? `Assinatura digital DKIM${isInbound ? ' (inbound)' : ''}` :
            r.name?.includes('_dmarc') ? `Política DMARC${isInbound ? ' (inbound)' : ''}` :
            `Registro de autenticação SPF${isInbound ? ' (inbound)' : ''}`,
          status: r.status || 'pending',
          is_inbound: isInbound,
        };
      });
      updateData.dns_records = formattedRecords;
      console.log(`Saved ${formattedRecords.length} DNS records (main + inbound) for domain ${domain}`);
    } else if (!domainRecord.dns_records || (Array.isArray(domainRecord.dns_records) && domainRecord.dns_records.some((r: any) => r.value?.includes('{provider}')))) {
      // Fetch from Resend if missing
      if (providerDomainId && resendApiKey) {
        try {
          const domainDetailsResp = await fetch(`https://api.resend.com/domains/${providerDomainId}`, {
            headers: { "Authorization": `Bearer ${resendApiKey}` },
          });
          if (domainDetailsResp.ok) {
            const domainDetails = await domainDetailsResp.json();
            if (domainDetails.records && domainDetails.records.length > 0) {
              const formattedRecords = domainDetails.records.map((r: any) => ({
                type: r.type || 'TXT',
                name: r.name || r.record || '',
                value: r.value || r.data || '',
                purpose: r.type === 'MX' ? 'MX' : (r.name?.includes('_domainkey') ? 'DKIM' : (r.name?.includes('_dmarc') ? 'DMARC' : (r.type === 'TXT' ? 'SPF' : r.type))),
                description: r.type === 'MX' ? 'Registro MX para recebimento de e-mails' :
                  r.name?.includes('_domainkey') ? 'Assinatura digital DKIM' :
                  r.name?.includes('_dmarc') ? 'Política DMARC' :
                  'Registro de autenticação SPF',
                status: r.status || 'pending',
              }));
              updateData.dns_records = formattedRecords;
              resendRecords = domainDetails.records;
              console.log(`Fetched ${formattedRecords.length} DNS records from Resend for domain ${domain}`);
            }
          }
        } catch (e) {
          console.error("Error fetching domain details from Resend:", e);
        }
      }
    }

    // Save inbound domain ID
    if (inboundDomainId) {
      updateData.inbound_subdomain = `inbound.${domain}`;
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
      if (resendApiKey && resendStatus && resendStatus !== "verified") {
        missing.push(`Resend (${resendStatus})`);
      }
      updateData.verification_error = missing.length > 0 
        ? `Pendente: ${missing.join(", ")}` 
        : null;
    } else {
      updateData.verification_error = null;
    }

    await supabase
      .from("email_domains")
      .update(updateData)
      .eq("id", domain_id);

    return new Response(
      JSON.stringify({
        spf_verified: spfVerified,
        dkim_verified: dkimVerified,
        dmarc_verified: dmarcVerified,
        mx_verified: mxVerified,
        status: newStatus,
        resend_status: resendStatus,
        resend_domain_id: providerDomainId,
        resend_records: resendRecords,
        inbound_domain_id: inboundDomainId,
        inbound_subdomain: `inbound.${domain}`,
        inbound_records: inboundRecords,
        spf_records: txtRecords.filter((r) => r.includes("spf")),
        dkim_records: dkimRecords,
        dmarc_records: dmarcRecords,
        mx_records: mxRecords,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error verifying domain:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
