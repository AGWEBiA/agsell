import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FormSettings } from '@/components/forms/FormTemplates';
import { DEFAULT_SETTINGS } from '@/components/forms/FormTemplates';

interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export default function FormView() {
  const { formId } = useParams<{ formId: string }>();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Style params from URL (fallback)
  const urlPrimary = searchParams.get('primary') ? `#${searchParams.get('primary')}` : undefined;
  const urlBg = searchParams.get('bg') ? `#${searchParams.get('bg')}` : undefined;
  const urlText = searchParams.get('text') ? `#${searchParams.get('text')}` : undefined;
  const urlRadius = searchParams.get('radius') || undefined;
  const urlFont = searchParams.get('font') || undefined;

  const { data: form, isLoading, error } = useQuery({
    queryKey: ['public-form', formId],
    queryFn: async () => {
      if (!formId) throw new Error('Form ID missing');
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!formId,
  });

  const fields: FormField[] = Array.isArray(form?.fields) ? (form.fields as unknown as FormField[]) : [];
  
  // Merge settings from DB with URL params
  const dbSettings: FormSettings = form?.settings
    ? { ...DEFAULT_SETTINGS, ...(form.settings as unknown as Partial<FormSettings>) }
    : DEFAULT_SETTINGS;
  
  const s: FormSettings = {
    ...dbSettings,
    primaryColor: urlPrimary || dbSettings.primaryColor,
    bgColor: urlBg || dbSettings.bgColor,
    textColor: urlText || dbSettings.textColor,
    borderRadius: urlRadius || dbSettings.borderRadius,
    fontFamily: urlFont || dbSettings.fontFamily,
  };

  // Multi-step: 2 fields per step
  const FIELDS_PER_STEP = 2;
  const steps = s.layout === 'multi-step'
    ? Array.from({ length: Math.ceil(fields.length / FIELDS_PER_STEP) }, (_, i) =>
        fields.slice(i * FIELDS_PER_STEP, (i + 1) * FIELDS_PER_STEP)
      )
    : [fields];

  const totalSteps = steps.length;
  const currentFields = steps[currentStep] || [];

  const containerStyle: React.CSSProperties = {
    ...(s.bgColor && { backgroundColor: s.bgColor }),
    ...(s.textColor && { color: s.textColor }),
    ...(s.fontFamily && { fontFamily: s.fontFamily }),
  };

  const cardStyle: React.CSSProperties = {
    ...(s.bgColor && { backgroundColor: s.bgColor }),
    ...(s.borderRadius && { borderRadius: `${s.borderRadius}px` }),
    ...(s.padding && { padding: `${s.padding}px` }),
    ...(!s.showBorder && { border: 'none' }),
    ...(s.shadow === 'none' && { boxShadow: 'none' }),
    ...(s.shadow === 'sm' && { boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }),
    ...(s.shadow === 'lg' && { boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }),
  };

  const inputStyle: React.CSSProperties = {
    ...(s.borderRadius && { borderRadius: `${s.borderRadius}px` }),
    ...(s.textColor && { color: s.textColor }),
  };

  const buttonStyle: React.CSSProperties = {
    ...(s.primaryColor && { backgroundColor: s.primaryColor, borderColor: s.primaryColor }),
    ...(s.borderRadius && { borderRadius: `${s.borderRadius}px` }),
  };

  const labelStyle: React.CSSProperties = {
    ...(s.textColor && { color: s.textColor }),
    ...(s.labelPosition === 'hidden' && { display: 'none' }),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId) return;

    // Validate only current step in multi-step, all fields otherwise
    const fieldsToValidate = s.layout === 'multi-step' ? currentFields : fields;
    for (const field of fieldsToValidate) {
      if (field.required && !formData[field.name]?.trim()) {
        toast.error(`O campo "${field.label}" é obrigatório.`);
        return;
      }
    }

    // Multi-step: go next if not last step
    if (s.layout === 'multi-step' && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Validate all fields before final submit in multi-step
    if (s.layout === 'multi-step') {
      for (const field of fields) {
        if (field.required && !formData[field.name]?.trim()) {
          toast.error(`O campo "${field.label}" é obrigatório.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const { error, data: submission } = await supabase
        .from('form_submissions')
        .insert({ form_id: formId, data: formData })
        .select()
        .single();
      if (error) throw error;

      try {
        window.parent.postMessage({ type: 'agsell-form-height', formId, height: document.body.scrollHeight }, '*');
      } catch {}

      try {
        const orgId = form?.organization_id;
        if (orgId) {
          const { data: automations } = await supabase
            .from('automations')
            .select('id')
            .eq('organization_id', orgId)
            .eq('trigger_type', 'form_submitted')
            .eq('is_active', true);
          if (automations?.length) {
            await Promise.allSettled(
              automations.map((a) =>
                supabase.functions.invoke('process-automation', {
                  body: { automation_id: a.id, contact_id: submission?.contact_id ?? null, trigger_event: 'form_submitted' },
                })
              )
            );
          }
        }
      } catch {}

      setSubmitted(true);
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto resize
  React.useEffect(() => {
    const sendHeight = () => {
      try {
        window.parent.postMessage({ type: 'agsell-form-height', formId, height: document.body.scrollHeight }, '*');
      } catch {}
    };
    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [formId]);

  // Inject custom CSS
  React.useEffect(() => {
    if (!s.customCss) return;
    const style = document.createElement('style');
    style.textContent = s.customCss;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, [s.customCss]);

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const onChangeFn = (val: string) => setFormData(prev => ({ ...prev, [field.name]: val }));

    const fieldContent = (() => {
      switch (field.type) {
        case 'textarea':
          return <Textarea className="agsell-input" placeholder={field.placeholder || ''} value={value} onChange={(e) => onChangeFn(e.target.value)} style={inputStyle} />;
        case 'select':
          return (
            <Select value={value} onValueChange={onChangeFn}>
              <SelectTrigger className="agsell-input" style={inputStyle}><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {(field.options || []).map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case 'checkbox':
          return (
            <div className="flex items-center gap-2">
              <Checkbox checked={value === 'true'} onCheckedChange={(c) => onChangeFn(c ? 'true' : 'false')} />
              <span className="text-sm text-muted-foreground">{field.placeholder || field.label}</span>
            </div>
          );
        default:
          return <Input className="agsell-input" type={field.type || 'text'} placeholder={field.placeholder || (s.labelPosition === 'hidden' ? field.label : '')} value={value} onChange={(e) => onChangeFn(e.target.value)} style={inputStyle} />;
      }
    })();

    const showLabel = s.labelPosition !== 'hidden' && field.type !== 'checkbox';

    if (s.labelPosition === 'left' && showLabel) {
      return (
        <div className="agsell-field flex items-center gap-3">
          <Label className="agsell-label w-1/3 text-right text-sm shrink-0" style={labelStyle}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex-1">{fieldContent}</div>
        </div>
      );
    }

    return (
      <div className="agsell-field" style={{ gap: `${parseInt(s.fieldGap) / 4}px` }}>
        {showLabel && (
          <Label className="agsell-label" style={labelStyle}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        {fieldContent}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={containerStyle}>
        <Card className="w-full max-w-lg" style={cardStyle}>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={containerStyle}>
        <Card className="w-full max-w-lg" style={cardStyle}>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Formulário não encontrado ou desativado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={containerStyle}>
        <Card className="w-full max-w-lg" style={cardStyle}>
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto" style={{ color: s.primaryColor || '#22c55e' }} />
            <h2 className="text-2xl font-bold" style={s.textColor ? { color: s.textColor } : undefined}>
              {s.successMessage || 'Enviado com sucesso!'}
            </h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Inline layout
  if (s.layout === 'inline') {
    return (
      <div className="agsell-form flex items-center justify-center p-2" style={containerStyle}>
        <form onSubmit={handleSubmit} className="flex items-end gap-2 flex-wrap" style={cardStyle}>
          {fields.map((field) => (
            <div key={field.name} className="agsell-field">
              {s.labelPosition !== 'hidden' && (
                <Label className="agsell-label text-xs mb-1 block" style={labelStyle}>{field.label}</Label>
              )}
              <Input
                className="agsell-input h-9 w-auto min-w-[160px]"
                type={field.type || 'text'}
                placeholder={field.placeholder || field.label}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}
          <Button type="submit" className="agsell-button h-9" disabled={submitting} style={buttonStyle}>
            {submitting ? 'Enviando...' : s.buttonText}
          </Button>
        </form>
      </div>
    );
  }

  // Determine field layout classes
  const fieldGridClass = s.layout === 'two-columns'
    ? 'grid grid-cols-1 md:grid-cols-2'
    : 'flex flex-col';

  const displayFields = s.layout === 'multi-step' ? currentFields : fields;

  return (
    <div className="agsell-form min-h-screen flex items-center justify-center p-4" style={containerStyle}>
      <Card className="w-full max-w-lg" style={cardStyle}>
        <CardHeader>
          <CardTitle style={s.textColor ? { color: s.textColor } : undefined}>{form.name}</CardTitle>
          {form.description && <CardDescription>{form.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {s.layout === 'multi-step' && totalSteps > 1 && (
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Etapa {currentStep + 1} de {totalSteps}</span>
                <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
              </div>
              <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-2" />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={fieldGridClass} style={{ gap: `${s.fieldGap}px` }}>
              {displayFields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  {renderField(field)}
                </div>
              ))}
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Este formulário não possui campos configurados.</p>
            )}

            <div className={`flex gap-2 mt-6 ${s.layout === 'multi-step' && currentStep > 0 ? 'justify-between' : 'justify-end'}`}>
              {s.layout === 'multi-step' && currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  style={inputStyle}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />Voltar
                </Button>
              )}
              <Button
                type="submit"
                className={`agsell-button ${s.layout !== 'multi-step' ? 'w-full' : 'flex-1'}`}
                disabled={submitting || fields.length === 0}
                style={buttonStyle}
              >
                {submitting
                  ? 'Enviando...'
                  : s.layout === 'multi-step' && currentStep < totalSteps - 1
                    ? <>Próximo<ChevronRight className="h-4 w-4 ml-1" /></>
                    : s.buttonText
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
