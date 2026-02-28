import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Shield, Trash2, Loader2, RefreshCw, Pencil, Building2, X, Crown } from 'lucide-react';
import { AssignPlanDialog } from './AssignPlanDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
  organizations: { id: string; name: string; role: string }[];
}

export function UsersManagement() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: '' });
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [orgUser, setOrgUser] = useState<AdminUser | null>(null);
  const [orgForm, setOrgForm] = useState({ organization_id: '', org_role: 'member' });
  const [planAssignOrg, setPlanAssignOrg] = useState<{ id: string; name: string } | null>(null);

  const { data: organizations = [] } = useQuery({
    queryKey: ['admin_all_organizations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('id, name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: { action: 'list_users' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.users || []) as AdminUser[];
    },
  });

  const invokeMutation = (actionName: string, successMsg: string) =>
    useMutation({
      mutationFn: async (body: Record<string, unknown>) => {
        const { data, error } = await supabase.functions.invoke('admin-manage-users', {
          body: { action: actionName, ...body },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin_users'] });
        toast.success(successMsg);
      },
      onError: (error: Error) => toast.error(error.message),
    });

  const createUserMutation = invokeMutation('create_user', 'Usuário criado com sucesso!');
  const updateRoleMutation = invokeMutation('update_role', 'Permissão atualizada!');
  const deleteUserMutation = invokeMutation('delete_user', 'Usuário excluído!');
  const updateUserMutation = invokeMutation('update_user', 'Usuário atualizado!');
  const addToOrgMutation = invokeMutation('add_to_organization', 'Usuário adicionado à organização!');
  const removeFromOrgMutation = invokeMutation('remove_from_organization', 'Usuário removido da organização!');

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    createUserMutation.mutate(newUser as Record<string, unknown>);
    setIsCreateOpen(false);
    setNewUser({ email: '', password: '', name: '', role: '' });
  };

  const handleEditUser = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({ user_id: editingUser.id, name: editForm.name, email: editForm.email });
    setEditingUser(null);
  };

  const handleAddToOrg = () => {
    if (!orgUser || !orgForm.organization_id) {
      toast.error('Selecione uma organização');
      return;
    }
    addToOrgMutation.mutate({ user_id: orgUser.id, organization_id: orgForm.organization_id, org_role: orgForm.org_role });
    setOrgUser(null);
    setOrgForm({ organization_id: '', org_role: 'member' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>Crie, edite permissões e gerencie todos os usuários do sistema</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin_users'] })}>
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Create User Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>Preencha os dados para criar um novo usuário no sistema</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha *</Label>
                    <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role do Sistema</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="moderator">Moderador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Usuário
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Organizações</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {u.roles.length > 0 ? u.roles.map((r) => (
                            <Badge key={r} variant={r === 'admin' ? 'destructive' : 'secondary'} className="cursor-pointer"
                              onClick={() => { if (confirm(`Remover role "${r}" deste usuário?`)) updateRoleMutation.mutate({ user_id: u.id, role: r, remove: true }); }}>
                              {r} ✕
                            </Badge>
                          )) : <span className="text-sm text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {u.organizations.length > 0 ? u.organizations.map((o) => (
                            <div key={o.id} className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs cursor-pointer group"
                                onClick={() => { if (confirm(`Remover ${u.name || u.email} da organização "${o.name}"?`)) removeFromOrgMutation.mutate({ user_id: u.id, organization_id: o.id }); }}>
                                {o.name} ({o.role}) <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Badge>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-yellow-500 hover:text-yellow-600" title="Atribuir plano"
                                onClick={() => setPlanAssignOrg({ id: o.id, name: o.name })}>
                                <Crown className="h-3 w-3" />
                              </Button>
                            </div>
                          )) : <span className="text-sm text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* Edit User */}
                          <Button variant="ghost" size="sm" onClick={() => { setEditingUser(u); setEditForm({ name: u.name, email: u.email }); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* Add to Org */}
                          <Button variant="ghost" size="sm" onClick={() => { setOrgUser(u); setOrgForm({ organization_id: '', org_role: 'member' }); }}>
                            <Building2 className="h-4 w-4" />
                          </Button>

                          {/* Roles */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm"><Shield className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Gerenciar Roles - {u.name || u.email}</DialogTitle>
                                <DialogDescription>Adicione ou remova permissões do sistema</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Roles atuais</Label>
                                  <div className="flex gap-2 flex-wrap">
                                    {u.roles.length > 0 ? u.roles.map((r) => (
                                      <Badge key={r} variant={r === 'admin' ? 'destructive' : 'secondary'}>{r}</Badge>
                                    )) : <span className="text-sm text-muted-foreground">Nenhuma role atribuída</span>}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Adicionar role</Label>
                                  <div className="flex gap-2">
                                    {['admin', 'moderator', 'user'].filter((r) => !u.roles.includes(r)).map((r) => (
                                      <Button key={r} variant="outline" size="sm" onClick={() => updateRoleMutation.mutate({ user_id: u.id, role: r })} disabled={updateRoleMutation.isPending}>
                                        + {r}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                {u.roles.length > 0 && (
                                  <div className="space-y-2">
                                    <Label>Remover role</Label>
                                    <div className="flex gap-2">
                                      {u.roles.map((r) => (
                                        <Button key={r} variant="destructive" size="sm" onClick={() => updateRoleMutation.mutate({ user_id: u.id, role: r, remove: true })} disabled={updateRoleMutation.isPending}>
                                          - {r}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Delete */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação é irreversível. O usuário {u.email} será permanentemente excluído.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteUserMutation.mutate({ user_id: u.id })}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Altere o nome ou email do usuário</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button onClick={handleEditUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Organization Dialog */}
      <Dialog open={!!orgUser} onOpenChange={(open) => { if (!open) setOrgUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar à Organização</DialogTitle>
            <DialogDescription>Vincule {orgUser?.name || orgUser?.email} a uma organização</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Organização</Label>
              <Select value={orgForm.organization_id} onValueChange={(v) => setOrgForm({ ...orgForm, organization_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a organização" /></SelectTrigger>
                <SelectContent>
                  {organizations
                    .filter((o) => !orgUser?.organizations.some((uo) => uo.id === o.id))
                    .map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Papel na Organização</Label>
              <Select value={orgForm.org_role} onValueChange={(v) => setOrgForm({ ...orgForm, org_role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrgUser(null)}>Cancelar</Button>
            <Button onClick={handleAddToOrg} disabled={addToOrgMutation.isPending}>
              {addToOrgMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Assign Plan Dialog */}
      <AssignPlanDialog
        organization={planAssignOrg}
        open={!!planAssignOrg}
        onOpenChange={(open) => { if (!open) setPlanAssignOrg(null); }}
      />
    </div>
  );
}
