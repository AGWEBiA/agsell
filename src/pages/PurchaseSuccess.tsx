import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  Clock, 
  Shield,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function PurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const planName = searchParams.get('plan') || 'seu plano';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <Sparkles className="h-3 w-3 mr-1" />
            Pagamento Confirmado
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold">
            Bem-vindo ao AG Sell!
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Sua assinatura do plano <strong className="text-foreground">{planName}</strong> foi confirmada com sucesso.
          </p>
        </div>

        {/* Instructions Card */}
        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Próximos Passos</CardTitle>
            <CardDescription>
              Siga as instruções abaixo para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">1. Verifique seu e-mail</h3>
                <p className="text-sm text-muted-foreground">
                  Enviamos um e-mail com suas <strong>credenciais de acesso</strong> (login e senha temporária). 
                  Verifique também a caixa de spam.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">2. Faça login no sistema</h3>
                <p className="text-sm text-muted-foreground">
                  Acesse a página de login e utilize o e-mail e senha que enviamos. 
                  Recomendamos alterar a senha no primeiro acesso.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">3. Configure sua organização</h3>
                <p className="text-sm text-muted-foreground">
                  Após o login, complete o onboarding para configurar seu CRM, 
                  importar contatos e começar a vender mais.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4 border-t">
              <Link to="/login" className="block">
                <Button size="lg" className="w-full h-12 text-base">
                  Acessar o Sistema
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">E-mail não chegou?</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aguarde alguns minutos e verifique a pasta de spam. 
                    Se persistir, entre em contato conosco.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Dados seguros</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seus dados e pagamento estão protegidos. 
                    Você pode cancelar a qualquer momento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Link */}
        <div className="text-center">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <HelpCircle className="h-4 w-4 mr-2" />
            Precisa de ajuda? Entre em contato
          </Button>
        </div>
      </div>
    </div>
  );
}
