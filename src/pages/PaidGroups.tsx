import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaidGroupsConfig } from '@/components/paid-groups/PaidGroupsConfig';
import { PaidGroupsManager } from '@/components/paid-groups/PaidGroupsManager';
import { PaidGroupProducts } from '@/components/paid-groups/PaidGroupProducts';
import { PaidGroupMembers } from '@/components/paid-groups/PaidGroupMembers';
import { Settings, Users, Package, Users2 } from 'lucide-react';

export default function PaidGroups() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Grupos Pagos</h1>
        <p className="text-muted-foreground">Automatize a gestão de membros nos seus grupos de WhatsApp com base em pagamentos.</p>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config" className="gap-1.5"><Settings className="h-4 w-4" /> Configuração</TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5"><Users className="h-4 w-4" /> Grupos</TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5"><Package className="h-4 w-4" /> Produtos</TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5"><Users2 className="h-4 w-4" /> Membros</TabsTrigger>
        </TabsList>

        <TabsContent value="config"><PaidGroupsConfig /></TabsContent>
        <TabsContent value="groups"><PaidGroupsManager /></TabsContent>
        <TabsContent value="products"><PaidGroupProducts /></TabsContent>
        <TabsContent value="members"><PaidGroupMembers /></TabsContent>
      </Tabs>
    </div>
  );
}
