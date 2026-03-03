import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Globe, CheckCircle, XCircle, Clock, RefreshCw, Trash2, Copy,
  Shield, Mail, AlertTriangle, Info
} from 'lucide-react';
import { toast } from 'sonner';

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copiado!');
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'verified':
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircle className="h-3 w-3 mr-1" /> Verificado
        </Badge>
      );
    case 'verifying':
      return (
        <Badge variant="secondary">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Verificando
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" /> Falhou
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-400">
          <Clock className="h-3 w-3 mr-1" /> Ação necessária
        </Badge>
      );
  }
}

interface DomainCardProps {
  domain: any;
  onVerify: (id: string) => void;
  onDelete: (id: string) => void;
  isVerifying: boolean;
}

export default function DomainCard({ domain, onVerify, onDelete, isVerifying }: DomainCardProps) {

  const dnsChecks = [
    { label: 'SPF', verified: domain.spf_verified },
    { label: 'DKIM', verified: domain.dkim_verified },
    { label: 'DMARC', verified: domain.dmarc_verified },
    { label: 'MX', verified: domain.mx_verified },
  ];

  const providerDnsRecords = Array.isArray(domain.dns_records) ? domain.dns_records : [];
  const hasRecord = (key: string) => providerDnsRecords.some((r: any) => String(r?.purpose || '').toLowerCase().includes(key));
  const displayDnsRecords = [
    ...providerDnsRecords,
    ...(!hasRecord('spf') ? [{ type: 'TXT', purpose: 'SPF', host: '@', name: domain.domain, zone: domain.domain, value: 'v=spf1 include:resend.com ~all', ttl: 'auto' }] : []),
    ...(!hasRecord('dkim') ? [{ type: 'CNAME', purpose: 'DKIM', host: 'default._domainkey', name: `default._domainkey.${domain.domain}`, zone: domain.domain, value: 'Clique em "Verificar" para obter o valor DKIM do provedor', ttl: 'auto' }] : []),
    ...(!hasRecord('dmarc') ? [{ type: 'TXT', purpose: 'DMARC', host: '_dmarc', name: `_dmarc.${domain.domain}`, zone: domain.domain, value: 'v=DMARC1; p=quarantine', ttl: 'auto' }] : []),
    ...(!hasRecord('mx') ? [{ type: 'MX', purpose: 'MX (Mail)', host: 'mail', name: `mail.${domain.domain}`, zone: domain.domain, value: 'Clique em "Verificar" para obter os registros MX do provedor', priority: 10, ttl: 'auto' }] : []),
  ];

  const allVerified = domain.status === 'verified';

  const isPendingRecord = (record: any) => {
    const purpose = String(record?.purpose || '').toLowerCase();
    if (purpose.includes('spf')) return !domain.spf_verified;
    if (purpose.includes('dkim')) return !domain.dkim_verified;
    if (purpose.includes('dmarc')) return !domain.dmarc_verified;
    if (purpose.includes('mx')) return !domain.mx_verified;
    return false;
  };

  const pendingRecords = displayDnsRecords.filter(isPendingRecord);

  const formatRecordForCopy = (record: any) => {
    return [
      `Tipo: ${record.type || ''}`,
      `Host: ${record.host || record.name || ''}`,
      `Valor: ${record.value || ''}`,
      `Prioridade: ${record.priority ?? '-'}`,
      `TTL: ${record.ttl || 'auto'}`,
    ].join('\n');
  };

  const copyAllPendingRecords = () => {
    if (!pendingRecords.length) {
      toast.success('Nenhum registro pendente.');
      return;
    }

    const text = pendingRecords
      .map((record: any) => `--- ${record.purpose || record.type} ---\n${formatRecordForCopy(record)}`)
      .join('\n\n');

    copyToClipboard(text);
  };

  return (
    <Card className={`transition-all ${allVerified ? 'border-green-200 dark:border-green-900' : 'border-yellow-200 dark:border-yellow-900'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
              allVerified ? 'bg-green-100 dark:bg-green-950' : 'bg-yellow-100 dark:bg-yellow-950'
            }`}>
              <Globe className={`h-5 w-5 ${allVerified ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg">{domain.domain}</CardTitle>
              {domain.from_email && (
                <CardDescription className="flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3" />
                  {domain.from_name ? `${domain.from_name} <${domain.from_email}>` : domain.from_email}
                </CardDescription>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={domain.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVerify(domain.id)}
              disabled={isVerifying}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isVerifying ? 'animate-spin' : ''}`} />
              {allVerified ? 'Reverificar' : 'Verificar'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover domínio?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ao remover <strong>{domain.domain}</strong>, os e-mails passarão a ser enviados pelo domínio padrão.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(domain.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* DNS Status Grid */}
        <div className="grid grid-cols-4 gap-2">
          {dnsChecks.map((check) => (
            <div
              key={check.label}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm font-medium ${
                check.verified
                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {check.verified ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {check.label}
              </div>
              {!check.verified && (
                <span className="text-[10px] font-normal opacity-80">Não configurado</span>
              )}
            </div>
          ))}
        </div>

        {/* Missing DNS details */}
        {!allVerified && dnsChecks.some(c => !c.verified) && (
          <div className="space-y-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <p className="text-sm font-medium text-red-800 dark:text-red-300 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Registros DNS pendentes:
            </p>
            <ul className="text-xs text-red-700 dark:text-red-400 space-y-1.5 ml-5">
              {!domain.spf_verified && (
                <li className="list-disc">
                  <strong>SPF:</strong> Adicione um registro TXT no domínio raiz com valor contendo <code className="bg-red-100 dark:bg-red-900 px-1 rounded">v=spf1 include:resend.com ~all</code>
                </li>
              )}
              {!domain.dkim_verified && (
                <li className="list-disc">
                  <strong>DKIM:</strong> Adicione o registro CNAME <code className="bg-red-100 dark:bg-red-900 px-1 rounded">default._domainkey.{domain.domain}</code> conforme indicado abaixo
                </li>
              )}
              {!domain.dmarc_verified && (
                <li className="list-disc">
                  <strong>DMARC:</strong> Adicione registro TXT em <code className="bg-red-100 dark:bg-red-900 px-1 rounded">_dmarc.{domain.domain}</code> com <code className="bg-red-100 dark:bg-red-900 px-1 rounded">v=DMARC1; p=quarantine</code>
                </li>
              )}
              {!domain.mx_verified && (
                <li className="list-disc">
                  <strong>MX:</strong> Configure registros MX no seu provedor de DNS para recebimento de e-mails
                </li>
              )}
            </ul>
          </div>
        )}

        {domain.verification_error && !allVerified && (
          <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/50 p-3 rounded-lg">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {domain.verification_error}
          </div>
        )}

        {/* DNS Copy Checklist */}
        {!allVerified && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-muted/20">
              <div>
                <p className="text-sm font-medium">Registros DNS para configurar agora</p>
                <p className="text-xs text-muted-foreground">Copie e cole no seu provedor DNS. Depois clique em "Verificar".</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyAllPendingRecords} disabled={pendingRecords.length === 0}>
                <Copy className="h-4 w-4 mr-1" />
                Copiar pendentes
              </Button>
            </div>

            {(pendingRecords.length > 0 ? pendingRecords : displayDnsRecords).map((record: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{record.type}</Badge>
                    <span className="text-sm font-medium text-primary">{record.purpose}</span>
                    {isPendingRecord(record) && <Badge variant="destructive">Pendente</Badge>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(formatRecordForCopy(record))}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar registro
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-primary/5 border border-primary/20 px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-muted-foreground mb-1">Host</p>
                      <code className="font-semibold break-all">{record.host || record.name}</code>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(record.host || record.name)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="rounded bg-muted/50 px-3 py-2">
                    <p className="text-muted-foreground mb-1">Tipo</p>
                    <code>{record.type}</code>
                  </div>
                  <div className="rounded bg-primary/5 border border-primary/20 px-3 py-2 md:col-span-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-muted-foreground mb-1">Valor</p>
                      <code className="break-all">{record.value}</code>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(record.value)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {record.priority && (
                    <div className="rounded bg-primary/5 border border-primary/20 px-3 py-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-muted-foreground mb-1">Prioridade</p>
                        <code>{record.priority}</code>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(String(record.priority))}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="rounded bg-muted/50 px-3 py-2">
                    <p className="text-muted-foreground mb-1">TTL</p>
                    <code>{record.ttl || 'auto'}</code>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Use o campo <strong>Host</strong> no seu provedor DNS. O FQDN é só referência. Após salvar os 4 registros, clique em "Verificar".</p>
            </div>
          </div>
        )}

        {allVerified && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/50 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Domínio configurado e pronto para envio de e-mails.
          </div>
        )}

        {domain.last_verified_at && (
          <p className="text-xs text-muted-foreground">
            Última verificação: {new Date(domain.last_verified_at).toLocaleString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
