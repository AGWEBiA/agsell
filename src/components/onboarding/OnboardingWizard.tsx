import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, GitBranch, UserPlus, Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentOrganization, refreshOrganizations } = useOrganization();
  const { progress, currentStep, completionPercentage, initializeOnboarding, updateStep } = useOnboarding();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [orgName, setOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [pipelineStages, setPipelineStages] = useState(['Novo Lead', 'Qualificação', 'Proposta', 'Negociação', 'Fechado']);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    if (!open) return;

    if (currentOrganization && !progress) {
      initializeOnboarding.mutate();
    }
    if (currentOrganization) {
      setOrgName(currentOrganization.name);
    }
  }, [open, currentOrganization, progress]);

  useEffect(() => {
    if (progress) {
      if (!progress.step_profile_completed) setStep(1);
      else if (!progress.step_team_completed) setStep(2);
      else if (!progress.step_pipeline_completed) setStep(3);
      else if (!progress.step_first_contact_completed) setStep(4);
      else setStep(5);
    }
  }, [progress]);

  const handleStep1Complete = async () => {
    if (!currentOrganization) return;
    setLoading(true);
    try {
      // Update organization name if changed
      if (orgName !== currentOrganization.name) {
        await supabase
          .from('organizations')
          .update({ name: orgName })
          .eq('id', currentOrganization.id);
        await refreshOrganizations();
      }
      await updateStep.mutateAsync('step_profile_completed');
      setStep(2);
      toast.success('Perfil da organização configurado!');
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Complete = async () => {
    setLoading(true);
    try {
      // Skip team invite for now, but mark as complete
      await updateStep.mutateAsync('step_team_completed');
      setStep(3);
      toast.success('Configuração de equipe concluída!');
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Complete = async () => {
    if (!currentOrganization || !user) return;
    setLoading(true);
    try {
      // Create pipeline stages
      for (let i = 0; i < pipelineStages.length; i++) {
        await supabase.from('pipeline_stages').insert({
          name: pipelineStages[i],
          position: i,
          user_id: user.id,
          organization_id: currentOrganization.id,
          color: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#22C55E'][i] || '#3B82F6',
        });
      }
      await updateStep.mutateAsync('step_pipeline_completed');
      setStep(4);
      toast.success('Pipeline configurado!');
    } catch (error) {
      toast.error('Erro ao criar pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Complete = async () => {
    if (!currentOrganization || !user || !contactName) return;
    setLoading(true);
    try {
      await supabase.from('contacts').insert({
        first_name: contactName.split(' ')[0],
        last_name: contactName.split(' ').slice(1).join(' ') || null,
        email: contactEmail || null,
        user_id: user.id,
        organization_id: currentOrganization.id,
        source: 'onboarding',
      });
      await updateStep.mutateAsync('step_first_contact_completed');
      setStep(5);
      toast.success('Primeiro contato criado!');
    } catch (error) {
      toast.error('Erro ao criar contato');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onComplete();
    navigate('/dashboard');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onComplete();
    }
  };

  const steps = [
    { icon: Building2, title: 'Perfil', description: 'Configure sua organização' },
    { icon: Users, title: 'Equipe', description: 'Convide sua equipe' },
    { icon: GitBranch, title: 'Pipeline', description: 'Configure seu funil' },
    { icon: UserPlus, title: 'Contato', description: 'Adicione seu primeiro lead' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Progress Header */}
        <div className="p-6 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Bem-vindo ao AG Sell!</h2>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 text-sm ${
                  idx + 1 <= step ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    idx + 1 < step
                      ? 'bg-primary text-primary-foreground'
                      : idx + 1 === step
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {idx + 1 < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Configure sua organização</h3>
                <p className="text-muted-foreground text-sm">
                  Vamos começar configurando o nome da sua empresa ou equipe.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Nome da Organização</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Minha Empresa"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleStep1Complete} disabled={loading || !orgName}>
                  {loading ? 'Salvando...' : 'Continuar'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Convide sua equipe</h3>
                <p className="text-muted-foreground text-sm">
                  Adicione membros à sua equipe para colaborar. Você pode pular esta etapa e fazer isso depois.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email do colega (opcional)</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colega@empresa.com"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleStep2Complete} disabled={loading}>
                  {loading ? 'Salvando...' : 'Continuar'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Configure seu pipeline de vendas</h3>
                <p className="text-muted-foreground text-sm">
                  Defina as etapas do seu funil de vendas. Você pode personalizar depois.
                </p>
              </div>
              <div className="space-y-3">
                {pipelineStages.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                      {idx + 1}
                    </div>
                    <Input
                      value={stage}
                      onChange={(e) => {
                        const newStages = [...pipelineStages];
                        newStages[idx] = e.target.value;
                        setPipelineStages(newStages);
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleStep3Complete} disabled={loading}>
                  {loading ? 'Salvando...' : 'Continuar'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Adicione seu primeiro contato</h3>
                <p className="text-muted-foreground text-sm">
                  Vamos criar seu primeiro lead para você começar a usar o CRM.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Nome do Contato</Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email (opcional)</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="joao@exemplo.com"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleStep4Complete} disabled={loading || !contactName}>
                  {loading ? 'Salvando...' : 'Continuar'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Parabéns! 🎉</h3>
                <p className="text-muted-foreground">
                  Sua conta está configurada e pronta para uso. Vamos começar a vender!
                </p>
              </div>
              <Button size="lg" onClick={handleFinish}>
                Ir para o Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
