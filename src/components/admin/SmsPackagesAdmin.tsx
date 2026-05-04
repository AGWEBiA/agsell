import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Loader2, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SmsPackageRow {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  kiwify_checkout_url: string | null;
  kiwify_product_id: string | null;
  
  sort_order: number;
  is_active: boolean;
}

export function SmsPackagesAdmin() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<SmsPackageRow>>({});

  const { data: packages, isLoading } = useQuery({
    queryKey: ['sms-packages-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_credit_packages')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as SmsPackageRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<SmsPackageRow> }) => {
      const { error } = await supabase
        .from('sms_credit_packages')
        .update({
          kiwify_checkout_url: values.kiwify_checkout_url || null,
          kiwify_product_id: values.kiwify_product_id || null,
          
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-packages-admin'] });
      toast.success('Pacote SMS atualizado!');
      setEditingId(null);
      setEditValues({});
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const startEdit = (pkg: SmsPackageRow) => {
    setEditingId(pkg.id);
    setEditValues({
      kiwify_checkout_url: pkg.kiwify_checkout_url || '',
      kiwify_product_id: pkg.kiwify_product_id || '',
      
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
          <MessageSquare className="h-5 w-5 text-primary" />
          Pacotes SMS — Configuração de Checkout
        </CardTitle>
        <CardDescription>
          Configure as URLs de checkout da Kiwify para cada pacote de créditos SMS.
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
          <p><strong>💡 Dica:</strong> Cole a URL completa de checkout do produto da Kiwify. 
          O sistema utilizará a Kiwify para processar compras de créditos SMS.</p>
        </div>
      </CardContent>
    </Card>
  );
}
