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

async function registerDomainOnResend(apiKey: string, domain: string): Promise<{ id: string; records: any[] } | null> {
  try {
    const response = await fetch("https://api.resend.com/domains", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Domain might already exist - try to find it
      if (data?.message?.includes("already") || response.status === 409 || response.status === 422) {
        console.log("Domain may already exist on Resend, trying to find it...");
        return await findDomainOnResend(apiKey, domain);
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
    if (found) {
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

    if (resendApiKey) {
      if (!providerDomainId) {
        // Register domain on Resend
        const result = await registerDomainOnResend(resendApiKey, domain);
        if (result) {
          providerDomainId = result.id;
          resendRecords = result.records;
          console.log(`Domain ${domain} registered on Resend with ID: ${providerDomainId}`);
        }
      }

      if (providerDomainId) {
        // Trigger verification on Resend
        await verifyDomainOnResend(resendApiKey, providerDomainId);
        // Check status
        resendStatus = await getDomainStatusOnResend(resendApiKey, providerDomainId);
        console.log(`Resend domain status for ${domain}: ${resendStatus}`);
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
