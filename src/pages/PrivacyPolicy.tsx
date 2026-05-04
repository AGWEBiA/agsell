import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
          <p className="text-muted-foreground mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <p>A AG Sell ("nós", "nosso" ou "plataforma") está comprometida com a proteção dos dados pessoais dos seus usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 – LGPD) e demais normas aplicáveis.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">1. Dados Pessoais Coletados</h2>
          <p>Coletamos os seguintes dados pessoais:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Dados de identificação:</strong> nome completo, endereço de e-mail, telefone.</li>
            <li><strong>Dados de autenticação:</strong> credenciais de acesso (senha criptografada).</li>
            <li><strong>Dados de uso:</strong> logs de acesso, ações realizadas na plataforma, endereço IP.</li>
            <li><strong>Dados de contatos e clientes:</strong> informações de contatos comerciais cadastrados pelo usuário na plataforma (nome, e-mail, telefone, empresa).</li>
            <li><strong>Dados de pagamento:</strong> processados por meio de Stripe ou Kiwify, sem armazenamento direto de dados sensíveis na plataforma.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">2. Finalidade do Tratamento</h2>
          <p>Os dados pessoais são tratados para as seguintes finalidades:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Criação e gerenciamento de conta na plataforma;</li>
            <li>Prestação dos serviços de CRM, automação de marketing e comunicação;</li>
            <li>Processamento de pagamentos e gestão de assinaturas;</li>
            <li>Envio de comunicações transacionais e de serviço;</li>
            <li>Melhoria contínua da plataforma e experiência do usuário;</li>
            <li>Cumprimento de obrigações legais e regulatórias.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">3. Base Legal</h2>
          <p>O tratamento dos dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Consentimento (Art. 7º, I):</strong> para coleta de dados no cadastro e uso de funcionalidades opcionais;</li>
            <li><strong>Execução de contrato (Art. 7º, V):</strong> para prestação dos serviços contratados;</li>
            <li><strong>Legítimo interesse (Art. 7º, IX):</strong> para melhoria e segurança da plataforma;</li>
            <li><strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> para atender exigências legais e regulatórias.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">4. Compartilhamento de Dados</h2>
          <p>Os dados pessoais podem ser compartilhados com:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Processadores de pagamento:</strong> Stripe, para processamento de transações financeiras;</li>
            <li><strong>Provedores de e-mail:</strong> SendGrid, Resend ou Amazon SES, para envio de e-mails transacionais;</li>
            <li><strong>Provedores de infraestrutura:</strong> para hospedagem e operação da plataforma;</li>
            <li><strong>Integrações configuradas pelo usuário:</strong> como Hotmart, Kiwify e Eduzz, conforme configuração do próprio usuário.</li>
          </ul>
          <p>Não vendemos, alugamos ou comercializamos dados pessoais a terceiros.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">5. Direitos do Titular</h2>
          <p>Conforme a LGPD, você tem o direito de:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Confirmar a existência de tratamento de dados;</li>
            <li>Acessar seus dados pessoais;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>Solicitar a portabilidade dos dados;</li>
            <li>Solicitar a eliminação dos dados tratados com consentimento;</li>
            <li>Revogar o consentimento a qualquer momento.</li>
          </ul>
          <p>Esses direitos podem ser exercidos diretamente pela plataforma em <strong>Configurações → Privacidade</strong> ou por contato através do e-mail: <a href="mailto:privacidade@agsell.com.br" className="text-primary">privacidade@agsell.com.br</a>.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">6. Segurança dos Dados</h2>
          <p>Adotamos medidas técnicas e organizacionais para proteger os dados pessoais, incluindo:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Criptografia de dados em trânsito (HTTPS/TLS) e em repouso;</li>
            <li>Controle de acesso baseado em funções (RBAC);</li>
            <li>Row Level Security (RLS) para isolamento multi-tenant;</li>
            <li>Verificação de assinatura HMAC para webhooks;</li>
            <li>Sanitização de entradas (DOMPurify) contra ataques XSS;</li>
            <li>Hash seguro de chaves de API.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">7. Retenção de Dados</h2>
          <p>Os dados pessoais são retidos pelo período necessário para cumprimento das finalidades descritas nesta política ou conforme exigido por lei. Após o encerramento da conta, os dados serão eliminados em até 30 dias, exceto quando houver obrigação legal de retenção.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">8. Encarregado de Dados (DPO)</h2>
          <p>Para questões relacionadas à proteção de dados pessoais, entre em contato com nosso encarregado de dados pelo e-mail: <a href="mailto:dpo@agsell.com.br" className="text-primary">dpo@agsell.com.br</a>.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">9. Alterações nesta Política</h2>
          <p>Reservamo-nos o direito de atualizar esta política a qualquer momento. As alterações serão comunicadas por meio da plataforma e/ou por e-mail.</p>
        </div>
      </div>
    </div>
  );
}
