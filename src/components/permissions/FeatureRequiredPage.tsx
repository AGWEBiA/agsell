import React from 'react';
import { usePlanFeature } from '@/hooks/usePlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureRequiredPageProps {
  feature: string;
  featureLabel: string;
  children: React.ReactNode;
}

export function FeatureRequiredPage({ feature, featureLabel, children }: FeatureRequiredPageProps) {
  const { hasFeature, isLoading } = usePlanFeature(feature);
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  if (!hasFeature) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8 px-8 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">Recurso não disponível</h2>
            <p className="text-muted-foreground">
              O módulo <strong>{featureLabel}</strong> não está incluído no seu plano atual. 
              Faça upgrade para desbloquear esta funcionalidade.
            </p>
            <Button onClick={() => navigate('/plans')} className="mt-2">
              Ver Planos Disponíveis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
