import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Monitor, Tablet, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormField } from './FormFieldEditor';
import type { FormSettings } from './FormTemplates';
import { DEFAULT_SETTINGS } from './FormTemplates';

interface Props {
  fields: FormField[];
  settings: FormSettings;
  formName?: string;
  formDescription?: string;
}

type DeviceSize = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export function FormPreview({ fields, settings, formName = 'Pré-visualização', formDescription }: Props) {
  const [device, setDevice] = useState<DeviceSize>('desktop');
  const [currentStep, setCurrentStep] = useState(0);

  const s: FormSettings = { ...DEFAULT_SETTINGS, ...settings };

  // Compute opacity-aware background
  const opacity = s.bgOpacity ?? 100;
  const bgWithOpacity = (() => {
    if (!s.bgColor) return opacity < 100 ? `rgba(255,255,255,${opacity / 100})` : undefined;
    // Convert hex to rgba
    const hex = s.bgColor.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r},${g},${b},${opacity / 100})`;
    }
    return s.bgColor;
  })();

  const FIELDS_PER_STEP = 2;
  const steps = s.layout === 'multi-step'
    ? Array.from({ length: Math.ceil(fields.length / FIELDS_PER_STEP) }, (_, i) =>
        fields.slice(i * FIELDS_PER_STEP, (i + 1) * FIELDS_PER_STEP)
      )
    : [fields];
  const totalSteps = steps.length;
  const currentFields = steps[currentStep] || [];

  const containerStyle: React.CSSProperties = {
    backgroundColor: bgWithOpacity,
    ...(s.textColor && { color: s.textColor }),
    ...(s.fontFamily && { fontFamily: s.fontFamily }),
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: bgWithOpacity,
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

  const renderField = (field: FormField) => {
    const fieldContent = (() => {
      switch (field.type) {
        case 'textarea':
          return <Textarea className="pointer-events-none" placeholder={field.placeholder || ''} style={inputStyle} readOnly />;
        case 'select':
          return (
            <Select disabled>
              <SelectTrigger style={inputStyle}><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {(field.options || []).map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case 'radio':
          return (
            <RadioGroup className="flex flex-col gap-3 pointer-events-none">
              {(field.options || []).map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`preview-${field.name}-${opt}`} />
                  <Label htmlFor={`preview-${field.name}-${opt}`} className="text-sm font-normal">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          );
        case 'checkbox':
          if (field.options && field.options.length > 0) {
            return (
              <div className="flex flex-col gap-3 pointer-events-none">
                {field.options.map(opt => (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox />
                    <Label className="text-sm font-normal">{opt}</Label>
                  </div>
                ))}
              </div>
            );
          }
          return (
            <div className="flex items-center gap-2 pointer-events-none">
              <Checkbox />
              <span className="text-sm">{field.placeholder || field.label}</span>
            </div>
          );
        default:
          return <Input className="pointer-events-none" type={field.type || 'text'} placeholder={field.placeholder || (s.labelPosition === 'hidden' ? field.label : '')} style={inputStyle} readOnly />;
      }
    })();

    const showLabel = s.labelPosition !== 'hidden' && field.type !== 'checkbox';

    if (s.labelPosition === 'left' && showLabel) {
      return (
        <div className="flex items-center gap-3">
          <Label className="w-1/3 text-right text-sm shrink-0" style={labelStyle}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex-1">{fieldContent}</div>
        </div>
      );
    }

    return (
      <div style={{ gap: `${parseInt(s.fieldGap) / 4}px` }}>
        {showLabel && (
          <Label className="mb-1.5 block" style={labelStyle}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        {fieldContent}
      </div>
    );
  };

  const displayFields = s.layout === 'multi-step' ? currentFields : fields;
  const fieldGridClass = s.layout === 'two-columns' ? 'grid grid-cols-1 md:grid-cols-2' : 'flex flex-col';

  // Inline layout
  if (s.layout === 'inline') {
    return (
      <div className="space-y-3">
        <DeviceSwitcher device={device} onChange={setDevice} />
        <div
          className="border rounded-lg overflow-hidden mx-auto transition-all duration-300"
          style={{
            maxWidth: DEVICE_WIDTHS[device],
            backgroundImage: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%)',
            backgroundSize: '16px 16px',
          }}
        >
          <div className="p-4" style={containerStyle}>
            <div className="flex items-end gap-2 flex-wrap" style={cardStyle}>
              {fields.map((field) => (
                <div key={field.name}>
                  {s.labelPosition !== 'hidden' && (
                    <Label className="text-xs mb-1 block" style={labelStyle}>{field.label}</Label>
                  )}
                  <Input
                    className="h-9 w-auto min-w-[160px] pointer-events-none"
                    type={field.type || 'text'}
                    placeholder={field.placeholder || field.label}
                    style={inputStyle}
                    readOnly
                  />
                </div>
              ))}
              <Button className="h-9 pointer-events-none" style={buttonStyle}>
                {s.buttonText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DeviceSwitcher device={device} onChange={setDevice} />
      <div
        className="border rounded-lg overflow-hidden mx-auto transition-all duration-300"
        style={{
          maxWidth: DEVICE_WIDTHS[device],
          backgroundImage: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%)',
          backgroundSize: '16px 16px',
        }}
      >
        <div className="flex items-center justify-center p-4" style={containerStyle}>
          <Card className="w-full max-w-lg" style={cardStyle}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg" style={s.textColor ? { color: s.textColor } : undefined}>{formName}</CardTitle>
              {formDescription && <CardDescription className="text-xs">{formDescription}</CardDescription>}
            </CardHeader>
            <CardContent>
              {s.layout === 'multi-step' && totalSteps > 1 && (
                <div className="mb-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Etapa {currentStep + 1} de {totalSteps}</span>
                    <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
                  </div>
                  <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-1.5" />
                </div>
              )}

              <div className={fieldGridClass} style={{ gap: `${s.fieldGap}px` }}>
                {displayFields.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    {renderField(field)}
                  </div>
                ))}
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Adicione campos ao formulário.</p>
              )}

              <div className={`flex gap-2 mt-4 ${s.layout === 'multi-step' && currentStep > 0 ? 'justify-between' : 'justify-end'}`}>
                {s.layout === 'multi-step' && currentStep > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(currentStep - 1)} style={inputStyle}>
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />Voltar
                  </Button>
                )}
                <Button
                  className={cn(s.layout !== 'multi-step' ? 'w-full' : 'flex-1')}
                  size="sm"
                  style={buttonStyle}
                  onClick={() => {
                    if (s.layout === 'multi-step' && currentStep < totalSteps - 1) {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                >
                  {s.layout === 'multi-step' && currentStep < totalSteps - 1
                    ? <>Próximo<ChevronRight className="h-3.5 w-3.5 ml-1" /></>
                    : s.buttonText
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DeviceSwitcher({ device, onChange }: { device: DeviceSize; onChange: (d: DeviceSize) => void }) {
  const devices: { value: DeviceSize; icon: React.ReactNode; label: string }[] = [
    { value: 'desktop', icon: <Monitor className="h-4 w-4" />, label: 'Desktop' },
    { value: 'tablet', icon: <Tablet className="h-4 w-4" />, label: 'Tablet' },
    { value: 'mobile', icon: <Smartphone className="h-4 w-4" />, label: 'Mobile' },
  ];

  return (
    <div className="flex items-center justify-center gap-1 bg-muted/50 rounded-lg p-1 w-fit mx-auto">
      {devices.map((d) => (
        <button
          key={d.value}
          type="button"
          onClick={() => onChange(d.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            device === d.value
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title={d.label}
        >
          {d.icon}
          <span className="hidden sm:inline">{d.label}</span>
        </button>
      ))}
    </div>
  );
}
