import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Loader2, Phone, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoipPackageRow {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  kiwify_checkout_url: string | null;
  kiwify_product_id: string | null;
  stripe_price_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export function VoipPackagesAdmin() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<VoipPackageRow>>({});

  const { data: packages, isLoading } = useQuery({
    queryKey: ['voip-packages-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voip_credit_packages')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as VoipPackageRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<VoipPackageRow> }) => {
      const { error } = await supabase
        .from('voip_credit_packages')
        .update({
          kiwify_checkout_url: values.kiwify_checkout_url || null,
          kiwify_product_id: values.kiwify_product_id || null,
          stripe_price_id: values.stripe_price_id || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voip-packages-admin'] });
      toast.success('Pacote atualizado!');
      setEditingId(null);
      setEditValues({});
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const startEdit = (pkg: VoipPackageRow) => {
    setEditingId(pkg.id);
    setEditValues({
      kiwify_checkout_url: pkg.kiwify_checkout_url || '',
      kiwify_product_id: pkg.kiwify_product_id || '',
      stripe_price_id: pkg.stripe_price_id || '',
    });
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          Pacotes VoIP — Configuração de Checkout
        </CardTitle>
        <CardDescription>
          Configure as URLs de checkout da Kiwify e/ou os Price IDs do Stripe para cada pacote de créditos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pacote</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Kiwify Checkout URL</TableHead>
              <TableHead>Kiwify Product ID</TableHead>
              <TableHead>Stripe Price ID</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(packages ?? []).map((pkg) => {
              const isEditing = editingId === pkg.id;
              return (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="font-medium">{pkg.name}</div>
                    <div className="text-xs text-muted-foreground">{pkg.credits.toLocaleString()} créditos</div>
                  </TableCell>
                  <TableCell className="text-sm">{formatCurrency(pkg.price_cents)}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editValues.kiwify_checkout_url || ''}
                        onChange={(e) => setEditValues((v) => ({ ...v, kiwify_checkout_url: e.target.value }))}
                        placeholder="https://pay.kiwify.com.br/..."
                        className="text-xs"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
                        {pkg.kiwify_checkout_url || '—'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editValues.kiwify_product_id || ''}
                        onChange={(e) => setEditValues((v) => ({ ...v, kiwify_product_id: e.target.value }))}
                        placeholder="kiwify_product_id"
                        className="text-xs"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{pkg.kiwify_product_id || '—'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editValues.stripe_price_id || ''}
                        onChange={(e) => setEditValues((v) => ({ ...v, stripe_price_id: e.target.value }))}
                        placeholder="price_..."
                        className="text-xs"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{pkg.stripe_price_id || '—'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: pkg.id, values: editValues })}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditValues({}); }}>
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEdit(pkg)}>
                        Editar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground">
          <p><strong>💡 Dica:</strong> Para Kiwify, cole a URL completa de checkout do produto. Para Stripe, informe o Price ID (ex: <code>price_1Abc...</code>). 
          Se o Stripe Price ID não for informado, o sistema criará um checkout avulso com o valor do pacote.</p>
        </div>
      </CardContent>
    </Card>
  );
}
