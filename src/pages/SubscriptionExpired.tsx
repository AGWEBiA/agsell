import { AlertTriangle, CreditCard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

export default function SubscriptionExpired() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { isPastDue } = useSubscriptionStatus();

  const handleRenew = () => {
    navigate('/plans');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">
            {isPastDue ? 'Pagamento Atrasado' : 'Assinatura Expirada'}
          </CardTitle>
          <CardDescription className="text-base">
            {isPastDue
              ? 'O pagamento da sua assinatura não foi confirmado pelo gateway de pagamento. Atualize sua forma de pagamento para continuar.'
              : 'Sua assinatura não foi renovada e o acesso ao sistema está temporariamente bloqueado.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Para continuar utilizando o AG Sell, renove sua assinatura ou entre em contato com o suporte.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleRenew} className="w-full gap-2">
              <CreditCard className="h-4 w-4" />
              Renovar Assinatura
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
