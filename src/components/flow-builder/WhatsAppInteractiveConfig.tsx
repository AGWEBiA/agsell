import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Trash2,
  MousePointerClick,
  List as ListIcon,
  Type,
  Activity,
  Mic,
  MapPin,
  UserSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type WhatsAppMessageKind =
  | 'text'
  | 'media'
  | 'buttons'
  | 'list'
  | 'presence'
  | 'audio_ptt'
  | 'location'
  | 'contact';

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
  const setKind = (k: WhatsAppMessageKind) => {
    const next: Record<string, unknown> = { ...config, message_kind: k };
    if (k === 'media' && !config.media_type) next.media_type = 'image';
    onChange(next);
  };

  const buttons = (config.buttons as ButtonItem[]) || [];
  const setButtons = (b: ButtonItem[]) => onChange({ ...config, buttons: b });

  const sections = (config.list_sections as ListSection[]) || [{ title: 'Opções', rows: [] }];
  const setSections = (s: ListSection[]) => onChange({ ...config, list_sections: s });

  const kindOptions: { value: WhatsAppMessageKind; label: string; icon: React.ElementType; desc: string }[] = [
    { value: 'text', label: 'Texto', icon: Type, desc: 'Mensagem padrão de texto' },
    { value: 'media', label: 'Mídia', icon: ImageIcon, desc: 'Imagem, vídeo ou documento' },
    { value: 'audio_ptt', label: 'Áudio (PTT)', icon: Mic, desc: 'Mensagem de voz nativa' },
    { value: 'location', label: 'Localização', icon: MapPin, desc: 'Coordenadas geográficas' },
    { value: 'contact', label: 'Contato (vCard)', icon: UserSquare, desc: 'Cartão de contato' },
    { value: 'buttons', label: 'Botões', icon: MousePointerClick, desc: 'Até 3 botões clicáveis' },
    { value: 'list', label: 'Lista', icon: ListIcon, desc: 'Menu interativo (até 10)' },
    { value: 'presence', label: '"Digitando..."', icon: Activity, desc: 'Indicador antes da mensagem' },
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

      {/* ── MEDIA CONFIG (image / video / document) ── */}
      {kind === 'media' && (
        <div className="space-y-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
          <Label className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Mídia (imagem, vídeo ou documento)
          </Label>
          <p className="text-xs text-muted-foreground -mt-2">
            Envia o arquivo a partir de uma URL pública. A mensagem acima será usada como legenda.
          </p>

          <div className="space-y-1">
            <Label className="text-xs">Tipo de mídia</Label>
            <Select
              value={String(config.media_type || 'image')}
              onValueChange={v => onChange({ ...config, media_type: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="image">🖼️ Imagem (JPG/PNG)</SelectItem>
                <SelectItem value="video">🎥 Vídeo (MP4)</SelectItem>
                <SelectItem value="document">📄 Documento (PDF, DOCX, XLSX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">URL do arquivo</Label>
            <Input
              placeholder="https://..."
              value={String(config.media_url || '')}
              onChange={e => onChange({ ...config, media_url: e.target.value })}
            />
          </div>

          {config.media_type === 'document' && (
            <div className="space-y-1">
              <Label className="text-xs">Nome do arquivo (opcional)</Label>
              <Input
                placeholder="ex: contrato.pdf"
                value={String(config.media_filename || '')}
                onChange={e => onChange({ ...config, media_filename: e.target.value })}
              />
            </div>
          )}
        </div>
      )}

      {/* ── AUDIO PTT (voice note) ── */}
      {kind === 'audio_ptt' && (
        <div className="space-y-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10 p-4">
          <Label className="text-sm font-medium text-rose-700 dark:text-rose-400">
            Áudio nativo (PTT)
          </Label>
          <p className="text-xs text-muted-foreground -mt-2">
            Envia como mensagem de voz no formato nativo do WhatsApp (forma de onda + reprodução automática).
            Use arquivos OGG/Opus, MP3 ou M4A acessíveis via URL pública.
          </p>

          <div className="space-y-1">
            <Label className="text-xs">URL do áudio</Label>
            <Input
              placeholder="https://...audio.ogg"
              value={String(config.audio_url || config.media_url || '')}
              onChange={e => onChange({ ...config, audio_url: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* ── LOCATION ── */}
      {kind === 'location' && (
        <div className="space-y-3 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10 p-4">
          <Label className="text-sm font-medium text-teal-700 dark:text-teal-400">
            Localização
          </Label>
          <p className="text-xs text-muted-foreground -mt-2">
            Envia coordenadas geográficas que abrem direto no app de mapas do contato.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Latitude</Label>
              <Input
                type="number"
                step="0.000001"
                placeholder="-23.5505"
                value={String(config.latitude ?? '')}
                onChange={e => onChange({ ...config, latitude: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Longitude</Label>
              <Input
                type="number"
                step="0.000001"
                placeholder="-46.6333"
                value={String(config.longitude ?? '')}
                onChange={e => onChange({ ...config, longitude: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Nome do local (opcional)</Label>
            <Input
              placeholder="Ex: Nossa loja"
              value={String(config.location_name || '')}
              onChange={e => onChange({ ...config, location_name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Endereço (opcional)</Label>
            <Input
              placeholder="Av. Paulista, 1000"
              value={String(config.location_address || '')}
              onChange={e => onChange({ ...config, location_address: e.target.value })}
            />
          </div>

          <a
            href="https://www.google.com/maps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-teal-600 dark:text-teal-400 underline"
          >
            Abrir Google Maps para copiar coordenadas →
          </a>
        </div>
      )}

      {/* ── CONTACT (vCard) ── */}
      {kind === 'contact' && (
        <div className="space-y-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 p-4">
          <Label className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
            Cartão de contato (vCard)
          </Label>
          <p className="text-xs text-muted-foreground -mt-2">
            Envia um contato que o lead pode salvar com 1 toque. Útil para encaminhar para vendedor, suporte ou parceiro.
          </p>

          <div className="space-y-1">
            <Label className="text-xs">Nome completo</Label>
            <Input
              placeholder="João Silva"
              value={String(config.contact_full_name || '')}
              onChange={e => onChange({ ...config, contact_full_name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Telefone (com DDI/DDD)</Label>
            <Input
              placeholder="5511999999999"
              value={String(config.contact_phone || '')}
              onChange={e => onChange({ ...config, contact_phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Empresa (opcional)</Label>
              <Input
                placeholder="Acme Ltda"
                value={String(config.contact_organization || '')}
                onChange={e => onChange({ ...config, contact_organization: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-mail (opcional)</Label>
              <Input
                type="email"
                placeholder="contato@acme.com"
                value={String(config.contact_email || '')}
                onChange={e => onChange({ ...config, contact_email: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
