import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react';
import { parseCSV, CONTACT_FIELDS, autoMapHeaders, useImportContacts } from '@/hooks/useImportContacts';

interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'result';

export function ImportContactsDialog({ open, onOpenChange }: ImportContactsDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errorCount: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);

  const importContacts = useImportContacts();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers: parsedHeaders, rows: parsedRows } = parseCSV(text);
      
      setHeaders(parsedHeaders);
      setRows(parsedRows);
      setFieldMapping(autoMapHeaders(parsedHeaders));
      setStep('mapping');
    };

    reader.readAsText(file);
  }, []);

  const handleMappingChange = (csvField: string, contactField: string) => {
    setFieldMapping((prev) => ({ ...prev, [csvField]: contactField }));
  };

  const handleImport = async () => {
    const result = await importContacts.mutateAsync({
      rows,
      fieldMapping,
      fileName,
    });
    setImportResult(result);
    setStep('result');
  };

  const handleClose = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setFieldMapping({});
    setImportResult(null);
    onOpenChange(false);
  };

  const isFirstNameMapped = Object.values(fieldMapping).includes('first_name');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Importar Contatos</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Faça upload de um arquivo CSV com seus contatos'}
            {step === 'mapping' && 'Mapeie as colunas do arquivo para os campos de contato'}
            {step === 'preview' && 'Confira os dados antes de importar'}
            {step === 'result' && 'Resultado da importação'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="rounded-full bg-muted p-6">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Formatos aceitos: CSV (separado por vírgula ou ponto-e-vírgula)
              </p>
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  <Upload className="h-4 w-4" />
                  Selecionar Arquivo
                </div>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </Label>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                {fileName} - {rows.length} linhas encontradas
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coluna do Arquivo</TableHead>
                    <TableHead>Campo no Sistema</TableHead>
                    <TableHead>Exemplo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headers.map((header) => (
                    <TableRow key={header}>
                      <TableCell className="font-medium">{header}</TableCell>
                      <TableCell>
                        <Select
                          value={fieldMapping[header] || 'ignore'}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">— Ignorar —</SelectItem>
                            {CONTACT_FIELDS.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label} {field.required && '*'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {rows[0]?.[header] || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!isFirstNameMapped && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  O campo "Nome" é obrigatório. Mapeie uma coluna para ele.
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {step === 'preview' && (
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {CONTACT_FIELDS.filter((f) =>
                    Object.values(fieldMapping).includes(f.key)
                  ).map((field) => (
                    <TableHead key={field.key}>{field.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 10).map((row, index) => (
                  <TableRow key={index}>
                    {CONTACT_FIELDS.filter((f) =>
                      Object.values(fieldMapping).includes(f.key)
                    ).map((field) => {
                      const csvField = Object.entries(fieldMapping).find(
                        ([, v]) => v === field.key
                      )?.[0];
                      return (
                        <TableCell key={field.key}>
                          {csvField ? row[csvField] || '-' : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > 10 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                ... e mais {rows.length - 10} linhas
              </p>
            )}
          </ScrollArea>
        )}

        {step === 'result' && importResult && (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mx-auto w-fit mb-2">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {importResult.successCount}
                </p>
                <p className="text-sm text-muted-foreground">Importados</p>
              </div>

              {importResult.errorCount > 0 && (
                <div className="text-center">
                  <div className="rounded-full bg-destructive/10 p-3 mx-auto w-fit mb-2">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <p className="text-2xl font-bold text-destructive">
                    {importResult.errorCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              )}
            </div>

            {importResult.errors.length > 0 && (
              <ScrollArea className="max-h-[200px] border rounded-md p-4">
                <p className="text-sm font-medium mb-2">Detalhes dos erros:</p>
                {importResult.errors.slice(0, 20).map((error, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    Linha {error.row}: {error.message}
                  </p>
                ))}
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Voltar
              </Button>
              <Button onClick={() => setStep('preview')} disabled={!isFirstNameMapped}>
                Próximo
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={importContacts.isPending}>
                {importContacts.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Importar {rows.length} contatos
              </Button>
            </>
          )}

          {step === 'result' && (
            <Button onClick={handleClose}>Concluir</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
