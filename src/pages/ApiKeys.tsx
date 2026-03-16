import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Code, ExternalLink } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { toast } from 'sonner';

const PERMISSIONS = [
  { value: 'read', label: 'Leitura', description: 'Visualizar dados (GET)' },
  { value: 'write', label: 'Escrita', description: 'Criar e editar dados (POST/PUT)' },
  { value: 'delete', label: 'Exclusão', description: 'Remover dados (DELETE)' },
  { value: 'admin', label: 'Admin', description: 'Acesso total' },
];

export default function ApiKeys() {
  const { apiKeys, isLoading, createApiKey, updateApiKey, deleteApiKey } = useApiKeys();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ raw_key: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: ['read'] as string[],
    rate_limit_per_minute: 60,
    rate_limit_per_day: 10000,
  });

  const handleCreate = async () => {
    const result = await createApiKey.mutateAsync(formData);
    setNewKeyData(result);
    setFormData({
      name: '',
      permissions: ['read'],
      rate_limit_per_minute: 60,
      rate_limit_per_day: 10000,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência');
  };

  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Gerencie chaves de acesso para integrações externas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            {newKeyData ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Criada!</DialogTitle>
                  <DialogDescription>
                    Copie sua chave agora. Ela não será exibida novamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
                    {newKeyData.raw_key}
                  </div>
                  <Button onClick={() => copyToClipboard(newKeyData.raw_key)} className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Chave
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setNewKeyData(null);
                    setIsDialogOpen(false);
                  }}>
                    Fechar
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Nova API Key</DialogTitle>
                  <DialogDescription>
                    Crie uma nova chave para acessar a API pública
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      placeholder="Ex: Integração Zapier"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissões</Label>
                    <div className="space-y-2">
                      {PERMISSIONS.map((perm) => (
                        <div key={perm.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={perm.value}
                            checked={formData.permissions.includes(perm.value)}
                            onCheckedChange={(checked) => {
                              setFormData({
                                ...formData,
                                permissions: checked
                                  ? [...formData.permissions, perm.value]
                                  : formData.permissions.filter((p) => p !== perm.value),
                              });
                            }}
                          />
                          <Label htmlFor={perm.value} className="flex-1 cursor-pointer">
                            <span className="font-medium">{perm.label}</span>
                            <span className="text-muted-foreground text-sm ml-2">{perm.description}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Limite/minuto</Label>
                      <Input
                        type="number"
                        value={formData.rate_limit_per_minute}
                        onChange={(e) => setFormData({ ...formData, rate_limit_per_minute: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Limite/dia</Label>
                      <Input
                        type="number"
                        value={formData.rate_limit_per_day}
                        onChange={(e) => setFormData({ ...formData, rate_limit_per_day: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={!formData.name || createApiKey.isPending}>
                    {createApiKey.isPending ? 'Criando...' : 'Criar API Key'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Documentação da API
          </CardTitle>
          <CardDescription>Referência rápida para integração</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Base URL</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm">{apiBaseUrl}</code>
              <Button size="icon" variant="outline" onClick={() => copyToClipboard(apiBaseUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Autenticação</Label>
            <code className="block p-2 bg-muted rounded text-sm">
              Header: X-API-Key: sua_api_key_aqui
            </code>
          </div>
          <div className="space-y-2">
            <Label>Endpoints Disponíveis</Label>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <code>GET /contacts</code>
                <span className="text-muted-foreground">Listar contatos</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <code>POST /contacts</code>
                <span className="text-muted-foreground">Criar contato</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <code>GET /companies</code>
                <span className="text-muted-foreground">Listar empresas</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <code>GET /deals</code>
                <span className="text-muted-foreground">Listar negócios</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <code>GET /tags</code>
                <span className="text-muted-foreground">Listar tags</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <code>GET /metrics/overview</code>
                <span className="text-muted-foreground">Métricas gerais</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <code>GET /metrics/email</code>
                <span className="text-muted-foreground">Métricas de e-mail</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <code>GET /metrics/leads</code>
                <span className="text-muted-foreground">Métricas de leads</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <code>GET /metrics/pipeline</code>
                <span className="text-muted-foreground">Métricas de pipeline</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <code>GET /metrics/automations</code>
                <span className="text-muted-foreground">Métricas de automações</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <code>GET /metrics/forms</code>
                <span className="text-muted-foreground">Métricas de formulários</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Exemplo cURL</Label>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`curl -X GET "${apiBaseUrl}/contacts?limit=10" \\
  -H "X-API-Key: ag_xxxxxxxxxxxxx"`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Suas API Keys
          </CardTitle>
          <CardDescription>
            {apiKeys.length} {apiKeys.length === 1 ? 'chave' : 'chaves'} cadastrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma API key criada ainda</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Prefixo</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead>Uso Hoje</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{key.key_prefix}...</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {key.permissions.map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={key.requests_today > key.rate_limit_per_day * 0.8 ? 'text-destructive' : ''}>
                        {key.requests_today.toLocaleString()} / {key.rate_limit_per_day.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={key.is_active}
                        onCheckedChange={(checked) => 
                          updateApiKey.mutate({ id: key.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover API Key?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Todas as integrações usando esta chave deixarão de funcionar.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteApiKey.mutate(key.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
