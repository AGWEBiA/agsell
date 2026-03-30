import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function DataDeletion() {
  const handleRequest = () => {
    window.location.href = 'mailto:suporte@agsell.com.br?subject=Solicitação de exclusão de dados&body=Olá, gostaria de solicitar a exclusão dos meus dados pessoais conforme a LGPD.';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Exclusão de Dados do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            A <strong className="text-foreground">AG Sell</strong> respeita sua privacidade e está em conformidade com a LGPD (Lei Geral de Proteção de Dados) e as políticas da Meta.
          </p>
          <p>
            Você pode solicitar a exclusão completa dos seus dados pessoais a qualquer momento. Ao fazer a solicitação:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Todos os seus dados pessoais serão removidos dos nossos sistemas</li>
            <li>Dados de autenticação vinculados ao Facebook/Instagram serão excluídos</li>
            <li>O processo é concluído em até 30 dias úteis</li>
            <li>Você receberá uma confirmação por e-mail após a conclusão</li>
          </ul>
          <p>
            Para solicitar a exclusão, envie um e-mail para{' '}
            <a href="mailto:suporte@agsell.com.br" className="text-primary underline">
              suporte@agsell.com.br
            </a>{' '}
            ou clique no botão abaixo.
          </p>
          <Button onClick={handleRequest} variant="destructive" className="w-full mt-4">
            Solicitar Exclusão de Dados
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
