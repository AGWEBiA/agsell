import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Users } from 'lucide-react';
import { usePaidGroups } from '@/hooks/usePaidGroups';

export function PaidGroupsManager() {
  const { groups, isLoading, createGroup, deleteGroup } = usePaidGroups();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [jid, setJid] = useState('');
  const [instance, setInstance] = useState('');

  const handleCreate = () => {
    createGroup.mutate({ name, group_jid: jid, instance_name: instance }, {
      onSuccess: () => { setOpen(false); setName(''); setJid(''); setInstance(''); },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Grupos</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Grupo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Grupo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Grupo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Grupo VIP" />
              </div>
              <div className="space-y-2">
                <Label>Group JID</Label>
                <Input value={jid} onChange={(e) => setJid(e.target.value)} placeholder="120363xxx@g.us" />
              </div>
              <div className="space-y-2">
                <Label>Nome da Instância</Label>
                <Input value={instance} onChange={(e) => setInstance(e.target.value)} placeholder="minha-instancia" />
              </div>
              <Button onClick={handleCreate} disabled={!name || !jid || createGroup.isPending} className="w-full">Criar Grupo</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>JID</TableHead>
                <TableHead>Instância</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell><code className="text-xs">{g.group_jid}</code></TableCell>
                  <TableCell>{g.instance_name || '-'}</TableCell>
                  <TableCell><Badge variant={g.is_active ? 'default' : 'secondary'}>{g.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteGroup.mutate(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
