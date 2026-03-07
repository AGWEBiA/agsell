import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Package, Settings } from 'lucide-react';
import { usePaidGroupProducts, usePaidGroups, usePaidGroupProductLinks } from '@/hooks/usePaidGroups';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';

const GATEWAYS = [
  'stripe', 'kiwify', 'hotmart', 'eduzz', 'monetizze', 'perfectpay',
  'braip', 'guru', 'lastlink', 'pepper', 'yampi', 'ticto', 'kirvano',
  'payt', 'greenn', 'cartpanda', 'herospark', 'appmax', 'doppus', 'generic',
];

export function PaidGroupProducts() {
  const { products, isLoading, createProduct, deleteProduct } = usePaidGroupProducts();
  const { groups } = usePaidGroups();
  const { linkGroup, unlinkGroup } = usePaidGroupProductLinks();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const handleCreate = () => {
    const gatewayMappings: Record<string, string[]> = {};
    Object.entries(mappings).forEach(([gw, ids]) => {
      if (ids.trim()) gatewayMappings[gw] = ids.split(',').map(s => s.trim());
    });
    createProduct.mutate({ name, description: description || undefined, price: price ? Number(price) : undefined, gateway_mappings: gatewayMappings }, {
      onSuccess: () => { setOpen(false); setName(''); setDescription(''); setPrice(''); setMappings({}); },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Produtos</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Criar Produto</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Curso Premium" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição opcional" />
              </div>
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>IDs dos Gateways</Label>
                <p className="text-xs text-muted-foreground">Informe os IDs externos separados por vírgula para cada gateway.</p>
                {GATEWAYS.map((gw) => (
                  <div key={gw} className="flex items-center gap-2">
                    <Badge variant="outline" className="min-w-[90px] justify-center text-xs">{gw}</Badge>
                    <Input className="text-xs" placeholder="id1, id2..." value={mappings[gw] || ''} onChange={(e) => setMappings({ ...mappings, [gw]: e.target.value })} />
                  </div>
                ))}
              </div>
              <Button onClick={handleCreate} disabled={!name || createProduct.isPending} className="w-full">Criar Produto</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Gateways</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const gwMappings = (p.gateway_mappings || {}) as Record<string, string[]>;
                const activeGateways = Object.keys(gwMappings).filter(k => gwMappings[k]?.length > 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.price ? `R$ ${Number(p.price).toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {activeGateways.slice(0, 3).map(gw => (
                          <Badge key={gw} variant="secondary" className="text-xs">{gw}</Badge>
                        ))}
                        {activeGateways.length > 3 && <Badge variant="secondary" className="text-xs">+{activeGateways.length - 3}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <ProductGroupLinks productId={p.id} groups={groups} linkGroup={linkGroup} unlinkGroup={unlinkGroup} />
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ProductGroupLinks({ productId, groups, linkGroup, unlinkGroup }: { productId: string; groups: any[]; linkGroup: any; unlinkGroup: any }) {
  const [open, setOpen] = useState(false);

  const { data: links = [] } = useQuery({
    queryKey: ['paid-group-product-links', productId],
    queryFn: async () => {
      const { data, error } = await supabase.from('paid_group_product_links').select('*').eq('product_id', productId);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const linkedGroupIds = links.map((l: any) => l.group_id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Vincular Grupos ao Produto</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Crie grupos primeiro.</p>
          ) : groups.map((g: any) => {
            const isLinked = linkedGroupIds.includes(g.id);
            const link = links.find((l: any) => l.group_id === g.id);
            return (
              <div key={g.id} className="flex items-center gap-2 p-2 rounded-lg border">
                <Checkbox checked={isLinked} onCheckedChange={(checked) => {
                  if (checked) linkGroup.mutate({ product_id: productId, group_id: g.id });
                  else if (link) unlinkGroup.mutate(link.id);
                }} />
                <span className="text-sm">{g.name}</span>
                <code className="text-xs text-muted-foreground ml-auto">{g.group_jid}</code>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
