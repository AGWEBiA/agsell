import { SupportPortalSettings } from '@/components/support-portal/SupportPortalSettings';

export default function SupportPortalSettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Portal de Suporte</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure o portal público de suporte para seus clientes.
        </p>
      </div>
      <SupportPortalSettings />
    </div>
  );
}
