import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  Upload,
  Loader2,
} from 'lucide-react';
import { useContacts, useCreateContact, useDeleteContact, type CreateContactData } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { ImportContactsDialog } from '@/components/contacts/ImportContactsDialog';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { useFeatureCheck } from '@/components/permissions/FeatureGate';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const statusColors: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  customer: 'bg-primary/10 text-primary',
  churned: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const statusLabels: Record<string, string> = {
  lead: 'Lead',
  qualified: 'Qualificado',
  customer: 'Cliente',
  churned: 'Inativo',
  active: 'Ativo',
};

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState<CreateContactData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_id: '',
    status: 'lead',
  });

  const { data: contacts = [], isLoading } = useContacts();
  const { data: companies = [] } = useCompanies();
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const { enforceLimit } = useFeatureCheck();

  const filteredContacts = contacts.filter(
    (contact) =>
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (contact.company?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleCreateContact = async () => {
    if (!newContact.first_name) return;
    
    // Verificar limite do plano
    const canCreate = await enforceLimit('contacts', contacts.length, () => {
      toast.error('Você atingiu o limite de contatos do seu plano. Faça upgrade para continuar.');
    });
    
    if (!canCreate) return;
    
    await createContact.mutateAsync({
      ...newContact,
      company_id: newContact.company_id || undefined,
    });
    setIsDialogOpen(false);
    setNewContact({ first_name: '', last_name: '', email: '', phone: '', company_id: '', status: 'lead' });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteContact.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getInitials = (firstName: string, lastName?: string | null) => {
    return `${firstName[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contatos</h1>
          <p className="text-muted-foreground">Gerencie seus leads e clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate module="contacts" action="import">
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
          </PermissionGate>
          <PermissionGate module="contacts" action="export">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </PermissionGate>
          <PermissionGate module="contacts" action="create">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Contato
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Contato</DialogTitle>
                <DialogDescription>
                  Adicione um novo contato ao seu CRM
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first_name">Nome *</Label>
                    <Input
                      id="first_name"
                      value={newContact.first_name}
                      onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                      placeholder="Nome"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last_name">Sobrenome</Label>
                    <Input
                      id="last_name"
                      value={newContact.last_name}
                      onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                      placeholder="Sobrenome"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Select
                    value={newContact.company_id}
                    onValueChange={(value) => setNewContact({ ...newContact, company_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newContact.status}
                    onValueChange={(value) => setNewContact({ ...newContact, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="qualified">Qualificado</SelectItem>
                      <SelectItem value="customer">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateContact} disabled={createContact.isPending || !newContact.first_name}>
                  {createContact.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Contato
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </PermissionGate>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contatos ({filteredContacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {contacts.length === 0 ? 'Nenhum contato cadastrado. Clique em "Novo Contato" para começar.' : 'Nenhum contato encontrado.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(contact.first_name, contact.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{contact.first_name} {contact.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {contact.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {contact.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.company && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {contact.company.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[contact.status || 'lead']} variant="secondary">
                        {statusLabels[contact.status || 'lead']}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={contact.lead_score && contact.lead_score >= 80 ? 'default' : contact.lead_score && contact.lead_score >= 60 ? 'secondary' : 'outline'}>
                        {contact.lead_score || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <PermissionGate module="contacts" action="edit">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate module="contacts" action="delete">
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(contact.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contato será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <ImportContactsDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
    </div>
  );
}
