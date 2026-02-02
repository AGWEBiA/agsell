import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Settings } from 'lucide-react';

export default function WhatsApp() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie suas conexões WhatsApp</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nova Conexão</Button>
      </div>
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma conexão WhatsApp configurada</p>
          <Button className="mt-4"><Plus className="h-4 w-4 mr-2" />Conectar WhatsApp</Button>
        </CardContent>
      </Card>
    </div>
  );
}
