import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Zap,
  Play,
  Pause,
  MoreHorizontal,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data
const automations = [
  { id: 1, name: 'Boas-vindas', description: 'Sequência de emails para novos leads', trigger: 'Formulário submetido', isActive: true, entered: 456, completed: 389 },
  { id: 2, name: 'Recuperação de Carrinho', description: 'Follow-up para carrinhos abandonados', trigger: 'Carrinho abandonado', isActive: true, entered: 123, completed: 45 },
  { id: 3, name: 'Follow-up Pós-Venda', description: 'Sequência de nutrição pós-compra', trigger: 'Compra aprovada', isActive: false, entered: 234, completed: 198 },
  { id: 4, name: 'Reengajamento', description: 'Reativar leads inativos', trigger: 'Score < 30', isActive: true, entered: 89, completed: 34 },
  { id: 5, name: 'Lead Qualificado', description: 'Notificar equipe comercial', trigger: 'Score >= 80', isActive: true, entered: 67, completed: 67 },
];

export default function Automations() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automações</h1>
          <p className="text-muted-foreground">Construa fluxos automatizados para seus leads</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{automations.filter(a => a.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Automações Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{automations.reduce((acc, a) => acc + a.entered, 0)}</p>
                <p className="text-sm text-muted-foreground">Total de Entradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{automations.reduce((acc, a) => acc + a.completed, 0)}</p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {automations.map((automation) => {
          const completionRate = automation.entered > 0
            ? ((automation.completed / automation.entered) * 100).toFixed(0)
            : 0;

          return (
            <Card key={automation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      automation.isActive ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Zap className={`h-5 w-5 ${automation.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{automation.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{automation.trigger}</p>
                    </div>
                  </div>
                  <Switch checked={automation.isActive} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{automation.description}</p>
                
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {automation.entered}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      {automation.completed}
                    </div>
                  </div>
                  <Badge variant="secondary">{completionRate}%</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Editar
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver estatísticas</DropdownMenuItem>
                      <DropdownMenuItem>Duplicar</DropdownMenuItem>
                      <DropdownMenuItem>Testar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
