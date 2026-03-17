import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 500;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Não autorizado");

    const { jobId } = await req.json();
    if (!jobId) throw new Error("jobId é obrigatório");

    // Fetch the import job
    const { data: job, error: jobErr } = await supabase
      .from("import_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) throw new Error("Job não encontrado");
    if (job.user_id !== user.id) throw new Error("Não autorizado");
    if (job.status !== "pending") {
      return new Response(JSON.stringify({ message: "Job já processado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as processing
    await supabase.from("import_jobs").update({ status: "processing" }).eq("id", jobId);

    const rows: Record<string, string>[] = job.import_data || [];
    const fieldMapping: Record<string, string> = job.field_mapping || {};
    const importTags: string[] = job.import_tags || [];
    const orgId = job.organization_id;
    const userId = job.user_id;

    const errors: Array<{ row: number; message: string }> = [];
    let successCount = 0;
    let processedRows = 0;

    // Pre-resolve/create import tags
    const tagIdCache: Record<string, string> = {};
    for (const tagName of importTags) {
      const { data: existing } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .eq("organization_id", orgId)
        .maybeSingle();

      if (existing) {
        tagIdCache[tagName] = existing.id;
      } else {
        const { data: newTag } = await supabase.from("tags").insert({
          name: tagName,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
          user_id: userId,
          organization_id: orgId,
        }).select("id").single();
        if (newTag) tagIdCache[tagName] = newTag.id;
      }
    }

    // Process in batches
    for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
      const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);
      const contactsToInsert: any[] = [];
      const rowIndexMap: number[] = []; // track original row index for error reporting

      for (let i = 0; i < batch.length; i++) {
        const row = batch[i];
        const globalIndex = batchStart + i;
        let firstName = "";
        let lastName: string | undefined;
        let email: string | undefined;
        let phone: string | undefined;
        let whatsapp: string | undefined;
        let position: string | undefined;
        let source: string | undefined;
        let status: string | undefined;
        let notes: string | undefined;
        let tagsStr: string | undefined;

        for (const [csvField, contactField] of Object.entries(fieldMapping)) {
          if (!contactField || contactField === "ignore" || !row[csvField]) continue;
          const value = row[csvField].trim();
          if (!value) continue;
          switch (contactField) {
            case "first_name": firstName = value; break;
            case "last_name": lastName = value; break;
            case "email": email = value; break;
            case "phone": phone = value; break;
            case "whatsapp": whatsapp = value; break;
            case "position": position = value; break;
            case "source": source = value; break;
            case "status": status = value; break;
            case "notes": notes = value; break;
            case "tags": tagsStr = value; break;
          }
        }

        if (!firstName) {
          errors.push({ row: globalIndex + 2, message: "Nome é obrigatório" });
          continue;
        }

        contactsToInsert.push({
          first_name: firstName,
          last_name: lastName,
          email, phone, whatsapp, position, source, status, notes,
          user_id: userId,
          organization_id: orgId,
          _tags_str: tagsStr, // temp field, removed before insert
          _row_index: globalIndex, // temp field
        });
        rowIndexMap.push(globalIndex);
      }

      // Batch insert contacts
      if (contactsToInsert.length > 0) {
        const cleanContacts = contactsToInsert.map(({ _tags_str, _row_index, ...rest }) => rest);

        const { data: inserted, error: insertErr } = await supabase
          .from("contacts")
          .insert(cleanContacts)
          .select("id");

        if (insertErr) {
          // Fallback: insert one by one
          for (let j = 0; j < cleanContacts.length; j++) {
            const { data: single, error: singleErr } = await supabase
              .from("contacts")
              .insert(cleanContacts[j])
              .select("id")
              .single();

            if (singleErr) {
              errors.push({ row: rowIndexMap[j] + 2, message: singleErr.message });
            } else if (single) {
              successCount++;
              await assignTags(supabase, single.id, contactsToInsert[j]._tags_str, importTags, tagIdCache, orgId, userId);
            }
          }
        } else if (inserted) {
          successCount += inserted.length;
          // Assign tags in parallel batches
          const tagPromises = inserted.map((contact, j) =>
            assignTags(supabase, contact.id, contactsToInsert[j]._tags_str, importTags, tagIdCache, orgId, userId)
          );
          await Promise.all(tagPromises);
        }
      }

      processedRows = Math.min(batchStart + BATCH_SIZE, rows.length);

      // Update progress
      await supabase.from("import_jobs").update({
        processed_rows: processedRows,
        success_count: successCount,
        error_count: errors.length,
      }).eq("id", jobId);
    }

    // Mark completed
    await supabase.from("import_jobs").update({
      processed_rows: rows.length,
      success_count: successCount,
      error_count: errors.length,
      errors,
      status: "completed",
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    return new Response(JSON.stringify({ success: true, successCount, errorCount: errors.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function assignTags(
  supabase: any,
  contactId: string,
  tagsStr: string | undefined,
  importTags: string[],
  tagIdCache: Record<string, string>,
  orgId: string,
  userId: string
) {
  const allTagNames = new Set<string>();

  // Tags from CSV field
  if (tagsStr) {
    tagsStr.split(",").map(t => t.trim()).filter(Boolean).forEach(t => allTagNames.add(t));
  }

  // Pre-assigned import tags
  importTags.forEach(t => allTagNames.add(t));

  if (allTagNames.size === 0) return;

  const tagLinks: Array<{ contact_id: string; tag_id: string }> = [];

  for (const tagName of allTagNames) {
    let tagId = tagIdCache[tagName];
    if (!tagId) {
      const { data: existing } = await supabase.from("tags")
        .select("id").eq("name", tagName).eq("organization_id", orgId).maybeSingle();
      if (existing) {
        tagId = existing.id;
        tagIdCache[tagName] = tagId;
      } else {
        const { data: newTag } = await supabase.from("tags").insert({
          name: tagName,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
          user_id: userId,
          organization_id: orgId,
        }).select("id").single();
        if (newTag) {
          tagId = newTag.id;
          tagIdCache[tagName] = tagId;
        }
      }
    }
    if (tagId) {
      tagLinks.push({ contact_id: contactId, tag_id: tagId });
    }
  }

  if (tagLinks.length > 0) {
    await supabase.from("contact_tags").insert(tagLinks);
  }
}
