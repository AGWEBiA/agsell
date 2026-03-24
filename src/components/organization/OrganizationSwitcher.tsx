import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function OrganizationSwitcher() {
  const { currentOrganization, organizations, setCurrentOrganization } = useOrganization();

  if (organizations.length <= 1) return null;

  const handleSwitch = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) setCurrentOrganization(org);
  };

  return (
    <Select value={currentOrganization?.id || ''} onValueChange={handleSwitch}>
      <SelectTrigger className="w-40 h-8 text-xs">
        <Building2 className="h-3.5 w-3.5 mr-1 shrink-0" />
        <SelectValue placeholder="Organização" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            <span className="truncate">{org.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
