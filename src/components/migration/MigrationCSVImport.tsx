import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  platformName: string;
}

const CONTACT_FIELDS = [
  { key: 'ignore', label: '— Ignorar —' },
  { key: 'first_name', label: 'Nome' },
  { key: 'last_name', label: 'Sobrenome' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telefone' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'position', label: 'Cargo' },
  { key: 'source', label: 'Origem' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Observações' },
  { key: 'tags', label: 'Tags (separadas por vírgula)' },
];

function parseCSV(text: string) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(/[,;]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = line.split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
  return { headers, rows };
}

export function MigrationCSVImport({ platformName }: Props) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const text = await f.text();
    const data = parseCSV(text);
    setParsed(data);
    // Auto-map common fields
    const autoMap: Record<string, string> = {};
    const commonMaps: Record<string, string> = {
      nome: 'first_name', name: 'first_name', first_name: 'first_name', 'primeiro nome': 'first_name',
      sobrenome: 'last_name', last_name: 'last_name',
      email: 'email', 'e-mail': 'email',
      telefone: 'phone', phone: 'phone', celular: 'phone',
      whatsapp: 'whatsapp', wpp: 'whatsapp',
      cargo: 'position', position: 'position',
      origem: 'source', source: 'source',
      status: 'status',
      tags: 'tags', tag: 'tags',
      observações: 'notes', notes: 'notes', observacoes: 'notes',
    };
    data.headers.forEach(h => {
      const key = h.toLowerCase().trim();
      if (commonMaps[key]) autoMap[h] = commonMaps[key];
    });
    setMapping(autoMap);
  }, []);

  const handleImport = async () => {
    if (!parsed || !user) return;
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const row of parsed.rows) {
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

        for (const [csvField, contactField] of Object.entries(mapping)) {
          if (!contactField || contactField === 'ignore' || !row[csvField]) continue;
          const val = row[csvField];
          switch (contactField) {
            case 'first_name': firstName = val; break;
            case 'last_name': lastName = val; break;
            case 'email': email = val; break;
            case 'phone': phone = val; break;
            case 'whatsapp': whatsapp = val; break;
            case 'position': position = val; break;
            case 'source': source = val; break;
            case 'status': status = val; break;
            case 'notes': notes = val; break;
            case 'tags': tagsStr = val; break;
          }
        }

        if (!firstName) { errorCount++; continue; }

        const { data: contact, error } = await supabase.from('contacts').insert({
          first_name: firstName,
          last_name: lastName,
          email, phone, whatsapp, position,
          source: source || platformName,
          status, notes,
          user_id: user.id,
          organization_id: currentOrganization?.id || null,
        }).select('id').single();

        if (error) { errorCount++; continue; }

        // Handle tags
        if (tagsStr && contact) {
          const tagNames = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
          for (const tagName of tagNames) {
            // Find or create tag
            let tagId: string | null = null;
            const { data: existing } = await supabase.from('tags')
              .select('id').eq('name', tagName)
              .eq('organization_id', currentOrganization?.id || '')
              .maybeSingle();
            if (existing) {
              tagId = existing.id;
            } else {
              const { data: newTag } = await supabase.from('tags').insert({
                name: tagName,
                color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
                user_id: user.id,
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

      setResult({ success: successCount, errors: errorCount });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success(`Migração concluída: ${successCount} contatos importados!`);
    } catch (err: any) {
      toast.error('Erro na importação: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar Contatos via CSV
        </CardTitle>
        <CardDescription>
          Exporte seus contatos de {platformName} como CSV e importe aqui com mapeamento automático de campos e tags.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" id="csv-upload" />
          <label htmlFor="csv-upload" className="cursor-pointer space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-medium">{file ? file.name : 'Clique para selecionar arquivo CSV'}</p>
            <p className="text-xs text-muted-foreground">Formatos: .csv, .txt (separado por vírgula ou ponto-e-vírgula)</p>
          </label>
        </div>

        {parsed && parsed.headers.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{parsed.rows.length} registros encontrados</Badge>
              <Badge variant="outline">{parsed.headers.length} colunas</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Mapeamento de campos:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {parsed.headers.map(header => (
                  <div key={header} className="flex items-center gap-2 p-2 bg-accent/30 rounded-lg">
                    <span className="text-sm font-mono flex-1 truncate">{header}</span>
                    <span className="text-muted-foreground">→</span>
                    <Select value={mapping[header] || 'ignore'} onValueChange={v => setMapping(prev => ({ ...prev, [header]: v }))}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_FIELDS.map(f => (
                          <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleImport} disabled={importing || !Object.values(mapping).includes('first_name')} className="w-full">
              {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando...</> : `Importar ${parsed.rows.length} contatos`}
            </Button>
          </>
        )}

        {result && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
            {result.errors === 0 ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-yellow-500" />}
            <div>
              <p className="font-medium">{result.success} contatos importados com sucesso</p>
              {result.errors > 0 && <p className="text-sm text-muted-foreground">{result.errors} registros com erro</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
