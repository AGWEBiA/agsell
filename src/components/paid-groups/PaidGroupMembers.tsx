import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserMinus, Users2 } from 'lucide-react';
import { usePaidGroupMembers, usePaidGroups, usePaidGroupProducts } from '@/hooks/usePaidGroups';
import { format } from 'date-fns';

export function PaidGroupMembers() {
  const { members, isLoading, removeMember } = usePaidGroupMembers();
  const { groups } = usePaidGroups();
  const { products } = usePaidGroupProducts();

  const getGroupName = (id: string) => groups.find(g => g.id === id)?.name || id;
  const getProductName = (id: string | null) => id ? products.find(p => p.id === id)?.name || id : '-';

  const activeMembers = members.filter(m => m.status === 'active');
  const removedMembers = members.filter(m => m.status === 'removed');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users2 className="h-5 w-5" /> Membros ({activeMembers.length} ativos)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum membro registrado ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Telefone</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell><code className="text-xs">{m.phone_number}</code></TableCell>
                  <TableCell>{m.customer_name || '-'}</TableCell>
                  <TableCell className="text-xs">{m.customer_email || '-'}</TableCell>
                  <TableCell className="text-xs">{getGroupName(m.group_id)}</TableCell>
                  <TableCell className="text-xs">{getProductName(m.product_id)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{m.gateway_source || '-'}</Badge></TableCell>
                  <TableCell><Badge variant={m.status === 'active' ? 'default' : 'secondary'}>{m.status}</Badge></TableCell>
                  <TableCell className="text-xs">{m.added_at ? format(new Date(m.added_at), 'dd/MM/yy HH:mm') : '-'}</TableCell>
                  <TableCell>
                    {m.status === 'active' && (
                      <Button variant="ghost" size="icon" onClick={() => removeMember.mutate(m.id)}>
                        <UserMinus className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
