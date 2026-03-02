import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Globe, Mail, Shield, Activity, Settings, X,
} from 'lucide-react';
import DomainCard from './DomainCard';
import MailboxManager from './MailboxManager';

interface DomainConfigDashboardProps {
  domain: any;
  onVerify: (id: string) => void;
  onDelete: (id: string) => void;
  isVerifying: boolean;
}

const menuItems = [
  { key: 'dns', label: 'DNS de E-mail', description: 'Configurações DNS para envio de email.', icon: Shield },
  { key: 'mailboxes', label: 'Caixas postais', description: 'Faça a configuração das suas caixas postais.', icon: Mail },
  { key: 'dns_page', label: 'DNS da Página/Site', description: 'Faça a configuração do seu domínio para utilizar ele nas páginas criadas no seu Funil.', icon: Globe },
  { key: 'home', label: 'Home', description: 'Faça a configuração da página home do seu domínio.', icon: Globe },
  { key: 'health', label: 'Saúde do domínio', description: 'Acompanhe a saúde do seu domínio com base nos envios realizados.', icon: Activity },
  { key: 'limits', label: 'Configuração de limite de e-mails', description: 'Faça alterações referentes aos envios de e-mail deste domínio.', icon: Settings },
];

export default function DomainConfigDashboard({ domain, onVerify, onDelete, isVerifying }: DomainConfigDashboardProps) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <>
      {/* Domain card with config button */}
      <div className="relative">
        <DomainCard domain={domain} onVerify={onVerify} onDelete={onDelete} isVerifying={isVerifying} />
        <div className="mt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurações do Domínio
          </Button>
        </div>
      </div>

      {/* Dashboard Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {domain.domain}
              <span className="text-sm font-normal text-muted-foreground">Configurações de domínio</span>
            </DialogTitle>
          </DialogHeader>

          {!activeSection ? (
            <div className="grid grid-cols-2 gap-3 py-2">
              {menuItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className="flex items-start gap-3 p-4 rounded-xl border hover:border-primary/40 hover:bg-accent/50 transition-all text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)}>
                ← Voltar
              </Button>

              {activeSection === 'dns' && (
                <DomainCard domain={domain} onVerify={onVerify} onDelete={onDelete} isVerifying={isVerifying} />
              )}

              {activeSection === 'mailboxes' && (
                <MailboxManager domainId={domain.id} domain={domain.domain} />
              )}

              {activeSection === 'dns_page' && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold">DNS da Página/Site</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure o domínio para utilizar ele nas páginas criadas no seu Funil no sistema.
                    </p>
                    <div className="mt-4 p-3 rounded-lg border text-left">
                      <p className="text-xs text-muted-foreground mb-2">Aponte o registro abaixo no DNS do seu domínio:</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><span className="font-medium">Tipo</span><p className="text-muted-foreground">A</p></div>
                        <div><span className="font-medium">Nome</span><p className="text-muted-foreground">@</p></div>
                        <div><span className="font-medium">Valor</span><p className="text-muted-foreground">185.158.133.1</p></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === 'home' && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold">Página Home</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure a página home do seu domínio. Quando alguém acessar {domain.domain}, será redirecionado para a página configurada aqui.
                    </p>
                  </CardContent>
                </Card>
              )}

              {activeSection === 'health' && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold">Saúde do Domínio</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Monitoramento de reputação, bounce rate e spam reports será disponibilizado conforme envios forem realizados.
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
                        <p className="text-2xl font-bold text-green-600">-</p>
                        <p className="text-xs text-muted-foreground">Entregues</p>
                      </div>
                      <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 p-3">
                        <p className="text-2xl font-bold text-yellow-600">-</p>
                        <p className="text-xs text-muted-foreground">Bounce</p>
                      </div>
                      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
                        <p className="text-2xl font-bold text-red-600">-</p>
                        <p className="text-xs text-muted-foreground">Spam</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === 'limits' && (
                <Card>
                  <CardContent className="py-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Limites de Envio</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Configure limites diários de envio por caixa postal para evitar bloqueios e manter a reputação do domínio.
                    </p>
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Limite diário por caixa postal</span>
                        <span className="text-sm font-semibold">500 e-mails</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Intervalo entre envios</span>
                        <span className="text-sm font-semibold">2 segundos</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Aquecimento automático</span>
                        <span className="text-sm font-semibold text-green-600">Ativo</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => { setActiveSection(null); setOpen(false); }}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
