import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePlans, Plan } from '@/hooks/usePlans';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useContacts } from '@/hooks/useContacts';
import { useAutomations } from '@/hooks/useAutomations';
import { useForms } from '@/hooks/useForms';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { Check, Crown, Zap, Users, Mail, MessageSquare, Bot, FileText, Loader2, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanCheckout } from '@/components/stripe/PlanCheckout';

const FEATURE_LABELS: Record<string, string> = {
  crm_basico: 'CRM Básico',
  pipeline: 'Pipeline de Vendas',
  tarefas: 'Gestão de Tarefas',
  automacoes: 'Automações',
  email_marketing: 'E-mail Marketing',
  analytics: 'Analytics Avançado',
  lead_scoring: 'Lead Scoring',
  whatsapp: 'WhatsApp Business',
  integrações: 'Integrações',
  api: 'API Pública',
  white_label: 'White Label',
  suporte_prioritario: 'Suporte Prioritário',
};

function PlanCard({ plan, isCurrentPlan, onSelect }: { plan: Plan; isCurrentPlan: boolean; onSelect: () => void }) {
  const isPro = plan.slug === 'professional';
  const isEnterprise = plan.slug === 'enterprise';

  return (
    <Card className={cn(
      'relative transition-all hover:shadow-lg',
      isPro && 'border-primary shadow-md',
      isCurrentPlan && 'ring-2 ring-primary'
    )}>
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Zap className="h-3 w-3 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary">
            <Check className="h-3 w-3 mr-1" />
            Plano Atual
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        {isEnterprise && <Crown className="h-8 w-8 mx-auto mb-2 text-yellow-500" />}
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="text-center">
        <div className="mb-4">
          <span className="text-4xl font-bold">
            {plan.price_monthly === 0 ? 'Grátis' : `R$ ${plan.price_monthly}`}
          </span>
          {plan.price_monthly > 0 && (
            <span className="text-muted-foreground">/mês</span>
          )}
        </div>

        {plan.price_yearly > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            ou R$ {plan.price_yearly}/ano (economize 17%)
          </p>
        )}

        <div className="space-y-3 text-left">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{plan.max_users === -1 ? 'Usuários ilimitados' : `${plan.max_users} usuário${plan.max_users > 1 ? 's' : ''}`}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{plan.max_contacts === -1 ? 'Contatos ilimitados' : `${plan.max_contacts.toLocaleString()} contatos`}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{plan.max_emails_per_month === -1 ? 'E-mails ilimitados' : `${plan.max_emails_per_month.toLocaleString()} e-mails/mês`}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>{plan.max_whatsapp_messages === -1 ? 'WhatsApp ilimitado' : `${plan.max_whatsapp_messages.toLocaleString()} mensagens WhatsApp`}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <span>{plan.max_automations === -1 ? 'Automações ilimitadas' : `${plan.max_automations} automações`}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span>{plan.max_ai_requests_per_month === -1 ? 'IA ilimitada' : `${plan.max_ai_requests_per_month?.toLocaleString() ?? 0} requisições IA/mês`}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{plan.max_forms === -1 ? 'Formulários ilimitados' : `${plan.max_forms} formulários`}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t space-y-2">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>{FEATURE_LABELS[feature] || feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? 'outline' : isPro ? 'default' : 'outline'}
          disabled={isCurrentPlan}
          onClick={onSelect}
        >
          {isCurrentPlan ? 'Plano Atual' : plan.price_monthly === 0 ? 'Começar' : 'Fazer Upgrade'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function UsageCard({ label, current, limit, icon: Icon }: { label: string; current: number; limit: number; icon: React.ElementType }) {
  const percentage = limit === -1 ? 0 : (current / limit) * 100;
  const isUnlimited = limit === -1;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          <span className={cn(
            'text-sm font-medium',
            isAtLimit && 'text-destructive',
            isNearLimit && !isAtLimit && 'text-yellow-600'
          )}>
            {current.toLocaleString()} / {isUnlimited ? '∞' : limit.toLocaleString()}
          </span>
        </div>
        {!isUnlimited && (
          <Progress 
            value={Math.min(percentage, 100)} 
            className={cn(
              'h-2',
              isAtLimit && '[&>div]:bg-destructive',
              isNearLimit && !isAtLimit && '[&>div]:bg-yellow-500'
            )}
          />
        )}
        {isUnlimited && (
          <div className="text-xs text-muted-foreground mt-1">Ilimitado</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Plans() {
  const { plans, currentPlan, updatePlan, isLoading } = usePlans();
  const contactsQuery = useContacts();
  const { automations } = useAutomations();
  const { forms } = useForms();
  const { members } = useOrganizationMembers();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const contacts = contactsQuery.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSelectPlan = (plan: Plan) => {
    if (plan.price_monthly > 0) {
      setSelectedPlan(plan);
      setShowCheckout(true);
    } else {
      updatePlan.mutate(plan.id);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Planos e Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e acompanhe seu uso</p>
      </div>

      {/* Current Usage */}
      {currentPlan && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Seu Uso Atual</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <UsageCard 
              label="Usuários" 
              current={members.length} 
              limit={currentPlan.max_users} 
              icon={Users} 
            />
            <UsageCard 
              label="Contatos" 
              current={contacts.length} 
              limit={currentPlan.max_contacts} 
              icon={Users} 
            />
            <UsageCard 
              label="Automações" 
              current={automations.length} 
              limit={currentPlan.max_automations} 
              icon={Bot} 
            />
            <UsageCard 
              label="Formulários" 
              current={forms.length} 
              limit={currentPlan.max_forms} 
              icon={FileText} 
            />
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Planos Disponíveis</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentPlan?.id === plan.id}
              onSelect={() => handleSelectPlan(plan)}
            />
          ))}
        </div>
      </div>

      {/* Checkout Dialog */}
      {selectedPlan && (
        <PlanCheckout
          plan={{
            ...selectedPlan,
            features: selectedPlan.features || [],
          }}
          open={showCheckout}
          onOpenChange={setShowCheckout}
        />
      )}
    </div>
  );
}
