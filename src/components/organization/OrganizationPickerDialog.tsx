import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Building2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrganizationPickerDialogProps {
  open: boolean;
  onClose: () => void;
}

export function OrganizationPickerDialog({ open, onClose }: OrganizationPickerDialogProps) {
  const { organizations, currentOrganization, setCurrentOrganization } = useOrganization();

  const handleSelect = (org: typeof organizations[0]) => {
    setCurrentOrganization(org);
    localStorage.setItem('orgPickerDismissed', 'true');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { localStorage.setItem('orgPickerDismissed', 'true'); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Selecionar Organização
          </DialogTitle>
          <DialogDescription>
            Você possui acesso a múltiplas organizações. Selecione qual deseja acessar agora.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 mt-4">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelect(org)}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-accent text-left w-full',
                currentOrganization?.id === org.id ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{org.slug}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
