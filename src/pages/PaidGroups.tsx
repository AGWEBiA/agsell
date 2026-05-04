import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaidGroupsConfig } from '@/components/paid-groups/PaidGroupsConfig';
import { PaidGroupsManager } from '@/components/paid-groups/PaidGroupsManager';
import { PaidGroupProducts } from '@/components/paid-groups/PaidGroupProducts';
import { PaidGroupMembers } from '@/components/paid-groups/PaidGroupMembers';
import { PaidGroupsDashboard } from '@/components/paid-groups/PaidGroupsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Users, Package, Users2, BookOpen, ChevronDown, ChevronUp, CheckCircle2, ArrowRight, Webhook, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const steps = [
  {
    number: 1,
    title: 'Configure a Evolution API',
    tab: 'config',
    icon: Settings,
    description: 'Conecte sua instância da Evolution API para que o sistema possa gerenciar participantes nos seus grupos de WhatsApp.',
    details: [
      'Acesse a aba "Configuração" acima.',
      'Insira a URL da sua Evolution API (ex: https://sua-api.com).',
      'Insira a API Key da sua instância.',
      'Ative o switch "Ativo" e clique em "Salvar Configuração".',
      'Após salvar, as URLs de webhook serão geradas automaticamente para cada gateway de pagamento.',
    ],
    tip: 'Certifique-se de que sua instância da Evolution API esteja online e com pelo menos um número conectado antes de prosseguir.',
  },
  {
    number: 2,
    title: 'Importe seus Grupos',
    tab: 'groups',
    icon: Users,
    description: 'O sistema buscará automaticamente todos os grupos disponíveis nas suas instâncias conectadas.',
    details: [
      'Acesse a aba "Grupos" acima.',
      'Clique no botão "Buscar Grupos" para listar os grupos de todas as instâncias conectadas.',
      'Selecione os grupos que deseja utilizar para automação de membros pagos.',
      'Clique em "Adicionar selecionados" para cadastrá-los no sistema.',
    ],
    tip: 'Você pode adicionar quantos grupos quiser. Cada grupo será gerenciado de forma independente.',
  },
  {
    number: 3,
    title: 'Crie seus Produtos',
    tab: 'products',
    icon: Package,
    description: 'Defina os produtos que serão vinculados aos gateways de pagamento e aos grupos.',
    details: [
      'Acesse a aba "Produtos" e clique em "Novo Produto".',
      'Preencha o nome do produto (ex: "Curso Premium", "Mentoria VIP").',
      'No campo de IDs dos Gateways, insira os IDs dos produtos/ofertas correspondentes em cada plataforma de pagamento.',
      'Exemplo: No campo "kiwify", coloque o ID do produto na Kiwify. No campo "hotmart", coloque o ID do Hotmart.',
      'Você pode inserir múltiplos IDs separados por vírgula para o mesmo gateway.',
      'Após criar o produto, clique no ícone de engrenagem (⚙) para vincular os grupos correspondentes.',
    ],
    tip: 'Um mesmo produto pode ser vendido em vários gateways simultaneamente. Basta mapear os IDs corretos de cada plataforma.',
  },
  {
    number: 4,
    title: 'Configure os Webhooks',
    tab: 'config',
    icon: Webhook,
    description: 'Copie as URLs de webhook geradas e configure-as nos seus gateways de pagamento.',
    details: [
      'Volte à aba "Configuração" e localize a seção "URLs de Webhook".',
      'Para cada gateway que você utiliza, copie a URL correspondente clicando no ícone de copiar.',
      'Acesse o painel do seu gateway de pagamento (Kiwify, Hotmart, Eduzz, etc.).',
      'Cole a URL na configuração de webhooks/postback do gateway.',
      'Configure os eventos de pagamento aprovado, reembolso e cancelamento.',
    ],
    tip: 'Cada gateway tem sua própria URL. Use sempre a URL específica do gateway correto para garantir o processamento adequado dos eventos.',
  },
  {
    number: 5,
    title: 'Monitore os Membros',
    tab: 'members',
    icon: Users2,
    description: 'Acompanhe em tempo real quem foi adicionado ou removido dos seus grupos.',
    details: [
      'Na aba "Membros" você verá todos os participantes gerenciados automaticamente.',
      'Membros com status "Ativo" foram adicionados após confirmação de pagamento.',
      'Membros com status "Removido" foram retirados após cancelamento, reembolso ou chargeback.',
      'Você também pode remover membros manualmente clicando no ícone de remover.',
    ],
    tip: 'A remoção manual no sistema NÃO remove o participante do grupo no WhatsApp. Para isso, a remoção deve ser processada pelo webhook.',
  },
];

export default function PaidGroups() {
  const [activeTab, setActiveTab] = useState('guide');
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Grupos Pagos</h1>
        <p className="text-muted-foreground">Automatize a gestão de membros nos seus grupos de WhatsApp com base em pagamentos.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="guide" className="gap-1.5"><BookOpen className="h-4 w-4" /> Passo a Passo</TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5"><Settings className="h-4 w-4" /> Configuração</TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5"><Users className="h-4 w-4" /> Grupos</TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5"><Package className="h-4 w-4" /> Produtos</TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5"><Users2 className="h-4 w-4" /> Membros</TabsTrigger>
        </TabsList>

        <TabsContent value="guide">
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Como funciona?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      O sistema Grupos Pagos automatiza a adição e remoção de membros nos seus grupos de WhatsApp com base em eventos de pagamento. 
                      Quando um cliente compra seu produto em qualquer gateway suportado, ele é adicionado automaticamente ao grupo. 
                      Em caso de cancelamento, reembolso ou chargeback, o membro é removido automaticamente.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className="gap-1"><ShieldCheck className="h-3 w-3" /> 20 gateways suportados</Badge>
                      <Badge variant="outline" className="gap-1"><Zap className="h-3 w-3" /> 100% automático</Badge>
                      <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> Multi-grupo</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {steps.map((step, index) => {
              const Icon = step.icon;
              const isExpanded = expandedStep === index;
              return (
                <Collapsible key={step.number} open={isExpanded} onOpenChange={() => setExpandedStep(isExpanded ? null : index)}>
                  <Card className={isExpanded ? 'border-primary/30' : ''}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                            {step.number}
                          </div>
                          <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="flex-1">
                            <CardTitle className="text-base">{step.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        <div className="space-y-2 pl-11">
                          {step.details.map((detail, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <p className="text-sm">{detail}</p>
                            </div>
                          ))}
                        </div>
                        {step.tip && (
                          <div className="ml-11 p-3 rounded-lg bg-warning/10 border border-warning/20">
                            <p className="text-sm text-warning-foreground dark:text-warning">
                              <strong>💡 Dica:</strong> {step.tip}
                            </p>
                          </div>
                        )}
                        <div className="pl-11">
                          <Button size="sm" variant="outline" onClick={() => setActiveTab(step.tab)} className="gap-1.5">
                            Ir para {step.title.split(' ').slice(-1)[0]} <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="dashboard"><PaidGroupsDashboard /></TabsContent>
        <TabsContent value="config"><PaidGroupsConfig /></TabsContent>
        <TabsContent value="groups"><PaidGroupsManager /></TabsContent>
        <TabsContent value="products"><PaidGroupProducts /></TabsContent>
        <TabsContent value="members"><PaidGroupMembers /></TabsContent>
      </Tabs>
    </div>
  );
}
