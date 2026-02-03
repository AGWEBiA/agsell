import React from 'react';
import { usePlans } from '@/hooks/usePlans';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type PlanResource = 'users' | 'contacts' | 'emails' | 'whatsapp' | 'automations' | 'forms';

interface FeatureGateProps {
  resource: PlanResource;
  currentCount?: number;
  children: React.ReactNode;
  showUpgrade?: boolean;
}

export function FeatureGate({ resource, currentCount = 0, children, showUpgrade = true }: FeatureGateProps) {
  const { currentPlan, isLoading } = usePlans();
  const navigate = useNavigate();

  if (isLoading || !currentPlan) {
    return null;
  }

  // Get limit based on resource
  const getLimit = (): number => {
    switch (resource) {
      case 'users': return currentPlan.max_users ?? -1;
      case 'contacts': return currentPlan.max_contacts ?? -1;
      case 'emails': return currentPlan.max_emails_per_month ?? -1;
      case 'whatsapp': return currentPlan.max_whatsapp_messages ?? -1;
      case 'automations': return currentPlan.max_automations ?? -1;
      case 'forms': return currentPlan.max_forms ?? -1;
      default: return -1;
    }
  };

  const limit = getLimit();
  const allowed = limit === -1 || currentCount < limit;

  if (!allowed) {
    if (!showUpgrade) {
      return null;
    }

    return (
      <div className="flex flex-col items-center justify-center p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/30">
        <Lock className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center mb-3">
          Você atingiu o limite de {limit} {resource}
        </p>
        <Button size="sm" onClick={() => navigate('/plans')}>
          Fazer Upgrade
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook para verificar limite antes de ação
export function useFeatureCheck() {
  const { currentPlan, checkPlanLimit, isLoading } = usePlans();
  const navigate = useNavigate();

  const canPerformAction = async (resource: PlanResource, currentCount: number): Promise<boolean> => {
    if (isLoading) return true;
    const result = await checkPlanLimit(resource, currentCount);
    return result.allowed;
  };

  const enforceLimit = async (resource: PlanResource, currentCount: number, onBlocked?: () => void): Promise<boolean> => {
    if (isLoading) return true;
    const result = await checkPlanLimit(resource, currentCount);
    
    if (!result.allowed) {
      if (onBlocked) {
        onBlocked();
      } else {
        navigate('/plans');
      }
      return false;
    }
    return true;
  };

  const getLimit = (resource: PlanResource): number => {
    if (!currentPlan) return -1;
    switch (resource) {
      case 'users': return currentPlan.max_users ?? -1;
      case 'contacts': return currentPlan.max_contacts ?? -1;
      case 'emails': return currentPlan.max_emails_per_month ?? -1;
      case 'whatsapp': return currentPlan.max_whatsapp_messages ?? -1;
      case 'automations': return currentPlan.max_automations ?? -1;
      case 'forms': return currentPlan.max_forms ?? -1;
      default: return -1;
    }
  };

  return { canPerformAction, enforceLimit, getLimit, isLoading };
}
