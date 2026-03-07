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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Package, Settings, Info } from 'lucide-react';
import { usePaidGroupProducts, usePaidGroups, usePaidGroupProductLinks } from '@/hooks/usePaidGroups';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';

const ALL_GATEWAYS = [
  { id: 'stripe', label: 'Stripe' },
  { id: 'kiwify', label: 'Kiwify' },
  { id: 'hotmart', label: 'Hotmart' },
  { id: 'eduzz', label: 'Eduzz' },
  { id: 'monetizze', label: 'Monetizze' },
  { id: 'perfectpay', label: 'PerfectPay' },
  { id: 'braip', label: 'Braip' },
  { id: 'guru', label: 'Guru' },
  { id: 'lastlink', label: 'Lastlink' },
  { id: 'pepper', label: 'Pepper' },
  { id: 'yampi', label: 'Yampi' },
  { id: 'ticto', label: 'Ticto' },
  { id: 'kirvano', label: 'Kirvano' },
  { id: 'payt', label: 'Payt' },
  { id: 'greenn', label: 'Greenn' },
  { id: 'cartpanda', label: 'CartPanda' },
  { id: 'herospark', label: 'HeroSpark' },
  { id: 'appmax', label: 'AppMax' },
  { id: 'doppus', label: 'Doppus' },
  { id: 'generic', label: 'Webhook Genérico' },
];

export function PaidGroupProducts() {
  const { products, isLoading, createProduct, deleteProduct } = usePaidGroupProducts();
  const { groups } = usePaidGroups();
  const { linkGroup, unlinkGroup } = usePaidGroupProductLinks();
  const { getConnectedIntegrations } = useIntegrations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [manualGateways, setManualGateways] = useState<string[]>([]);
  const [addingGateway, setAddingGateway] = useState('');

  const connectedIntegrations = getConnectedIntegrations();

  // Map integration IDs to gateway IDs for matching
  const INTEGRATION_TO_GATEWAY: Record<string, string> = {
    hotmart: 'hotmart',
    kiwify: 'kiwify',
    eduzz: 'eduzz',
  };

  const connectedGatewayIds = connectedIntegrations
    .map(i => INTEGRATION_TO_GATEWAY[i.id])
    .filter(Boolean);

  // Gateways to show: connected ones + manually added ones (deduplicated)
  const visibleGatewayIds = [...new Set([...connectedGatewayIds, ...manualGateways])];

  const addManualGateway = () => {
    if (addingGateway && !visibleGatewayIds.includes(addingGateway)) {
      setManualGateways(prev => [...prev, addingGateway]);
    }
    setAddingGateway('');
  };

  const removeManualGateway = (gwId: string) => {
    setManualGateways(prev => prev.filter(g => g !== gwId));
    const newMappings = { ...mappings };
    delete newMappings[gwId];
    setMappings(newMappings);
  };

  // Available gateways to add manually (not yet visible)
  const availableToAdd = ALL_GATEWAYS.filter(gw => !visibleGatewayIds.includes(gw.id));

  const handleCreate = () => {
    const gatewayMappings: Record<string, string[]> = {};
    Object.entries(mappings).forEach(([gw, ids]) => {
      if (ids.trim()) gatewayMappings[gw] = ids.split(',').map(s => s.trim());
    });
    createProduct.mutate(
      { name, description: description || undefined, price: price ? Number(price) : undefined, gateway_mappings: gatewayMappings },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setDescription('');
          setPrice('');
          setMappings({});
          setManualGateways([]);
        },
      }
    );
  };

  const getGatewayLabel = (id: string) => ALL_GATEWAYS.find(g => g.id === id)?.label || id;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Produtos</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setManualGateways([]); setMappings({}); } }}>
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

              <Separator />

              {/* Gateway Mappings */}
              <div className="space-y-3">
                <div>
                  <Label>Mapeamento de Gateways</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Informe os IDs dos produtos/ofertas em cada gateway de pagamento.
                  </p>
                </div>

                {/* Connected integrations shown first */}
                {connectedGatewayIds.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" /> Gateways integrados na sua conta
                    </p>
                    {connectedGatewayIds.map((gwId) => (
                      <div key={gwId} className="flex items-center gap-2">
                        <Badge variant="default" className="min-w-[90px] justify-center text-xs">{getGatewayLabel(gwId)}</Badge>
                        <Input
                          className="text-xs"
                          placeholder="ID do produto no gateway"
                          value={mappings[gwId] || ''}
                          onChange={(e) => setMappings({ ...mappings, [gwId]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Manually added gateways */}
                {manualGateways.length > 0 && (
                  <div className="space-y-2">
                    {connectedGatewayIds.length > 0 && (
                      <p className="text-xs font-medium text-muted-foreground">Gateways adicionados manualmente</p>
                    )}
                    {manualGateways.map((gwId) => (
                      <div key={gwId} className="flex items-center gap-2">
                        <Badge variant="outline" className="min-w-[90px] justify-center text-xs">{getGatewayLabel(gwId)}</Badge>
                        <Input
                          className="text-xs flex-1"
                          placeholder="ID do produto no gateway"
                          value={mappings[gwId] || ''}
                          onChange={(e) => setMappings({ ...mappings, [gwId]: e.target.value })}
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeManualGateway(gwId)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add more gateways */}
                {availableToAdd.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select value={addingGateway} onValueChange={setAddingGateway}>
                      <SelectTrigger className="text-xs flex-1">
                        <SelectValue placeholder="Adicionar gateway..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableToAdd.map((gw) => (
                          <SelectItem key={gw.id} value={gw.id}>{gw.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={addManualGateway} disabled={!addingGateway}>
                      <Plus className="h-3 w-3 mr-1" /> Adicionar
                    </Button>
                  </div>
                )}

                {visibleGatewayIds.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum gateway integrado encontrado. Adicione manualmente acima ou integre na página de Integrações.
                  </p>
                )}
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
                          <Badge key={gw} variant="secondary" className="text-xs">{getGatewayLabel(gw)}</Badge>
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
