import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, Check, Settings } from 'lucide-react';

const integrations = [
  { name: 'SendGrid', description: 'Envio de emails transacionais', status: 'connected', icon: '📧' },
  { name: 'Stripe', description: 'Pagamentos e assinaturas', status: 'disconnected', icon: '💳' },
  { name: 'Hotmart', description: 'Plataforma de infoprodutos', status: 'disconnected', icon: '🔥' },
  { name: 'Kiwify', description: 'Vendas de produtos digitais', status: 'disconnected', icon: '🥝' },
];

export default function Integrations() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold">Integrações</h1><p className="text-muted-foreground">Conecte suas ferramentas favoritas</p></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((int) => (
          <Card key={int.name}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl">{int.icon}</span>
                <div><p className="font-medium">{int.name}</p><p className="text-sm text-muted-foreground">{int.description}</p></div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={int.status === 'connected' ? 'default' : 'secondary'}>{int.status === 'connected' ? 'Conectado' : 'Desconectado'}</Badge>
                <Button variant="outline" size="sm">{int.status === 'connected' ? 'Configurar' : 'Conectar'}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
