import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/register"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <Logo variant="red" size="md" showText />
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>
          <p className="text-muted-foreground mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">1. Aceitação dos Termos</h2>
          <p>Ao criar uma conta e utilizar a plataforma AG Sell, você concorda com estes Termos de Uso e com nossa Política de Privacidade. Se você não concordar com qualquer parte destes termos, não deve utilizar a plataforma.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">2. Descrição do Serviço</h2>
          <p>A AG Sell é uma plataforma de CRM e automação de marketing que oferece:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Gestão de contatos e empresas;</li>
            <li>Pipeline de vendas;</li>
            <li>Automações de marketing;</li>
            <li>Envio de e-mails e mensagens via WhatsApp;</li>
            <li>Formulários de captura;</li>
            <li>Integrações com plataformas de pagamento e infoprodutos;</li>
            <li>API pública para integrações.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">3. Responsabilidades do Usuário</h2>
          <p>O usuário é responsável por:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Manter a confidencialidade de suas credenciais de acesso;</li>
            <li>Garantir que possui consentimento dos titulares dos dados pessoais que cadastra na plataforma;</li>
            <li>Utilizar a plataforma em conformidade com a legislação aplicável, incluindo a LGPD;</li>
            <li>Não utilizar a plataforma para envio de spam ou comunicações não solicitadas;</li>
            <li>Manter seus dados cadastrais atualizados.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">4. Proteção de Dados (LGPD)</h2>
          <p>Em relação aos dados pessoais tratados na plataforma:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>A AG Sell atua como <strong>Operadora</strong> dos dados pessoais de contatos e clientes cadastrados pelo usuário;</li>
            <li>O usuário (organizador) atua como <strong>Controlador</strong> dos dados de seus contatos e clientes;</li>
            <li>A AG Sell atua como <strong>Controladora</strong> dos dados pessoais do próprio usuário (conta, perfil, pagamento);</li>
            <li>Ambas as partes se comprometem a tratar os dados em conformidade com a LGPD.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">5. Planos e Pagamentos</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Os planos e preços estão disponíveis na página de preços da plataforma;</li>
            <li>O pagamento é processado de forma segura via Stripe;</li>
            <li>A renovação é automática, podendo ser cancelada a qualquer momento;</li>
            <li>Em caso de cancelamento, o acesso será mantido até o final do período contratado.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">6. Propriedade Intelectual</h2>
          <p>Todo o conteúdo da plataforma, incluindo código, design, textos e marca, é de propriedade da AG Sell. Os dados cadastrados pelo usuário permanecem de sua propriedade.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">7. Limitação de Responsabilidade</h2>
          <p>A AG Sell não se responsabiliza por:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Danos causados pelo uso inadequado da plataforma pelo usuário;</li>
            <li>Interrupções decorrentes de manutenção ou força maior;</li>
            <li>Conteúdo das mensagens enviadas pelo usuário através da plataforma;</li>
            <li>Perda de dados causada por ação do próprio usuário.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">8. Rescisão</h2>
          <p>O usuário pode encerrar sua conta a qualquer momento. A AG Sell reserva-se o direito de suspender ou encerrar contas que violem estes termos.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">9. Foro</h2>
          <p>Fica eleito o foro da comarca de [cidade/estado], com exclusão de qualquer outro, para dirimir questões relacionadas a estes Termos de Uso.</p>
        </div>
      </div>
    </div>
  );
}
