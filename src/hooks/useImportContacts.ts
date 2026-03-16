import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface ImportJob {
  id: string;
  user_id: string;
  organization_id: string | null;
  file_name: string;
  total_rows: number;
  processed_rows: number;
  success_count: number;
  error_count: number;
  status: string;
  errors: Array<{ row: number; message: string }>;
  field_mapping: Record<string, string>;
  created_at: string;
  completed_at: string | null;
}

export interface ParsedContact {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  position?: string;
  source?: string;
  status?: string;
  notes?: string;
  tags?: string;
  [key: string]: string | undefined;
}

/**
 * Proper CSV parser that handles quoted fields (fields containing commas, semicolons, newlines).
 */
export function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  // Detect delimiter: count commas vs semicolons in first line
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim()).filter(Boolean);

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] || '').replace(/^["']|["']$/g, '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

export const CONTACT_FIELDS = [
  { key: 'first_name', label: 'Nome', required: true },
  { key: 'last_name', label: 'Sobrenome', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Telefone', required: false },
  { key: 'whatsapp', label: 'WhatsApp', required: false },
  { key: 'position', label: 'Cargo', required: false },
  { key: 'source', label: 'Origem', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'notes', label: 'Observações', required: false },
  { key: 'tags', label: 'Tags (separadas por vírgula)', required: false },
];

/** Common CSV header names mapped to our contact fields */
const AUTO_MAP: Record<string, string> = {
  // Name
  'nome': 'first_name', 'name': 'first_name', 'first_name': 'first_name',
  'primeiro nome': 'first_name', 'primeiro_nome': 'first_name', 'nome completo': 'first_name',
  'nome_completo': 'first_name', 'full_name': 'first_name', 'fullname': 'first_name',
  'contact name': 'first_name', 'contact': 'first_name', 'contato': 'first_name',
  'lead': 'first_name', 'lead name': 'first_name',
  // Last name
  'sobrenome': 'last_name', 'last_name': 'last_name', 'lastname': 'last_name',
  'ultimo nome': 'last_name', 'ultimo_nome': 'last_name',
  // Email
  'email': 'email', 'e-mail': 'email', 'e_mail': 'email', 'correo': 'email',
  'mail': 'email', 'email address': 'email', 'endereco de email': 'email',
  // Phone
  'telefone': 'phone', 'phone': 'phone', 'celular': 'phone', 'tel': 'phone',
  'fone': 'phone', 'numero': 'phone', 'número': 'phone', 'phone_number': 'phone',
  'mobile': 'phone', 'cell': 'phone', 'cellphone': 'phone',
  // WhatsApp
  'whatsapp': 'whatsapp', 'wpp': 'whatsapp', 'zap': 'whatsapp', 'whats': 'whatsapp',
  'numero whatsapp': 'whatsapp', 'whatsapp number': 'whatsapp',
  // Position
  'cargo': 'position', 'position': 'position', 'job title': 'position',
  'titulo': 'position', 'funcao': 'position', 'função': 'position',
  // Source
  'origem': 'source', 'source': 'source', 'canal': 'source', 'channel': 'source',
  // Status
  'status': 'status', 'situacao': 'status', 'situação': 'status',
  // Tags
  'tags': 'tags', 'tag': 'tags', 'etiqueta': 'tags', 'etiquetas': 'tags',
  'grupo': 'tags', 'grupos': 'tags', 'label': 'tags', 'labels': 'tags',
  // Notes
  'observacoes': 'notes', 'observações': 'notes', 'notes': 'notes',
  'obs': 'notes', 'nota': 'notes', 'notas': 'notes', 'comentario': 'notes',
};

export function autoMapHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedFields = new Set<string>();

  headers.forEach(header => {
    const normalized = header
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Direct match
    if (AUTO_MAP[normalized] && !usedFields.has(AUTO_MAP[normalized])) {
      mapping[header] = AUTO_MAP[normalized];
      usedFields.add(AUTO_MAP[normalized]);
      return;
    }

    // Partial match
    for (const [key, field] of Object.entries(AUTO_MAP)) {
      if (usedFields.has(field)) continue;
      const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
        mapping[header] = field;
        usedFields.add(field);
        return;
      }
    }

    mapping[header] = 'ignore';
  });

  return mapping;
}

export function useImportContacts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({
      rows,
      fieldMapping,
      fileName,
    }: {
      rows: Record<string, string>[];
      fieldMapping: Record<string, string>;
      fileName: string;
    }) => {
      // Create import job
      const { data: job, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user!.id,
          file_name: fileName,
          total_rows: rows.length,
          field_mapping: fieldMapping,
          status: 'processing',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      const errors: Array<{ row: number; message: string }> = [];
      let successCount = 0;

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        let firstName = '';
        let lastName: string | undefined;
        let email: string | undefined;
        let phone: string | undefined;
        let whatsapp: string | undefined;
        let position: string | undefined;
        let source: string | undefined;
        let status: string | undefined;
        let notes: string | undefined;
        let tagsStr: string | undefined;

        // Map fields
        for (const [csvField, contactField] of Object.entries(fieldMapping)) {
          if (contactField && contactField !== 'ignore' && row[csvField]) {
            const value = row[csvField].trim();
            if (!value) continue;
            switch (contactField) {
              case 'first_name': firstName = value; break;
              case 'last_name': lastName = value; break;
              case 'email': email = value; break;
              case 'phone': phone = value; break;
              case 'whatsapp': whatsapp = value; break;
              case 'position': position = value; break;
              case 'source': source = value; break;
              case 'status': status = value; break;
              case 'notes': notes = value; break;
              case 'tags': tagsStr = value; break;
            }
          }
        }

        // Validate required fields
        if (!firstName) {
          errors.push({ row: i + 2, message: 'Nome é obrigatório' });
          continue;
        }

        // Insert contact
        const { data: contact, error: insertError } = await supabase.from('contacts').insert([{
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          whatsapp,
          position,
          source,
          status,
          notes,
          user_id: user!.id,
          organization_id: currentOrganization?.id || null,
        }]).select('id').single();

        if (insertError) {
          errors.push({ row: i + 2, message: insertError.message });
          continue;
        }

        // Handle tags
        if (tagsStr && contact) {
          const tagNames = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
          for (const tagName of tagNames) {
            let tagId: string | null = null;
            const { data: existing } = await supabase.from('tags')
              .select('id')
              .eq('name', tagName)
              .eq('user_id', user!.id)
              .maybeSingle();

            if (existing) {
              tagId = existing.id;
            } else {
              const { data: newTag } = await supabase.from('tags').insert({
                name: tagName,
                color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
                user_id: user!.id,
                organization_id: currentOrganization?.id || null,
              }).select('id').single();
              tagId = newTag?.id || null;
            }

            if (tagId) {
              await supabase.from('contact_tags').insert({ contact_id: contact.id, tag_id: tagId });
            }
          }
        }

        successCount++;
      }

      // Update import job with results
      await supabase
        .from('import_jobs')
        .update({
          processed_rows: rows.length,
          success_count: successCount,
          error_count: errors.length,
          errors,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return { successCount, errorCount: errors.length, errors };
    },
    onSuccess: ({ successCount, errorCount }) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      if (errorCount === 0) {
        toast.success(`${successCount} contatos importados com sucesso!`);
      } else {
        toast.warning(`${successCount} importados, ${errorCount} erros`);
      }
    },
    onError: (error) => {
      toast.error('Erro na importação: ' + error.message);
    },
  });
}
