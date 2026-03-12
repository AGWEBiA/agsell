import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table as TableIcon, Upload, Download, RefreshCw, Link2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export function GoogleSheetsIntegration() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const appsScriptSync = `// Script para sincronizar Google Sheets → AG Sell em tempo real
// Funciona como um "mini webhook" que envia cada nova linha adicionada

// 1. Substitua pela URL do seu webhook de entrada do AG Sell
var WEBHOOK_URL = "COLE_SUA_URL_DE_WEBHOOK_AQUI";

// 2. Defina os nomes das colunas na primeira linha da planilha
// O script usa os cabeçalhos como chave dos dados

function onEdit(e) {
  // Só processa se for uma edição na sheet correta
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  
  // Ignora edições na primeira linha (cabeçalhos)
  if (range.getRow() === 1) return;
  
  // Pega os cabeçalhos
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = sheet.getRange(range.getRow(), 1, 1, sheet.getLastColumn()).getValues()[0];
  
  var data = {};
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] && rowData[i]) {
      var key = headers[i].toString().toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');
      
      if (/nome|name/i.test(headers[i])) key = 'nome';
      if (/e-?mail/i.test(headers[i])) key = 'email';
      if (/telefone|phone|celular/i.test(headers[i])) key = 'telefone';
      if (/whatsapp|wpp/i.test(headers[i])) key = 'whatsapp';
      
      data[key] = rowData[i].toString();
    }
  }
  
  data['_source'] = 'google_sheets';
  data['_sheet_name'] = sheet.getName();
  data['_row'] = range.getRow();
  data['_synced_at'] = new Date().toISOString();
  
  var options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(WEBHOOK_URL, options);
  } catch (error) {
    Logger.log('Erro: ' + error.toString());
  }
}

// Função para importar todos os dados existentes de uma vez
function syncAll() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  
  var records = [];
  for (var r = 0; r < data.length; r++) {
    var record = {};
    for (var c = 0; c < headers.length; c++) {
      if (headers[c] && data[r][c]) {
        var key = headers[c].toString().toLowerCase()
          .replace(/[^a-z0-9]/g, '_');
        if (/nome|name/i.test(headers[c])) key = 'nome';
        if (/e-?mail/i.test(headers[c])) key = 'email';
        if (/telefone|phone/i.test(headers[c])) key = 'telefone';
        record[key] = data[r][c].toString();
      }
    }
    record['_source'] = 'google_sheets';
    records.push(record);
  }
  
  // Envia em lotes de 50
  for (var i = 0; i < records.length; i += 50) {
    var batch = records.slice(i, i + 50);
    var options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify({ batch: batch, _source: 'google_sheets_bulk' }),
      muteHttpExceptions: true
    };
    try {
      UrlFetchApp.fetch(WEBHOOK_URL, options);
      Utilities.sleep(500); // Rate limiting
    } catch (error) {
      Logger.log('Erro no lote ' + i + ': ' + error.toString());
    }
  }
  
  SpreadsheetApp.getUi().alert('Sincronização concluída! ' + records.length + ' registros enviados.');
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appsScriptSync);
    setCopied(true);
    toast.success('Script copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-green-400">
              <TableIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Sheets ↔ AG Sell</CardTitle>
              <CardDescription>
                Sincronize dados entre planilhas Google e o CRM
              </CardDescription>
            </div>
            <Badge variant="secondary" className="ml-auto">Apps Script</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="import" className="flex-1 gap-2">
                <Upload className="h-4 w-4" />
                Importar do Sheets
              </TabsTrigger>
              <TabsTrigger value="realtime" className="flex-1 gap-2">
                <RefreshCw className="h-4 w-4" />
                Sync em Tempo Real
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="mt-6 space-y-4">
              <div className="bg-accent/50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">📋 Importação em Lote</h4>
                <p className="text-sm text-muted-foreground">
                  Use a função <code>syncAll()</code> no script abaixo para importar todos os dados existentes de uma planilha para o AG Sell de uma vez. Ideal para migração inicial.
                </p>
              </div>

              <div className="space-y-2">
                <Label>URL do Webhook de Entrada</Label>
                <Input
                  placeholder="Cole a URL do webhook criado no AG Sell"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Script de Sincronização</h4>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto max-h-52 overflow-y-auto border">
                  <code>{appsScriptSync}</code>
                </pre>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>1. Abra sua planilha Google Sheets</p>
                <p>2. Vá em <strong>Extensões → Apps Script</strong></p>
                <p>3. Cole o código e substitua a URL do webhook</p>
                <p>4. Execute <code>syncAll()</code> para importação inicial</p>
                <p>5. Configure o gatilho <code>onEdit</code> para sync automático</p>
              </div>
            </TabsContent>

            <TabsContent value="realtime" className="mt-6 space-y-4">
              <div className="bg-accent/50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">⚡ Sincronização em Tempo Real</h4>
                <p className="text-sm text-muted-foreground">
                  O mesmo script inclui a função <code>onEdit()</code> que envia automaticamente cada nova linha editada para o AG Sell via webhook.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-dashed">
                  <CardContent className="pt-4 text-center space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-green-500" />
                    <p className="font-medium text-sm">Sheets → AG Sell</p>
                    <p className="text-xs text-muted-foreground">
                      Novas linhas na planilha criam contatos automaticamente no CRM
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="pt-4 text-center space-y-2">
                    <Download className="h-8 w-8 mx-auto text-blue-500" />
                    <p className="font-medium text-sm">AG Sell → Sheets</p>
                    <p className="text-xs text-muted-foreground">
                      Use a <strong>API pública</strong> do AG Sell para puxar dados do CRM para o Sheets
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Campos mapeados automaticamente
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Coluna "Nome"</span>
                    <span>→</span>
                    <code>first_name</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Coluna "Email"</span>
                    <span>→</span>
                    <code>email</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Coluna "Telefone"</span>
                    <span>→</span>
                    <code>phone</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Coluna "WhatsApp"</span>
                    <span>→</span>
                    <code>whatsapp</code>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
