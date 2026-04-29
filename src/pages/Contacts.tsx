import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  MessageSquare,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, type Contact, type CreateContactData } from '@/hooks/useContacts';
import { PageHeader, EmptyState, FormField } from '@/components/ui/help-tooltip';
import { useCompanies } from '@/hooks/useCompanies';
import { ImportContactsDialog } from '@/components/contacts/ImportContactsDialog';
import { ImportJobsList } from '@/components/contacts/ImportJobsList';
import { ContactTagsManager } from '@/components/contacts/ContactTagsManager';
import { Contact360Drawer } from '@/components/contacts/Contact360Drawer';
import { BulkTagsDialog } from '@/components/contacts/BulkTagsDialog';
import { TagsImportExportDialog } from '@/components/contacts/TagsImportExportDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tags, FileSpreadsheet } from 'lucide-react';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { useFeatureCheck } from '@/components/permissions/FeatureGate';
import { usePaginatedData } from '@/hooks/usePaginatedQuery';
import { DataPagination } from '@/components/ui/data-pagination';
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open import dialog when navigated with ?import=true
  useEffect(() => {
    if (searchParams.get('import') === 'true') {
      setIsImportOpen(true);
      searchParams.delete('import');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTagsOpen, setBulkTagsOpen] = useState(false);
  const [tagsCsvOpen, setTagsCsvOpen] = useState(false);
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
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { enforceLimit } = useFeatureCheck();

  const {
    paginatedItems: paginatedContacts,
    filteredItems: filteredContacts,
    totalFiltered,
    totalPages,
    page,
    pageSize,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
  } = usePaginatedData(
    contacts,
    (contact, term) =>
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(term.toLowerCase()) ||
      (contact.email?.toLowerCase() || '').includes(term.toLowerCase()) ||
      (contact.company?.name?.toLowerCase() || '').includes(term.toLowerCase()),
    searchTerm
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

  const handleEditContact = async () => {
    if (!editContact) return;
    const { id, first_name, last_name, email, phone, whatsapp, position, status, notes, company_id } = editContact;
    await updateContact.mutateAsync({ id, first_name, last_name, email, phone, whatsapp, position, status, notes, company_id });
    setEditContact(null);
  };

  const getInitials = (firstName: string, lastName?: string | null) => {
    return `${firstName[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Contatos"
        description="Gerencie seus leads e clientes"
        helpText="Contatos são pessoas com quem você faz negócios. Organize por status (Lead, Qualificado, Cliente) e acompanhe o score de engajamento."
      >
        <PermissionGate module="contacts" action="import">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
        </PermissionGate>
        <Button variant="outline" size="sm" onClick={() => setTagsCsvOpen(true)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Tags CSV
        </Button>
        {selectedIds.size > 0 && (
          <Button size="sm" onClick={() => setBulkTagsOpen(true)}>
            <Tags className="h-4 w-4 mr-2" />
            Tags em massa ({selectedIds.size})
          </Button>
        )}
        <PermissionGate module="contacts" action="export">
          <Button variant="outline" size="sm" onClick={() => {
            if (contacts.length === 0) {
              toast.error('Nenhum contato para exportar.');
              return;
            }
            const headers = ['Nome', 'Sobrenome', 'Email', 'Telefone', 'WhatsApp', 'Empresa', 'Status', 'Score', 'Fonte', 'Criado em'];
            const rows = contacts.map(c => [
              c.first_name, c.last_name || '', c.email || '', c.phone || '', c.whatsapp || '',
              c.company?.name || '', c.status || '', String(c.lead_score || 0), c.source || '',
              new Date(c.created_at).toLocaleDateString('pt-BR'),
            ]);
            const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','))].join('\n');
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contatos-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Contatos exportados com sucesso!');
          }}>
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
                  <PhoneInput
                    id="phone"
                    value={newContact.phone || ''}
                    onChange={(v) => setNewContact({ ...newContact, phone: v })}
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
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" className="self-end sm:self-auto shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contatos ({totalFiltered})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8 text-muted-foreground" />}
              title={contacts.length === 0 ? "Nenhum contato cadastrado" : "Nenhum contato encontrado"}
              description={contacts.length === 0 
                ? "Comece adicionando seu primeiro contato ou importe uma lista existente." 
                : "Tente ajustar os termos da busca."}
              action={contacts.length === 0 ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Lista
                  </Button>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Contato
                  </Button>
                </div>
              ) : undefined}
              tips={contacts.length === 0 ? [
                "Importe contatos de uma planilha CSV",
                "Contatos criados via formulários aparecem aqui automaticamente",
                "Use tags para organizar seus contatos"
              ] : undefined}
            />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={paginatedContacts.length > 0 && paginatedContacts.every(c => selectedIds.has(c.id))}
                      onCheckedChange={(v) => {
                        const next = new Set(selectedIds);
                        if (v) paginatedContacts.forEach(c => next.add(c.id));
                        else paginatedContacts.forEach(c => next.delete(c.id));
                        setSelectedIds(next);
                      }}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
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
                {paginatedContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(contact.id)}
                        onCheckedChange={(v) => {
                          const next = new Set(selectedIds);
                          if (v) next.add(contact.id); else next.delete(contact.id);
                          setSelectedIds(next);
                        }}
                        aria-label={`Selecionar ${contact.first_name}`}
                      />
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => setViewContact(contact)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <PermissionGate module="contacts" action="edit">
                            <DropdownMenuItem onClick={() => setEditContact({ ...contact })}>
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
            </div>
          )}
          <DataPagination
            page={page}
            totalPages={totalPages}
            totalItems={totalFiltered}
            pageSize={pageSize}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onNextPage={nextPage}
            onPrevPage={prevPage}
            onGoToPage={goToPage}
            onPageSizeChange={setPageSize}
          />
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
      <BulkTagsDialog
        open={bulkTagsOpen}
        onOpenChange={setBulkTagsOpen}
        contactIds={Array.from(selectedIds)}
      />
      <TagsImportExportDialog open={tagsCsvOpen} onOpenChange={setTagsCsvOpen} />

      {/* Import Jobs History */}
      {!isImportOpen && <ImportJobsList />}

      {/* Visão 360° do Contato */}
      <Contact360Drawer
        contact={viewContact}
        open={!!viewContact}
        onOpenChange={(o) => !o && setViewContact(null)}
      />

      {/* Edit Contact Dialog */}
      <Dialog open={!!editContact} onOpenChange={() => setEditContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
            <DialogDescription>Atualize as informações do contato</DialogDescription>
          </DialogHeader>
          {editContact && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nome *</Label>
                  <Input value={editContact.first_name} onChange={(e) => setEditContact({ ...editContact, first_name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Sobrenome</Label>
                  <Input value={editContact.last_name || ''} onChange={(e) => setEditContact({ ...editContact, last_name: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={editContact.email || ''} onChange={(e) => setEditContact({ ...editContact, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <PhoneInput value={editContact.phone || ''} onChange={(v) => setEditContact({ ...editContact, phone: v })} />
                </div>
                <div className="grid gap-2">
                  <Label>WhatsApp</Label>
                  <PhoneInput value={editContact.whatsapp || ''} onChange={(v) => setEditContact({ ...editContact, whatsapp: v })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Cargo</Label>
                  <Input value={editContact.position || ''} onChange={(e) => setEditContact({ ...editContact, position: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Empresa</Label>
                  <Select value={editContact.company_id || ''} onValueChange={(v) => setEditContact({ ...editContact, company_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={editContact.status || 'lead'} onValueChange={(v) => setEditContact({ ...editContact, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualified">Qualificado</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="churned">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Notas</Label>
                <Textarea value={editContact.notes || ''} onChange={(e) => setEditContact({ ...editContact, notes: e.target.value })} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContact(null)}>Cancelar</Button>
            <Button onClick={handleEditContact} disabled={updateContact.isPending || !editContact?.first_name}>
              {updateContact.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
