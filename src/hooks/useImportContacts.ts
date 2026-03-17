import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  import_tags: string[];
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
 * Proper CSV parser that handles quoted fields.
 */
export function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

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
            i++;
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

const AUTO_MAP: Record<string, string> = {
  'nome': 'first_name', 'name': 'first_name', 'first_name': 'first_name',
  'primeiro nome': 'first_name', 'primeiro_nome': 'first_name', 'nome completo': 'first_name',
  'nome_completo': 'first_name', 'full_name': 'first_name', 'fullname': 'first_name',
  'contact name': 'first_name', 'contact': 'first_name', 'contato': 'first_name',
  'lead': 'first_name', 'lead name': 'first_name',
  'sobrenome': 'last_name', 'last_name': 'last_name', 'lastname': 'last_name',
  'ultimo nome': 'last_name', 'ultimo_nome': 'last_name',
  'email': 'email', 'e-mail': 'email', 'e_mail': 'email', 'correo': 'email',
  'mail': 'email', 'email address': 'email', 'endereco de email': 'email',
  'telefone': 'phone', 'phone': 'phone', 'celular': 'phone', 'tel': 'phone',
  'fone': 'phone', 'numero': 'phone', 'número': 'phone', 'phone_number': 'phone',
  'mobile': 'phone', 'cell': 'phone', 'cellphone': 'phone',
  'whatsapp': 'whatsapp', 'wpp': 'whatsapp', 'zap': 'whatsapp', 'whats': 'whatsapp',
  'numero whatsapp': 'whatsapp', 'whatsapp number': 'whatsapp',
  'cargo': 'position', 'position': 'position', 'job title': 'position',
  'titulo': 'position', 'funcao': 'position', 'função': 'position',
  'origem': 'source', 'source': 'source', 'canal': 'source', 'channel': 'source',
  'status': 'status', 'situacao': 'status', 'situação': 'status',
  'tags': 'tags', 'tag': 'tags', 'etiqueta': 'tags', 'etiquetas': 'tags',
  'grupo': 'tags', 'grupos': 'tags', 'label': 'tags', 'labels': 'tags',
  'observacoes': 'notes', 'observações': 'notes', 'notes': 'notes',
  'obs': 'notes', 'nota': 'notes', 'notas': 'notes', 'comentario': 'notes',
};

export function autoMapHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedFields = new Set<string>();

  headers.forEach(header => {
    const normalized = header.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (AUTO_MAP[normalized] && !usedFields.has(AUTO_MAP[normalized])) {
      mapping[header] = AUTO_MAP[normalized];
      usedFields.add(AUTO_MAP[normalized]);
      return;
    }

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

/** Queue import job for background processing */
export function useImportContacts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({
      rows,
      fieldMapping,
      fileName,
      importTags = [],
    }: {
      rows: Record<string, string>[];
      fieldMapping: Record<string, string>;
      fileName: string;
      importTags?: string[];
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado.');

      let organizationId = currentOrganization?.id ?? null;
      if (!organizationId) {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        organizationId = membership?.organization_id ?? null;
      }
      if (!organizationId) throw new Error('Nenhuma organização ativa encontrada.');

      // Create the job with data embedded
      const { data: job, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          file_name: fileName,
          total_rows: rows.length,
          field_mapping: fieldMapping,
          import_data: rows,
          import_tags: importTags,
          status: 'pending',
        } as any)
        .select()
        .single();

      if (jobError) throw jobError;

      // Fire edge function (non-blocking)
      supabase.functions.invoke('process-import', {
        body: { jobId: job.id },
      }).catch(console.error);

      return { jobId: job.id, totalRows: rows.length };
    },
    onSuccess: ({ totalRows }) => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
      toast.success(`${totalRows} leads inseridos na fila de processamento!`);
    },
    onError: (error) => {
      toast.error('Erro ao enfileirar importação: ' + error.message);
    },
  });
}

/** Fetch import jobs for the current organization */
export function useImportJobs() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['import-jobs', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('id, user_id, organization_id, file_name, total_rows, processed_rows, success_count, error_count, status, errors, field_mapping, created_at, completed_at')
        .eq('organization_id', currentOrganization?.id ?? '')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ImportJob[];
    },
    enabled: !!user?.id && !!currentOrganization?.id,
    refetchInterval: 5000, // Poll for progress updates
  });
}
