import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContacts } from '@/hooks/useContacts';
import { useContactPreferences } from '@/hooks/useContactPreferences';
import { Mail, MessageSquare, Phone, Search, ShieldCheck, UserX, Link, Copy } from 'lucide-react';
import { toast } from 'sonner';

const channels = [
  { key: 'email', label: 'E-mail', icon: Mail },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { key: 'sms', label: 'SMS', icon: Phone },
];

export default function ContactPreferencesPage() {
  const { data: contacts = [] } = useContacts();
  const { preferences, isLoading, toggleOptOut, bulkOptOut } = useContactPreferences();
  const [search, setSearch] = useState('');
  const [bulkChannel, setBulkChannel] = useState('email');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('manage');

  const filteredContacts = contacts.filter(c =>
    !search || `${c.first_name} ${c.last_name || ''} ${c.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const getOptOutStatus = (contactId: string, channel: string) => {
    return preferences.find(p => p.contact_id === contactId && p.channel === channel)?.opted_out ?? false;
  };

  const optedOutCount = (channel: string) =>
    preferences.filter(p => p.channel === channel && p.opted_out).length;

  const toggleSelect = (id: string) => {
    setSelectedContacts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleBulkOptOut = (optedOut: boolean) => {
    if (selectedContacts.length === 0) return toast.error('Selecione contatos primeiro');
    bulkOptOut.mutate({ contactIds: selectedContacts, channel: bulkChannel, optedOut });
    setSelectedContacts([]);
  };

  const generateUnsubLink = (contactId: string) => {
    const token = btoa(`${contactId}:${Date.now()}`);
    const link = `${window.location.origin}/unsubscribe?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de descadastro copiado!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Preferências de Contato</h1>
        <p className="text-muted-foreground">Gestão centralizada de opt-out e descadastro granular por canal</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channels.map(ch => {
          const Icon = ch.icon;
          const count = optedOutCount(ch.key);
          return (
            <Card key={ch.key}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <Icon className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opt-outs {ch.label}</p>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manage">Gerenciar Opt-outs</TabsTrigger>
          <TabsTrigger value="bulk">Ações em Massa</TabsTrigger>
          <TabsTrigger value="unsubscribe">Links de Descadastro</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Opt-outs por Canal</CardTitle>
                  <CardDescription>O contato pode sair do WhatsApp mas continuar recebendo e-mails</CardDescription>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar contato..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>E-mail</TableHead>
                    {channels.map(ch => <TableHead key={ch.key} className="text-center">{ch.label}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.slice(0, 50).map(contact => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.first_name} {contact.last_name || ''}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.email || '-'}</TableCell>
                      {channels.map(ch => (
                        <TableCell key={ch.key} className="text-center">
                          <Switch checked={!getOptOutStatus(contact.id, ch.key)} onCheckedChange={checked => toggleOptOut.mutate({ contactId: contact.id, channel: ch.key, optedOut: !checked })} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {filteredContacts.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum contato encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserX className="h-5 w-5" /> Opt-out em Massa</CardTitle>
              <CardDescription>Selecione contatos e aplique opt-out/opt-in por canal específico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={bulkChannel} onValueChange={setBulkChannel}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{channels.map(ch => <SelectItem key={ch.key} value={ch.key}>{ch.label}</SelectItem>)}</SelectContent>
                </Select>
                <Badge variant="secondary">{selectedContacts.length} selecionados</Badge>
                <Button size="sm" variant="destructive" onClick={() => handleBulkOptOut(true)} disabled={bulkOptOut.isPending}><UserX className="h-4 w-4 mr-1" />Descadastrar</Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkOptOut(false)} disabled={bulkOptOut.isPending}>Recadastrar</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"><input type="checkbox" onChange={e => setSelectedContacts(e.target.checked ? filteredContacts.slice(0, 50).map(c => c.id) : [])} /></TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="text-center">Status {channels.find(c => c.key === bulkChannel)?.label}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.slice(0, 50).map(contact => (
                    <TableRow key={contact.id}>
                      <TableCell><input type="checkbox" checked={selectedContacts.includes(contact.id)} onChange={() => toggleSelect(contact.id)} /></TableCell>
                      <TableCell className="font-medium">{contact.first_name} {contact.last_name || ''}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.email || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getOptOutStatus(contact.id, bulkChannel) ? 'destructive' : 'default'}>{getOptOutStatus(contact.id, bulkChannel) ? 'Opt-out' : 'Ativo'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unsubscribe">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link className="h-5 w-5" /> Links de Descadastro Granular</CardTitle>
              <CardDescription>Gere links de descadastro individuais. O contato escolhe de quais canais sair.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status por Canal</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.slice(0, 30).map(contact => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.first_name} {contact.last_name || ''}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{contact.email || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {channels.map(ch => (
                            <Badge key={ch.key} variant={getOptOutStatus(contact.id, ch.key) ? 'destructive' : 'secondary'} className="text-[10px]">{ch.label}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => generateUnsubLink(contact.id)}>
                          <Copy className="h-3 w-3 mr-1" />Copiar Link
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
