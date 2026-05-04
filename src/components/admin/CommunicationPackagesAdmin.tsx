import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Loader2, Wallet } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PackageRow {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  kiwify_checkout_url: string | null;
  kiwify_product_id: string | null;
  
  sort_order: number;
  is_active: boolean;
}

export function CommunicationPackagesAdmin() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PackageRow>>({});

  const { data: packages, isLoading } = useQuery({
    queryKey: ['communication-packages-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communication_credit_packages')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as PackageRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<PackageRow> }) => {
      const { error } = await supabase
        .from('communication_credit_packages')
        .update({
          kiwify_checkout_url: values.kiwify_checkout_url || null,
          kiwify_product_id: values.kiwify_product_id || null,
          
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-packages-admin'] });
      toast.success('Pacote atualizado!');
      setEditingId(null);
    },
    onError: () => toast.error('Erro ao atualizar pacote'),
  });

  const startEdit = (pkg: PackageRow) => {
    setEditingId(pkg.id);
    setEditValues({
      kiwify_checkout_url: pkg.kiwify_checkout_url || '',
      kiwify_product_id: pkg.kiwify_product_id || '',
      
    });
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({ id, values: editValues });
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  if (isLoading) return <div className="p-4 text-muted-foreground">Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Pacotes de Créditos de Comunicação
        </CardTitle>
        <CardDescription>
          Configure URLs de checkout Kiwify para cada pacote unificado (SMS + VoIP)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pacote</TableHead>
              <TableHead>Créditos</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kiwify URL</TableHead>
              <TableHead>Kiwify Product ID</TableHead>
              
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages?.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell>{pkg.credits.toLocaleString('pt-BR')}</TableCell>
                <TableCell>{formatCurrency(pkg.price_cents)}</TableCell>
                <TableCell>
                  <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                    {pkg.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {editingId === pkg.id ? (
                    <Input
                      value={editValues.kiwify_checkout_url || ''}
                      onChange={(e) => setEditValues({ ...editValues, kiwify_checkout_url: e.target.value })}
                      placeholder="https://..."
                      className="w-40"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground truncate max-w-[120px] block">
                      {pkg.kiwify_checkout_url || '-'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === pkg.id ? (
                    <Input
                      value={editValues.kiwify_product_id || ''}
                      onChange={(e) => setEditValues({ ...editValues, kiwify_product_id: e.target.value })}
                      placeholder="product_id"
                      className="w-32"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">{pkg.kiwify_product_id || '-'}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === pkg.id ? (
                    <Button size="sm" onClick={() => saveEdit(pkg.id)} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => startEdit(pkg)}>Editar</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
