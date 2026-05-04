import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Palette, Layout, Type, Code, Settings2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FormSettings } from './FormTemplates';
import { FormStylePresets } from './FormStylePresets';

interface Props {
  settings: FormSettings;
  onChange: (settings: FormSettings) => void;
}

export function FormStyleEditor({ settings, onChange }: Props) {
  const update = (key: keyof FormSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const inheritFromParent = () => {
    onChange({
      ...settings,
      bgColor: '',
      bgOpacity: 0,
      textColor: 'inherit',
      fontFamily: 'inherit',
      showBorder: false,
      shadow: 'none',
      padding: '0',
      customCss: `.agsell-form { color: inherit; font-family: inherit; background: transparent !important; border: none !important; box-shadow: none !important; }
.agsell-label { color: inherit; opacity: 0.85; }
.agsell-input { background: rgba(0,0,0,0.03) !important; border-color: rgba(0,0,0,0.1) !important; color: inherit !important; }`,
    });
  };

  return (
    <Tabs defaultValue="presets" className="w-full">
      <TabsList className="w-full grid grid-cols-6 h-9">
        <TabsTrigger value="presets" className="text-xs gap-1"><Sparkles className="h-3 w-3" />Presets</TabsTrigger>
        <TabsTrigger value="layout" className="text-xs gap-1"><Layout className="h-3 w-3" />Layout</TabsTrigger>
        <TabsTrigger value="colors" className="text-xs gap-1"><Palette className="h-3 w-3" />Cores</TabsTrigger>
        <TabsTrigger value="typography" className="text-xs gap-1"><Type className="h-3 w-3" />Texto</TabsTrigger>
        <TabsTrigger value="spacing" className="text-xs gap-1"><Settings2 className="h-3 w-3" />Espaço</TabsTrigger>
        <TabsTrigger value="css" className="text-xs gap-1"><Code className="h-3 w-3" />CSS</TabsTrigger>
      </TabsList>

      <TabsContent value="presets" className="mt-3">
        <FormStylePresets current={settings} onApply={onChange} />
      </TabsContent>

      <TabsContent value="layout" className="space-y-4 mt-3">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Tipo de Layout</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'single', label: 'Coluna Única', desc: 'Campos empilhados' },
              { value: 'two-columns', label: 'Duas Colunas', desc: 'Grid lado a lado' },
              { value: 'multi-step', label: 'Multi-step', desc: 'Wizard com etapas' },
              { value: 'inline', label: 'Inline', desc: 'Horizontal' },
            ].map((layout) => (
              <button
                key={layout.value}
                type="button"
                onClick={() => update('layout', layout.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  settings.layout === layout.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <p className="text-xs font-medium">{layout.label}</p>
                <p className="text-[10px] text-muted-foreground">{layout.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Posição do Label</Label>
          <Select value={settings.labelPosition} onValueChange={(v) => update('labelPosition', v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Acima do campo</SelectItem>
              <SelectItem value="left">Ao lado do campo</SelectItem>
              <SelectItem value="hidden">Oculto (só placeholder)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Exibir título do formulário</Label>
          <Switch checked={settings.showTitle ?? true} onCheckedChange={(c) => update('showTitle', c)} />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Exibir descrição do formulário</Label>
          <Switch checked={settings.showDescription ?? true} onCheckedChange={(c) => update('showDescription', c)} />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Mostrar borda</Label>
          <Switch checked={settings.showBorder} onCheckedChange={(c) => update('showBorder', c)} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Sombra</Label>
          <Select value={settings.shadow} onValueChange={(v) => update('shadow', v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              <SelectItem value="sm">Leve</SelectItem>
              <SelectItem value="md">Média</SelectItem>
              <SelectItem value="lg">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="colors" className="space-y-4 mt-3">
        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold">Herdar estilo da página pai</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Torna o formulário transparente e usa fonte/cor da página onde for embedado. Ideal para integrar com qualquer site sem ajustes.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={inheritFromParent}>
              Aplicar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Cor primária</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.primaryColor || '#6366f1'}
                onChange={(e) => update('primaryColor', e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border-0"
              />
              <Input
                className="h-8 text-xs flex-1"
                value={settings.primaryColor}
                onChange={(e) => update('primaryColor', e.target.value)}
                placeholder="#6366f1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fundo</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.bgColor || '#ffffff'}
                onChange={(e) => update('bgColor', e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border-0"
              />
              <Input
                className="h-8 text-xs flex-1"
                value={settings.bgColor}
                onChange={(e) => update('bgColor', e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Texto</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.textColor || '#1a1a1a'}
                onChange={(e) => update('textColor', e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border-0"
              />
              <Input
                className="h-8 text-xs flex-1"
                value={settings.textColor}
                onChange={(e) => update('textColor', e.target.value)}
                placeholder="#1a1a1a"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Transparência do fundo: {settings.bgOpacity ?? 100}%</Label>
          <Slider
            value={[settings.bgOpacity ?? 100]}
            onValueChange={([v]) => update('bgOpacity', v)}
            min={0}
            max={100}
            step={5}
          />
          <p className="text-[10px] text-muted-foreground">0% = totalmente transparente · 100% = opaco. Ideal para integrar o formulário em páginas existentes.</p>
        </div>
      </TabsContent>

      <TabsContent value="typography" className="space-y-4 mt-3">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Família de fonte</Label>
          <Select value={settings.fontFamily || 'default'} onValueChange={(v) => update('fontFamily', v === 'default' ? '' : v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Padrão do site</SelectItem>
              <SelectItem value="Inter, sans-serif">Inter</SelectItem>
              <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
              <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
              <SelectItem value="Lato, sans-serif">Lato</SelectItem>
              <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
              <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
              <SelectItem value="Georgia, serif">Georgia (Serif)</SelectItem>
              <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Texto do botão</Label>
          <Input className="h-8 text-sm" value={settings.buttonText} onChange={(e) => update('buttonText', e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Mensagem de sucesso</Label>
          <Input className="h-8 text-sm" value={settings.successMessage} onChange={(e) => update('successMessage', e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">URL de redirecionamento (opcional)</Label>
          <Input className="h-8 text-sm" placeholder="https://seusite.com/obrigado" value={settings.redirectUrl || ''} onChange={(e) => update('redirectUrl', e.target.value)} />
          <p className="text-xs text-muted-foreground">Se preenchido, o lead será redirecionado após enviar o formulário.</p>
        </div>
      </TabsContent>

      <TabsContent value="spacing" className="space-y-4 mt-3">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Arredondamento das bordas: {settings.borderRadius}px</Label>
          <Slider
            value={[parseInt(settings.borderRadius) || 0]}
            onValueChange={([v]) => update('borderRadius', String(v))}
            min={0}
            max={24}
            step={2}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Padding interno: {settings.padding}px</Label>
          <Slider
            value={[parseInt(settings.padding) || 24]}
            onValueChange={([v]) => update('padding', String(v))}
            min={0}
            max={48}
            step={4}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Espaço entre campos: {settings.fieldGap}px</Label>
          <Slider
            value={[parseInt(settings.fieldGap) || 16]}
            onValueChange={([v]) => update('fieldGap', String(v))}
            min={4}
            max={32}
            step={4}
          />
        </div>
      </TabsContent>

      <TabsContent value="css" className="space-y-3 mt-3">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">CSS Personalizado</Label>
          <p className="text-[10px] text-muted-foreground">
            Use seletores como <code>.agsell-form</code>, <code>.agsell-field</code>, <code>.agsell-label</code>, <code>.agsell-input</code>, <code>.agsell-button</code>
          </p>
          <Textarea
            className="font-mono text-xs min-h-[120px]"
            value={settings.customCss}
            onChange={(e) => update('customCss', e.target.value)}
            placeholder={`.agsell-form {\n  /* seus estilos aqui */\n}\n\n.agsell-button {\n  /* estilo do botão */\n}`}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
