// Periodic Email Domain Verification (called by pg_cron)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all domains that need re-verification
    // Re-verify: pending/failed domains, or verified domains not checked in 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: domains, error } = await supabase
      .from("email_domains")
      .select("*")
      .or(`status.in.(pending,failed),and(status.eq.verified,last_verified_at.lt.${twentyFourHoursAgo})`)
      .limit(50);

    if (error) {
      console.error("Error fetching domains:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!domains || domains.length === 0) {
      return new Response(JSON.stringify({ message: "No domains to verify", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Verifying ${domains.length} domains...`);
    const results: any[] = [];

    for (const domainRecord of domains) {
      try {
        const domain = domainRecord.domain;

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
        const allVerified = spfVerified && dkimVerified && dmarcVerified;
        const newStatus = allVerified ? "verified" : (domainRecord.status === "verified" ? "failed" : "pending");

        const updateData: Record<string, any> = {
          spf_verified: spfVerified,
          dkim_verified: dkimVerified,
          dmarc_verified: dmarcVerified,
          mx_verified: mxVerified,
          last_verified_at: new Date().toISOString(),
          status: newStatus,
        };

        if (allVerified && !domainRecord.verified_at) {
          updateData.verified_at = new Date().toISOString();
          updateData.is_active = true;
        }

        if (!allVerified) {
          const missing: string[] = [];
          if (!spfVerified) missing.push("SPF");
          if (!dkimVerified) missing.push("DKIM");
          if (!dmarcVerified) missing.push("DMARC");
          updateData.verification_error = `Registros pendentes: ${missing.join(", ")}`;
          if (domainRecord.status === "verified") {
            updateData.is_active = false;
          }
        } else {
          updateData.verification_error = null;
          updateData.is_active = true;
        }

        await supabase.from("email_domains").update(updateData).eq("id", domainRecord.id);

        results.push({ domain, status: newStatus, spfVerified, dkimVerified, dmarcVerified, mxVerified });
      } catch (err) {
        console.error(`Error verifying ${domainRecord.domain}:`, err);
        results.push({ domain: domainRecord.domain, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    return new Response(
      JSON.stringify({ message: `Verified ${results.length} domains`, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cron verification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
