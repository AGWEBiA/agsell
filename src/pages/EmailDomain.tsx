import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Plus, Mail, AlertCircle } from 'lucide-react';
import { useEmailDomains } from '@/hooks/useEmailDomains';
import { useOrganization } from '@/contexts/OrganizationContext';
import DomainSetupWizard from '@/components/email-domain/DomainSetupWizard';
import DomainCard from '@/components/email-domain/DomainCard';

export default function EmailDomain() {
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { domains, isLoading, addDomain, verifyDomain, deleteDomain } = useEmailDomains();
  const [showWizard, setShowWizard] = useState(false);

  const handleWizardComplete = (data: { domain: string; from_email?: string; from_name?: string }) => {
    addDomain.mutate(data, {
      onSuccess: () => setShowWizard(false),
    });
  };

  if (orgLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Nenhuma organização selecionada</h2>
        <p className="text-muted-foreground">Selecione ou crie uma organização para configurar domínios de e-mail.</p>
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Conectar Domínio de E-mail</h1>
          <p className="text-muted-foreground mt-1">Siga os passos para configurar seu domínio personalizado</p>
        </div>
        <DomainSetupWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
          isPending={addDomain.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Domínio de E-mail
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus domínios de envio de e-mail
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Conectar Domínio
        </Button>
      </div>

      {/* Domain List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Nenhum domínio conectado</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              Conecte seu domínio para enviar e-mails com seu endereço personalizado e melhorar a entregabilidade.
            </p>
            <Button className="mt-6" onClick={() => setShowWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Conectar Domínio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {domains.map((domain: any) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onVerify={(id) => verifyDomain.mutate(id)}
              onDelete={(id) => deleteDomain.mutate(id)}
              isVerifying={verifyDomain.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
