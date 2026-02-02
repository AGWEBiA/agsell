import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { User, Bell, Shield, Key } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold">Configurações</h1><p className="text-muted-foreground">Gerencie suas preferências</p></div>
      <Tabs defaultValue="profile">
        <TabsList><TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Perfil</TabsTrigger><TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notificações</TabsTrigger><TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" />Segurança</TabsTrigger></TabsList>
        <TabsContent value="profile" className="mt-4"><Card><CardHeader><CardTitle>Perfil</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-2"><Label>Nome</Label><Input placeholder="Seu nome" /></div><div className="grid gap-2"><Label>Email</Label><Input type="email" placeholder="seu@email.com" /></div><Button>Salvar</Button></CardContent></Card></TabsContent>
        <TabsContent value="notifications" className="mt-4"><Card><CardHeader><CardTitle>Notificações</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><div><p className="font-medium">Novos leads</p><p className="text-sm text-muted-foreground">Receber notificação de novos leads</p></div><Switch defaultChecked /></div><div className="flex items-center justify-between"><div><p className="font-medium">Vendas</p><p className="text-sm text-muted-foreground">Receber notificação de vendas</p></div><Switch defaultChecked /></div></CardContent></Card></TabsContent>
        <TabsContent value="security" className="mt-4"><Card><CardHeader><CardTitle>Segurança</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-2"><Label>Senha atual</Label><Input type="password" /></div><div className="grid gap-2"><Label>Nova senha</Label><Input type="password" /></div><Button>Alterar senha</Button></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
