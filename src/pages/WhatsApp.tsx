import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Smartphone, CheckCircle2, Users, Send, Settings } from 'lucide-react';
import { WhatsAppQRConnect } from '@/components/whatsapp/WhatsAppQRConnect';
import { WhatsAppGroupsManager } from '@/components/whatsapp/WhatsAppGroupsManager';
import { WhatsAppCampaignsManager } from '@/components/whatsapp/WhatsAppCampaignsManager';
import { WhatsAppGroupMessages } from '@/components/whatsapp/WhatsAppGroupMessages';

export default function WhatsApp() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie suas conexões, grupos e campanhas WhatsApp</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Integração WhatsApp Completa</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Conecte via QR Code ou API, gerencie grupos e comunidades, e envie campanhas em massa respeitando as boas práticas do WhatsApp.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Smartphone className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Conexões Ativas</p>
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
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Grupos Gerenciados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Send className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Campanhas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                <CheckCircle2 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Mensagens Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Conexão</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Grupos</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Automações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <WhatsAppQRConnect />
          
          {/* Setup Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Como Configurar</CardTitle>
              <CardDescription>Siga os passos para integrar o WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Escolha o tipo de conexão</p>
                    <p className="text-sm text-muted-foreground">
                      QR Code para uso pessoal ou API Business para empresas com alto volume.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Configure seus grupos</p>
                    <p className="text-sm text-muted-foreground">
                      Adicione grupos para monitorar entradas, saídas e enviar mensagens automáticas.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Crie campanhas em massa</p>
                    <p className="text-sm text-muted-foreground">
                      Envie mensagens 1-a-1 respeitando os limites e boas práticas do WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <WhatsAppGroupsManager />
        </TabsContent>

        <TabsContent value="campaigns">
          <WhatsAppCampaignsManager />
        </TabsContent>

        <TabsContent value="messages">
          <WhatsAppGroupMessages />
        </TabsContent>
      </Tabs>
    </div>
  );
}
