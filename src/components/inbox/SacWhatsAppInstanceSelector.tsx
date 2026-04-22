import { Smartphone } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WhatsAppInstance } from '@/hooks/useWhatsAppInstances';

interface SacWhatsAppInstanceSelectorProps {
  instances: WhatsAppInstance[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const getInstanceLabel = (instance: WhatsAppInstance) => {
  return instance.phone_number || instance.name || instance.instance_name || 'Instância sem nome';
};

export function SacWhatsAppInstanceSelector({
  instances,
  value,
  onChange,
  disabled,
  className,
}: SacWhatsAppInstanceSelectorProps) {
  return (
    <div className={className}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9 min-w-[220px] bg-muted/40">
          <SelectValue placeholder="Selecionar instância" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Automática (mesma instância da conversa)</SelectItem>
          {instances.map((instance) => (
            <SelectItem key={instance.id} value={instance.id}>
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{getInstanceLabel(instance)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
