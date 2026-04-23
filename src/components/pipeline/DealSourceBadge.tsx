import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Instagram, Send, Phone, Globe, FileText, Upload, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DealSourceBadgeProps {
  source?: string | null;
  channel?: string | null;
  className?: string;
}

const SOURCE_MAP: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  whatsapp_inbound: { label: 'WhatsApp', icon: MessageSquare, tone: 'bg-green-500/10 text-green-600 border-green-500/30' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, tone: 'bg-green-500/10 text-green-600 border-green-500/30' },
  sac: { label: 'SAC', icon: MessageSquare, tone: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  instagram: { label: 'Instagram', icon: Instagram, tone: 'bg-pink-500/10 text-pink-600 border-pink-500/30' },
  instagram_dm: { label: 'Instagram', icon: Instagram, tone: 'bg-pink-500/10 text-pink-600 border-pink-500/30' },
  email: { label: 'E-mail', icon: Mail, tone: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  email_inbound: { label: 'E-mail', icon: Mail, tone: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  telegram: { label: 'Telegram', icon: Send, tone: 'bg-sky-500/10 text-sky-600 border-sky-500/30' },
  formulario: { label: 'Formulário', icon: FileText, tone: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  form: { label: 'Formulário', icon: FileText, tone: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  voip: { label: 'Ligação', icon: Phone, tone: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  call: { label: 'Ligação', icon: Phone, tone: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  website: { label: 'Site', icon: Globe, tone: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' },
  import: { label: 'Importação', icon: Upload, tone: 'bg-muted text-muted-foreground border-border' },
  manual: { label: 'Manual', icon: UserPlus, tone: 'bg-muted text-muted-foreground border-border' },
};

export function DealSourceBadge({ source, channel, className }: DealSourceBadgeProps) {
  const key = (source || channel || '').toLowerCase().trim();
  if (!key) return null;
  const meta = SOURCE_MAP[key] || {
    label: key.replace(/_/g, ' '),
    icon: Globe,
    tone: 'bg-muted text-muted-foreground border-border',
  };
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn('gap-1 text-[10px] font-normal capitalize border', meta.tone, className)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}
