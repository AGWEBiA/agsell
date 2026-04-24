import React from 'react';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import type { FormSettings } from './FormTemplates';
import { DEFAULT_SETTINGS } from './FormTemplates';

interface Props {
  current: FormSettings;
  onApply: (settings: FormSettings) => void;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  /** Visual preview swatches (gradient/colors) */
  swatch: React.CSSProperties;
  /** Partial settings that will be merged on top of current settings */
  settings: Partial<FormSettings>;
}

/**
 * Curated visual presets that users can apply with 1 click.
 * Each preset only overrides the visual layer (colors / shadow / radius / borders / typography),
 * never the structural layer (layout / fields / labels position).
 */
export const STYLE_PRESETS: Preset[] = [
  {
    id: 'card-modern',
    name: 'Card Moderno',
    description: 'Cartão branco com sombra suave. Ideal para a maioria dos sites.',
    swatch: { background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0' },
    settings: {
      bgColor: '#ffffff',
      bgOpacity: 100,
      textColor: '#0f172a',
      primaryColor: '#6366f1',
      borderRadius: '12',
      padding: '32',
      fieldGap: '16',
      showBorder: true,
      shadow: 'md',
      fontFamily: '',
      customCss: '',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Sem bordas e sem sombra. Foco no conteúdo, fica leve em qualquer página.',
    swatch: { background: '#ffffff' },
    settings: {
      bgColor: '#ffffff',
      bgOpacity: 100,
      textColor: '#1f2937',
      primaryColor: '#111827',
      borderRadius: '6',
      padding: '20',
      fieldGap: '14',
      showBorder: false,
      shadow: 'none',
      fontFamily: '',
      customCss: '',
    },
  },
  {
    id: 'embed-transparent',
    name: 'Transparente (Embed)',
    description: 'Fundo transparente, herda fonte e cores da página onde for embedado.',
    swatch: {
      backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%)',
      backgroundSize: '8px 8px',
    },
    settings: {
      bgColor: '',
      bgOpacity: 0,
      textColor: 'inherit',
      primaryColor: '#6366f1',
      borderRadius: '8',
      padding: '0',
      fieldGap: '14',
      showBorder: false,
      shadow: 'none',
      fontFamily: 'inherit',
      customCss: `.agsell-form { color: inherit; font-family: inherit; }
.agsell-label { color: inherit; opacity: 0.85; }
.agsell-input { background: rgba(255,255,255,0.05); }`,
    },
  },
  {
    id: 'dark-elegant',
    name: 'Dark Elegante',
    description: 'Fundo escuro, alto contraste. Perfeito para sites com tema escuro.',
    swatch: { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
    settings: {
      bgColor: '#0f172a',
      bgOpacity: 100,
      textColor: '#f1f5f9',
      primaryColor: '#3b82f6',
      borderRadius: '10',
      padding: '32',
      fieldGap: '16',
      showBorder: false,
      shadow: 'lg',
      fontFamily: '',
      customCss: `.agsell-input { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); color: #f1f5f9; }
.agsell-input::placeholder { color: rgba(241,245,249,0.5); }`,
    },
  },
  {
    id: 'gradient-vibrant',
    name: 'Gradiente Vibrante',
    description: 'Fundo gradiente colorido. Chama atenção em landing pages e captura.',
    swatch: { background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' },
    settings: {
      bgColor: '#ffffff',
      bgOpacity: 100,
      textColor: '#0f172a',
      primaryColor: '#ec4899',
      borderRadius: '16',
      padding: '36',
      fieldGap: '18',
      showBorder: false,
      shadow: 'lg',
      fontFamily: '',
      customCss: `.agsell-form { background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%) !important; padding: 40px; border-radius: 20px; }
.agsell-button { background: linear-gradient(135deg, #ec4899, #f97316) !important; border: none; box-shadow: 0 8px 20px rgba(236,72,153,0.35); }`,
    },
  },
  {
    id: 'glass',
    name: 'Glassmorphism',
    description: 'Vidro fosco com blur. Funciona melhor sobre imagens ou backgrounds coloridos.',
    swatch: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2))',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.5)',
    },
    settings: {
      bgColor: '#ffffff',
      bgOpacity: 30,
      textColor: '#0f172a',
      primaryColor: '#6366f1',
      borderRadius: '20',
      padding: '32',
      fieldGap: '16',
      showBorder: true,
      shadow: 'lg',
      fontFamily: '',
      customCss: `.agsell-form { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.4); }
.agsell-input { background: rgba(255,255,255,0.5); border-color: rgba(255,255,255,0.6); }`,
    },
  },
  {
    id: 'inline-bar',
    name: 'Barra Inline',
    description: 'Layout horizontal compacto. Ideal para newsletter no header/footer.',
    swatch: { background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%)' },
    settings: {
      layout: 'inline',
      bgColor: '',
      bgOpacity: 0,
      textColor: 'inherit',
      primaryColor: '#6366f1',
      borderRadius: '999',
      padding: '8',
      fieldGap: '8',
      showBorder: false,
      shadow: 'none',
      labelPosition: 'hidden',
      fontFamily: 'inherit',
      customCss: `.agsell-input { border-radius: 999px; height: 44px; padding: 0 16px; }
.agsell-button { border-radius: 999px; height: 44px; padding: 0 24px; }`,
    },
  },
];

export function FormStylePresets({ current, onApply }: Props) {
  const apply = (preset: Preset) => {
    onApply({ ...DEFAULT_SETTINGS, ...current, ...preset.settings });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <Label className="text-xs font-semibold">Presets visuais — aplicação em 1 clique</Label>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Cada preset ajusta apenas a aparência (cores, sombras, fonte, fundo). Layout e campos são preservados.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {STYLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => apply(preset)}
            className="group flex items-stretch gap-2 rounded-lg border border-border p-2 text-left transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <div
              className="h-12 w-12 shrink-0 rounded-md border border-border/50"
              style={preset.swatch}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold group-hover:text-primary">{preset.name}</p>
              <p className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                {preset.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
