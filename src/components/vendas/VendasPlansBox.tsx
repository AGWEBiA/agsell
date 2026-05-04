import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Check, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActivePlans, Plan as VendasPlan } from '@/hooks/useActivePlans';
import { cn } from '@/lib/utils';

const FEATURE_LABEL: Record<string, string> = {
  crm_basico: 'CRM completo',
  pipeline: 'Pipeline kanban',
  tarefas: 'Tarefas e atividades',
  automacoes: 'Automações Flow Builder',
  email_marketing: 'E-mail marketing',
  analytics: 'Analytics avançado',
  whatsapp: 'WhatsApp ilimitado',
  instagram: 'Instagram DM',
  lead_scoring: 'Lead scoring por IA',
  'integrações': 'Integrações',
  api: 'API pública',
  white_label: 'White label',
  suporte_prioritario: 'Suporte prioritário',
  customer_support_center: 'Central de suporte',
  paid_groups: 'Grupos pagos',
  agency_management: 'Gestão de agência',
};

interface Props {
  variant?: 'compact' | 'full';
  className?: string;
}

export function VendasPlansBox({ variant = 'full', className }: Props) {
  const { plans, isLoading } = useActivePlans();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');


  if (isLoading) {
    return (
      <div className={cn('flex justify-center py-16', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto', className)}>
        {plans.map((plan) => {
          const isPro = plan.slug === 'professional';
          return (
            <Link
              key={plan.id}
              to="/pricing"
              className={cn(
                'group rounded-2xl border p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/40',
                isPro ? 'border-primary/50 bg-primary/5' : 'border-white/10 bg-white/[0.03]',
              )}
            >
              {isPro && (
                <span className="inline-flex items-center gap-1 mb-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Zap className="h-3 w-3" /> Popular
                </span>
              )}
              <p className="text-sm font-semibold text-white mb-1">{plan.name}</p>
              <div className="mb-3">
                <span className="text-2xl font-bold text-white">R$ {plan.price_monthly}</span>
                <span className="text-xs text-white/40">/mês</span>
              </div>
              <p className="text-xs text-white/50 mb-3 line-clamp-2 min-h-[32px]">
                {plan.description ?? 'Plano AG Sell'}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                Ver detalhes <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Toggle billing */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-medium transition-all',
              billingCycle === 'monthly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-white/60 hover:text-white',
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-medium transition-all',
              billingCycle === 'yearly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-white/60 hover:text-white',
            )}
          >
            Anual <span className="ml-1 text-[10px] font-bold text-green-400">-17%</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isPro = plan.slug === 'professional';
          const price = billingCycle === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12);
          const topFeatures = plan.features.slice(0, 6);

          return (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-2xl border p-6 flex flex-col transition-all hover:-translate-y-1 duration-300',
                isPro
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 lg:scale-105'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20',
              )}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                    <Zap className="h-3 w-3" /> Mais Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                {plan.description && <p className="text-xs text-white/50 mt-1">{plan.description}</p>}
              </div>

              <div className="mb-5">
                <span className="text-4xl font-bold text-white">R$ {price}</span>
                <span className="text-white/50 text-sm">/mês</span>
                {billingCycle === 'yearly' && (
                  <p className="text-[11px] text-white/40 mt-1">
                    R$ {plan.price_yearly}/ano à vista
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {topFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/80">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{FEATURE_LABEL[f] ?? f}</span>
                  </li>
                ))}
                {plan.features.length > topFeatures.length && (
                  <li className="text-[11px] text-white/40 pl-5">
                    +{plan.features.length - topFeatures.length} recursos adicionais
                  </li>
                )}
              </ul>

              <Link to="/pricing" className="mt-auto">
                <Button
                  className={cn(
                    'w-full rounded-full font-semibold',
                    isPro ? 'bg-primary hover:bg-primary/90' : 'bg-white/10 hover:bg-white/15 text-white',
                  )}
                >
                  Assinar {plan.name} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-white/40 mt-8">
        7 dias de garantia incondicional • Sem fidelidade • Cancele quando quiser
      </p>
    </div>
  );
}
