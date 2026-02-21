import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssignmentRulesConfig } from '@/components/inbox/AssignmentRulesConfig';
import { CsatConfig } from '@/components/inbox/CsatConfig';
import { SacAgentsManager } from '@/components/inbox/SacAgentsManager';
import { Users, Star, UserCheck } from 'lucide-react';

export default function InboxSettings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Configurações do SAC</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie atribuição automática e pesquisas de satisfação
        </p>
      </div>

      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="agents" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Atendentes
          </TabsTrigger>
          <TabsTrigger value="assignment" className="gap-2">
            <Users className="h-4 w-4" />
            Atribuição Automática
          </TabsTrigger>
          <TabsTrigger value="csat" className="gap-2">
            <Star className="h-4 w-4" />
            CSAT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <SacAgentsManager />
        </TabsContent>

        <TabsContent value="assignment">
          <AssignmentRulesConfig />
        </TabsContent>

        <TabsContent value="csat">
          <CsatConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
