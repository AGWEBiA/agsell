import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Globe, ArrowRight, ArrowLeft, Copy, CheckCircle, XCircle,
  RefreshCw, Loader2, Mail, Shield, Info, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 'domain' | 'sender' | 'dns_txt' | 'dns_cname' | 'dns_mx';

interface DomainSetupWizardProps {
  onComplete: (data: { domain: string; from_email?: string; from_name?: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copiado para a área de transferência!');
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step; label: string; number: number }[] = [
    { key: 'domain', label: 'Domínio', number: 1 },
    { key: 'sender', label: 'Remetente', number: 2 },
    { key: 'dns_txt', label: 'TXT', number: 3 },
    { key: 'dns_cname', label: 'CNAME', number: 4 },
    { key: 'dns_mx', label: 'MX', number: 5 },
  ];

  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => {
        const isActive = i === currentIndex;
        const isCompleted = i < currentIndex;
        return (
          <React.Fragment key={step.key}>
            {i > 0 && (
              <div className={`h-px w-8 md:w-12 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium transition-colors ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : step.number}
              </div>
              <span className={`text-sm hidden sm:inline ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  purpose: string;
  priority?: string;
}

function DnsRecordTable({ records, type }: { records: DnsRecord[]; type: string }) {
  const hasPriority = records.some(r => r.priority);

  return (
    <div className="space-y-3">
      {records.map((record, i) => (
        <div key={i} className="rounded-lg border overflow-hidden">
          <div className="grid gap-3 p-3" style={{ gridTemplateColumns: hasPriority ? '80px 1fr 80px 1fr' : '80px 1fr 1fr' }}>
            {/* Type */}
            <div>
              <p className="text-[10px] font-medium text-red-500 uppercase mb-1">Tipo</p>
              <div className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1.5">
                <span className="text-xs font-mono">{record.type}</span>
              </div>
            </div>
            {/* Name/Prefix */}
            <div>
              <p className="text-[10px] font-medium text-red-500 uppercase mb-1">Prefixo ou Nome</p>
              <div className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1.5">
                <span className="text-xs font-mono flex-1 truncate">{record.name}</span>
                <button onClick={() => copyToClipboard(record.name)} className="shrink-0 hover:text-primary">
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
            {/* Priority (MX only) */}
            {hasPriority && (
              <div>
                <p className="text-[10px] font-medium text-red-500 uppercase mb-1">Prioridade</p>
                <div className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1.5">
                  <span className="text-xs font-mono flex-1">{record.priority || '-'}</span>
                  {record.priority && (
                    <button onClick={() => copyToClipboard(record.priority!)} className="shrink-0 hover:text-primary">
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* Value */}
            <div>
              <p className="text-[10px] font-medium text-red-500 uppercase mb-1">{hasPriority ? 'Valor / Nome do Servidor' : 'Valor'}</p>
              <div className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1.5">
                <span className="text-xs font-mono flex-1 truncate">{record.value}</span>
                <button onClick={() => copyToClipboard(record.value)} className="shrink-0 hover:text-primary">
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DnsStepHeader({ title, badgeColor, description }: { title: string; badgeColor: string; description: string }) {
  return (
    <div className="space-y-3">
      {/* Warmup warning banner */}
      <div className="rounded-lg bg-orange-500 p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-white mt-0.5 shrink-0" />
        <div className="text-sm text-white">
          <p>Seu e-mail foi verificado e está em processo de aquecimento, a fim de prevenir spams e bloqueios em seu domínio.</p>
          <a href="#" className="underline text-white/90 text-xs">Saiba mais sobre aquecimento clicando aqui.</a>
        </div>
      </div>

      {/* DNS info box */}
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span className="text-sm font-semibold">Configuração de DNS:</span>
        </div>
        <p className="text-xs text-muted-foreground">
          No site onde você comprou o domínio, acesse a seção de Configuração de DNS. Lá, adicione os registros com os dados fornecidos abaixo para habilitar o envio de e-mails através do sistema. O campo TTL pode ser mantido como padrão, pois não influencia neste processo.
        </p>
      </div>

      {/* Type badge + description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Configuração do tipo:</span>
          <Badge className={badgeColor}>{title}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function DnsStepFooter({ onBack, onNext, nextLabel = 'Próximo', isPending = false }: { onBack: () => void; onNext: () => void; nextLabel?: string; isPending?: boolean }) {
  return (
    <div className="flex items-center justify-between pt-4">
      <Button variant="outline" onClick={onBack}>VOLTAR</Button>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => window.open('https://docs.agsell.com.br/configurar-dns', '_blank')}>
          <ExternalLink className="h-4 w-4 mr-1" />
          COMO CONFIGURAR
        </Button>
        <Button onClick={onNext} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

export default function DomainSetupWizard({ onComplete, onCancel, isPending }: DomainSetupWizardProps) {
  const [step, setStep] = useState<Step>('domain');
  const [domain, setDomain] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');

  const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
  const isValidDomain = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleanDomain);

  const txtRecords: DnsRecord[] = [
    { type: 'TXT', name: cleanDomain, value: `v=spf1 include:api-mail.com ~all`, purpose: 'SPF' },
    { type: 'TXT', name: `sfx._domainkey.${cleanDomain}`, value: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCZ...`, purpose: 'DKIM' },
    { type: 'TXT', name: `2019._domainkey.${cleanDomain}`, value: `v=DKIM1;k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDtxUPa+eN7CAvz2Xv...`, purpose: 'DKIM 2' },
    { type: 'TXT', name: `_dmarc.${cleanDomain}`, value: `v=DMARC1; p=none; sp=none; rua=mailto:suporte@${cleanDomain}; ruf=mailto:ruf@${cleanDomain}`, purpose: 'DMARC' },
  ];

  const cnameRecords: DnsRecord[] = [
    { type: 'CNAME', name: `email`, value: 'email2.api-mail.com', purpose: 'Email Routing' },
  ];

  const mxRecords: DnsRecord[] = [
    { type: 'MX', name: cleanDomain, value: 'mxa.api-mail.com', priority: '10', purpose: 'MX Primário' },
    { type: 'MX', name: cleanDomain, value: 'mxb.api-mail.com', priority: '10', purpose: 'MX Secundário' },
  ];

  const handleSubmit = () => {
    onComplete({
      domain: cleanDomain,
      from_email: fromEmail || undefined,
      from_name: fromName || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={step} />

      {step === 'domain' && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Qual domínio você quer usar?</h2>
              <p className="text-sm text-muted-foreground">
                Insira o domínio do qual deseja enviar e-mails (ex: suaempresa.com.br)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain-input">Domínio</Label>
              <Input
                id="domain-input"
                placeholder="suaempresa.com.br"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="text-center text-lg h-12"
                autoFocus
              />
              {domain && !isValidDomain && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Digite um domínio válido (sem "www", "https://" ou caminhos)
                </p>
              )}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
              <Button onClick={() => setStep('sender')} disabled={!isValidDomain}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'sender' && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Configurar remetente</h2>
              <p className="text-sm text-muted-foreground">
                Defina como seus e-mails aparecerão para os destinatários
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="from-email">E-mail remetente</Label>
                <Input id="from-email" placeholder={`noreply@${cleanDomain}`} value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
                <p className="text-xs text-muted-foreground">Padrão: noreply@{cleanDomain}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-name">Nome do remetente</Label>
                <Input id="from-name" placeholder="Sua Empresa" value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </div>
            </div>
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Pré-visualização:</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{fromName || 'Sua Empresa'}</p>
                  <p className="text-xs text-muted-foreground">{fromEmail || `noreply@${cleanDomain}`}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep('domain')}>
                <ArrowLeft className="h-4 w-4 mr-2" />Voltar
              </Button>
              <Button onClick={() => setStep('dns_txt')}>
                Continuar<ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DNS TXT Step */}
      {step === 'dns_txt' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">DNS de E-mail · {cleanDomain}</h2>
            <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" />example@{cleanDomain}</Badge>
          </div>
          <DnsStepHeader
            title="TXT"
            badgeColor="bg-primary"
            description="O registro TXT é um tipo de configuração no DNS que permite armazenar informações textuais associadas a um domínio. É comumente utilizado para especificar dados diversos, como verificações de propriedade, políticas de email (SPF, DKIM), e outras instruções relevantes."
          />
          <DnsRecordTable records={txtRecords} type="TXT" />
          <DnsStepFooter onBack={() => setStep('sender')} onNext={() => setStep('dns_cname')} />
        </div>
      )}

      {/* DNS CNAME Step */}
      {step === 'dns_cname' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">DNS de E-mail · {cleanDomain}</h2>
            <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" />example@{cleanDomain}</Badge>
          </div>
          <DnsStepHeader
            title="CNAME"
            badgeColor="bg-green-600"
            description="O registro CNAME no DNS permite que um domínio ou subdomínio aponte para outro domínio. Isso simplifica a gestão de subdomínios e facilita redirecionamentos, pois todas as alterações são centralizadas no domínio principal."
          />
          <DnsRecordTable records={cnameRecords} type="CNAME" />
          <DnsStepFooter onBack={() => setStep('dns_txt')} onNext={() => setStep('dns_mx')} />
        </div>
      )}

      {/* DNS MX Step */}
      {step === 'dns_mx' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">DNS de E-mail · {cleanDomain}</h2>
            <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" />example@{cleanDomain}</Badge>
          </div>
          <DnsStepHeader
            title="MX"
            badgeColor="bg-orange-600"
            description="O registro MX (Mail Exchange) no DNS especifica servidores de email responsáveis por receber mensagens para um domínio. Ele prioriza quais servidores devem ser contactados primeiro, garantindo a entrega eficiente dos emails."
          />
          <DnsRecordTable records={mxRecords} type="MX" />
          <DnsStepFooter onBack={() => setStep('dns_cname')} onNext={handleSubmit} nextLabel="CONCLUIR" isPending={isPending} />
        </div>
      )}
    </div>
  );
}
