import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { User, Bell, Shield, Download, Trash2, AlertTriangle, HelpCircle, Phone, FileText, ShieldAlert, Loader2 } from 'lucide-react';
import { AuditLogPanel } from '@/components/security/AuditLogPanel';
import { SecurityAlertsPanel } from '@/components/security/SecurityAlertsPanel';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [profileName, setProfileName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('whatsapp_number, full_name')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile?.whatsapp_number) setWhatsappNumber(profile.whatsapp_number);
    if (profile?.full_name) setProfileName(profile.full_name);
  }, [profile]);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profileName })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Perfil salvo com sucesso!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar senha.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const saveWhatsAppMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Não autenticado');
      const digits = whatsappNumber.replace(/\D/g, '');
      const { error } = await supabase
        .from('profiles')
        .update({ whatsapp_number: digits })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Número salvo com sucesso!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-user-data`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Erro ao exportar dados');

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-agsell-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log audit event
      supabase.rpc('log_audit_event', {
        _org_id: null as any,
        _action: 'export',
        _resource_type: 'user_data',
        _resource_id: user?.id || null,
        _details: null,
      }).then(({ error }) => { if (error) console.error('Audit:', error); });

      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados. Tente novamente.');
      console.error(error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'EXCLUIR MINHA CONTA') {
      toast.error('Digite "EXCLUIR MINHA CONTA" para confirmar.');
      return;
    }

    setDeleteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user-data`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ confirmation: deleteConfirmation }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir conta');
      }

      toast.success('Conta excluída com sucesso.');
      await signOut();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir conta.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie suas preferências, segurança e dados pessoais</p>
      </div>
      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile" className="text-xs sm:text-sm"><User className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Perfil</span></TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm"><Bell className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Notificações</span></TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm"><Shield className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Segurança</span></TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs sm:text-sm"><Shield className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Privacidade</span></TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input 
                  placeholder="Seu nome" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)} 
                />
              </div>
              <div className="grid gap-2"><Label>Email</Label><Input type="email" placeholder="seu@email.com" value={user?.email || ''} disabled /></div>
              <Button onClick={() => saveProfileMutation.mutate()} disabled={saveProfileMutation.isPending || !profileName.trim()}>
                {saveProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> WhatsApp</CardTitle>
              <CardDescription>Seu número de WhatsApp para acesso a grupos exclusivos do seu plano.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Número de WhatsApp</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">+55</span>
                  <Input
                    value={formatPhoneDisplay(whatsappNumber)}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="(11) 99999-9999"
                    maxLength={16}
                  />
                </div>
              </div>
              <Button onClick={() => saveWhatsAppMutation.mutate()} disabled={saveWhatsAppMutation.isPending}>
                {saveWhatsAppMutation.isPending ? 'Salvando...' : 'Salvar WhatsApp'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Notificações</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="font-medium">Novos leads</p><p className="text-sm text-muted-foreground">Receber notificação de novos leads</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-medium">Vendas</p><p className="text-sm text-muted-foreground">Receber notificação de vendas</p></div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Alterar Senha</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Nova senha</Label>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={passwordLoading || !newPassword}>
                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar senha
              </Button>
            </CardContent>
          </Card>
          <SecurityAlertsPanel />
          <AuditLogPanel />
        </TabsContent>

        <TabsContent value="privacy" className="mt-4 space-y-4">
          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Exportar Meus Dados</CardTitle>
              <CardDescription>
                Conforme a LGPD (Art. 18), você tem direito à portabilidade dos seus dados. Exporte todos os seus dados pessoais em formato JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportData} disabled={exportLoading} variant="outline">
                {exportLoading ? 'Exportando...' : 'Baixar Meus Dados'}
              </Button>
            </CardContent>
          </Card>

          {/* Legal Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Legais</CardTitle>
              <CardDescription>Consulte nossos documentos de privacidade e termos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/privacy-policy" className="text-primary hover:underline block" target="_blank">
                📄 Política de Privacidade
              </Link>
              <Link to="/terms-of-service" className="text-primary hover:underline block" target="_blank">
                📄 Termos de Uso
              </Link>
            </CardContent>
          </Card>

          {/* Account Deletion */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" /> Excluir Minha Conta
              </CardTitle>
              <CardDescription>
                Conforme a LGPD (Art. 18), você tem direito à eliminação dos seus dados pessoais. Esta ação é irreversível.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Solicitar Exclusão da Conta</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Excluir conta permanentemente
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>Esta ação é <strong>irreversível</strong>. Todos os seus dados serão permanentemente excluídos, incluindo:</p>
                      <ul className="list-disc pl-6 text-sm space-y-1">
                        <li>Perfil e dados de conta</li>
                        <li>Contatos e empresas cadastradas</li>
                        <li>Negócios e pipeline</li>
                        <li>Automações e formulários</li>
                        <li>Histórico de tarefas e atividades</li>
                      </ul>
                      <p className="font-medium">Digite <strong>EXCLUIR MINHA CONTA</strong> para confirmar:</p>
                      <Input
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="EXCLUIR MINHA CONTA"
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== 'EXCLUIR MINHA CONTA' || deleteLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteLoading ? 'Excluindo...' : 'Excluir Permanentemente'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
