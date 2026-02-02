import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Mail,
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Play,
  Pause,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data
const campaigns = [
  { id: 1, name: 'Black Friday 2026', subject: 'Ofertas Imperdíveis!', status: 'sent', sent: 1250, opened: 456, clicked: 128, bounced: 12, date: '2026-01-25' },
  { id: 2, name: 'Newsletter Janeiro', subject: 'Novidades do Mês', status: 'sending', sent: 580, opened: 0, clicked: 0, bounced: 0, date: '2026-02-01' },
  { id: 3, name: 'Lançamento Produto', subject: 'Chegou o que você esperava!', status: 'scheduled', sent: 0, opened: 0, clicked: 0, bounced: 0, date: '2026-02-10' },
  { id: 4, name: 'Recuperação de Carrinho', subject: 'Você esqueceu algo!', status: 'draft', sent: 0, opened: 0, clicked: 0, bounced: 0, date: '2026-02-05' },
  { id: 5, name: 'Boas-vindas', subject: 'Bem-vindo à nossa família!', status: 'sent', sent: 856, opened: 623, clicked: 245, bounced: 8, date: '2026-01-15' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  sending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  sent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  paused: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  sending: 'Enviando',
  sent: 'Enviado',
  paused: 'Pausado',
};

export default function Email() {
  const totalSent = campaigns.reduce((acc, c) => acc + c.sent, 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + c.opened, 0);
  const totalClicked = campaigns.reduce((acc, c) => acc + c.clicked, 0);
  const totalBounced = campaigns.reduce((acc, c) => acc + c.bounced, 0);

  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
  const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0';
  const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">E-mail Marketing</h1>
          <p className="text-muted-foreground">Gerencie suas campanhas de e-mail</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSent.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Emails Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Abertura</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <MousePointerClick className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clickRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Cliques</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bounceRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Bounce</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviados</TableHead>
                <TableHead>Abertos</TableHead>
                <TableHead>Cliques</TableHead>
                <TableHead>Bounce</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const campaignOpenRate = campaign.sent > 0
                  ? ((campaign.opened / campaign.sent) * 100).toFixed(1)
                  : '0';
                const campaignClickRate = campaign.opened > 0
                  ? ((campaign.clicked / campaign.opened) * 100).toFixed(1)
                  : '0';

                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[campaign.status]} variant="secondary">
                        {statusLabels[campaign.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-muted-foreground" />
                        {campaign.sent.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{campaign.opened.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">({campaignOpenRate}%)</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        <span>{campaign.clicked.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">({campaignClickRate}%)</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={campaign.bounced > 10 ? 'text-destructive' : ''}>
                        {campaign.bounced}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(campaign.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Duplicar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
