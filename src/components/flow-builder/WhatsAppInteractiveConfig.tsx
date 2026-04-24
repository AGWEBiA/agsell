import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, MousePointerClick, List as ListIcon, Type, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WhatsAppMessageKind = 'text' | 'buttons' | 'list' | 'presence';

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

interface ButtonItem { text: string; id?: string }
interface ListRow { title: string; description?: string; rowId?: string }
interface ListSection { title: string; rows: ListRow[] }

/**
 * Renders the additional UI for the new "interactive" message kinds.
 * Mounts inside WhatsAppNodeConfig — the `text` kind keeps the original UX intact.
 */
export function WhatsAppInteractiveConfig({ config, onChange }: Props) {
  const kind: WhatsAppMessageKind = (config.message_kind as WhatsAppMessageKind) || 'text';
  const setKind = (k: WhatsAppMessageKind) => onChange({ ...config, message_kind: k });

  const buttons = (config.buttons as ButtonItem[]) || [];
  const setButtons = (b: ButtonItem[]) => onChange({ ...config, buttons: b });

  const sections = (config.list_sections as ListSection[]) || [{ title: 'Opções', rows: [] }];
  const setSections = (s: ListSection[]) => onChange({ ...config, list_sections: s });

  const kindOptions: { value: WhatsAppMessageKind; label: string; icon: React.ElementType; desc: string }[] = [
    { value: 'text', label: 'Texto', icon: Type, desc: 'Mensagem padrão (texto / mídia)' },
    { value: 'buttons', label: 'Botões', icon: MousePointerClick, desc: 'Até 3 botões clicáveis de resposta rápida' },
    { value: 'list', label: 'Lista', icon: ListIcon, desc: 'Menu interativo com até 10 opções' },
    { value: 'presence', label: '"Digitando..."', icon: Activity, desc: 'Mostra indicador antes da próxima mensagem' },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tipo de mensagem</Label>
        <div className="grid grid-cols-2 gap-2">
          {kindOptions.map(opt => {
            const Icon = opt.icon;
            const active = kind === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKind(opt.value)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                  active
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50',
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-sm font-medium">{opt.label}</span>
                </div>
                <span className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BUTTONS CONFIG ── */}
      {kind === 'buttons' && (
        <div className="space-y-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Botões de resposta rápida
            </Label>
            <span className="text-xs text-muted-foreground">{buttons.length}/3</span>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            O contato vê até 3 botões abaixo da mensagem. O texto do botão clicado volta como mensagem normal.
          </p>

          <div className="space-y-2">
            {buttons.map((btn, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder={`Botão ${idx + 1} (ex: Sim, quero saber mais)`}
                  value={btn.text}
                  maxLength={20}
                  onChange={e => {
                    const next = [...buttons];
                    next[idx] = { ...next[idx], text: e.target.value };
                    setButtons(next);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setButtons(buttons.filter((_, i) => i !== idx))}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {buttons.length < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setButtons([...buttons, { text: '' }])}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar botão
            </Button>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Rodapé (opcional)</Label>
            <Input
              placeholder="Ex: Resposta em até 2 minutos"
              value={String(config.buttons_footer || '')}
              maxLength={60}
              onChange={e => onChange({ ...config, buttons_footer: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* ── LIST CONFIG ── */}
      {kind === 'list' && (
        <div className="space-y-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4">
          <Label className="text-sm font-medium text-blue-700 dark:text-blue-400">
            Lista interativa (menu)
          </Label>
          <p className="text-xs text-muted-foreground -mt-2">
            O contato abre um menu com seções e até 10 opções. Ideal para escolha de produto, departamento, horário.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Título do menu</Label>
              <Input
                placeholder="Ex: Nossos serviços"
                value={String(config.list_title || '')}
                maxLength={24}
                onChange={e => onChange({ ...config, list_title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Texto do botão</Label>
              <Input
                placeholder="Ver opções"
                value={String(config.list_button_text || '')}
                maxLength={20}
                onChange={e => onChange({ ...config, list_button_text: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-2 rounded border border-border bg-background/60 p-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nome da seção"
                    value={section.title}
                    maxLength={24}
                    onChange={e => {
                      const next = [...sections];
                      next[sIdx] = { ...next[sIdx], title: e.target.value };
                      setSections(next);
                    }}
                  />
                  {sections.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSections(sections.filter((_, i) => i !== sIdx))}
                      className="text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {section.rows.map((row, rIdx) => (
                  <div key={rIdx} className="flex items-start gap-2 pl-3 border-l-2 border-blue-300 dark:border-blue-700">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Título da opção"
                        value={row.title}
                        maxLength={24}
                        onChange={e => {
                          const next = [...sections];
                          next[sIdx].rows[rIdx] = { ...row, title: e.target.value };
                          setSections(next);
                        }}
                      />
                      <Input
                        placeholder="Descrição (opcional)"
                        value={row.description || ''}
                        maxLength={72}
                        onChange={e => {
                          const next = [...sections];
                          next[sIdx].rows[rIdx] = { ...row, description: e.target.value };
                          setSections(next);
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const next = [...sections];
                        next[sIdx].rows = next[sIdx].rows.filter((_, i) => i !== rIdx);
                        setSections(next);
                      }}
                      className="text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const next = [...sections];
                    next[sIdx].rows = [...next[sIdx].rows, { title: '' }];
                    setSections(next);
                  }}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar opção
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSections([...sections, { title: 'Nova seção', rows: [] }])}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar seção
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Rodapé (opcional)</Label>
            <Input
              placeholder="Ex: Toque para escolher"
              value={String(config.list_footer || '')}
              maxLength={60}
              onChange={e => onChange({ ...config, list_footer: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* ── PRESENCE CONFIG ── */}
      {kind === 'presence' && (
        <div className="space-y-3 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 p-4">
          <Label className="text-sm font-medium text-violet-700 dark:text-violet-400">
            Indicador de presença
          </Label>
          <p className="text-xs text-muted-foreground -mt-2">
            Humaniza o bot mostrando "digitando..." ou "gravando áudio..." antes da próxima mensagem.
            Funciona apenas no canal não-oficial (Evolution API).
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Estado</Label>
              <Select
                value={String(config.presence_state || 'composing')}
                onValueChange={v => onChange({ ...config, presence_state: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="composing">⌨️ Digitando...</SelectItem>
                  <SelectItem value="recording">🎤 Gravando áudio...</SelectItem>
                  <SelectItem value="paused">⏸️ Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duração (ms)</Label>
              <Input
                type="number"
                min={500}
                max={20000}
                step={500}
                value={Number(config.presence_delay_ms || 2000)}
                onChange={e => onChange({ ...config, presence_delay_ms: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
