import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Server, Smartphone, Star } from 'lucide-react';
import { useWhatsAppInstances, WhatsAppInstance } from '@/hooks/useWhatsAppInstances';

interface WhatsAppInstanceSelectorProps {
  value?: string;
  onChange: (instanceId: string) => void;
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function WhatsAppInstanceSelector({
  value,
  onChange,
  label = 'Número/Provedor WhatsApp',
  showLabel = true,
  placeholder = 'Selecione o número de envio',
  disabled = false,
  className,
}: WhatsAppInstanceSelectorProps) {
  const { activeInstances, defaultInstance, isLoading } = useWhatsAppInstances();

  // Use default instance if no value is provided
  const selectedValue = value || defaultInstance?.id || '';

  if (isLoading) {
    return (
      <div className={className}>
        {showLabel && <Label className="text-muted-foreground">Carregando...</Label>}
      </div>
    );
  }

  if (activeInstances.length === 0) {
    return (
      <div className={className}>
        {showLabel && <Label>{label}</Label>}
        <div className="text-sm text-muted-foreground mt-1">
          Nenhuma instância WhatsApp configurada
        </div>
      </div>
    );
  }

  // If only one instance, just show it as text
  if (activeInstances.length === 1) {
    const instance = activeInstances[0];
    return (
      <div className={className}>
        {showLabel && <Label>{label}</Label>}
        <div className="flex items-center gap-2 mt-1 p-2 rounded-md bg-muted/50">
          {instance.integration_type === 'evolution_api' ? (
            <Server className="h-4 w-4 text-purple-600" />
          ) : (
            <Smartphone className="h-4 w-4 text-blue-600" />
          )}
          <span className="text-sm font-medium">{instance.name}</span>
          {instance.phone_number && (
            <span className="text-xs text-muted-foreground">({instance.phone_number})</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showLabel && <Label>{label}</Label>}
      <Select value={selectedValue} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {activeInstances.map((instance) => (
            <SelectItem key={instance.id} value={instance.id}>
              <div className="flex items-center gap-2">
                {instance.integration_type === 'evolution_api' ? (
                  <Server className="h-4 w-4 text-purple-600" />
                ) : (
                  <Smartphone className="h-4 w-4 text-blue-600" />
                )}
                <span>{instance.name}</span>
                {instance.phone_number && (
                  <span className="text-xs text-muted-foreground">
                    ({instance.phone_number})
                  </span>
                )}
                {instance.is_default && (
                  <Badge variant="outline" className="ml-1 text-xs">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    Padrão
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Compact version for inline use
export function WhatsAppInstanceBadge({ instanceId }: { instanceId?: string }) {
  const { instances } = useWhatsAppInstances();
  
  const instance = instanceId 
    ? instances.find(i => i.id === instanceId)
    : instances.find(i => i.is_default) || instances[0];

  if (!instance) return null;

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      {instance.integration_type === 'evolution_api' ? (
        <Server className="h-3 w-3 text-purple-600" />
      ) : (
        <Smartphone className="h-3 w-3 text-blue-600" />
      )}
      <span>{instance.name}</span>
      {instance.phone_number && (
        <span className="text-xs opacity-70">• {instance.phone_number}</span>
      )}
    </Badge>
  );
}
