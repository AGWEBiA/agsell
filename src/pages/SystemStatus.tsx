import { useSystemStatus, SystemIncident } from '@/hooks/useSystemStatus';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, XCircle, Wrench, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoRed from '@/assets/logo-red.png';
import { Link } from 'react-router-dom';

const statusConfig = {
  operational: { label: 'Operacional', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200 dark:border-green-800', badgeBg: 'bg-green-100 text-green-800' },
  minor: { label: 'Problema Menor', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950', border: 'border-yellow-200 dark:border-yellow-800', badgeBg: 'bg-yellow-100 text-yellow-800' },
  major: { label: 'Problema Grave', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-800', badgeBg: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Indisponível', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800', badgeBg: 'bg-red-100 text-red-800' },
  maintenance: { label: 'Manutenção', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800', badgeBg: 'bg-blue-100 text-blue-800' },
};

const incidentStatusLabels: Record<string, string> = {
  investigating: 'Investigando',
  identified: 'Identificado',
  monitoring: 'Monitorando',
  resolved: 'Resolvido',
};

function OverallBanner({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.operational;
  const Icon = config.icon;
  return (
    <div className={`rounded-xl p-6 ${config.bg} ${config.border} border-2 text-center`}>
      <div className="flex items-center justify-center gap-3">
        <Icon className={`h-8 w-8 ${config.color}`} />
        <h2 className={`text-2xl font-bold ${config.color}`}>
          {status === 'operational' ? 'Todos os sistemas operacionais' : `Instabilidade detectada — ${config.label}`}
        </h2>
      </div>
      <p className="text-muted-foreground mt-2 text-sm">
        Última verificação: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </p>
    </div>
  );
}

function ServiceRow({ name, status }: { name: string; status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.operational;
  const Icon = config.icon;
  return (
    <div className="flex items-center justify-between py-3">
      <span className="font-medium text-foreground">{name}</span>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>
    </div>
  );
}

function IncidentCard({ incident }: { incident: SystemIncident }) {
  const config = statusConfig[incident.severity as keyof typeof statusConfig] || statusConfig.minor;
  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{incident.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <Clock className="inline h-3.5 w-3.5 mr-1" />
              {format(new Date(incident.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {incident.resolved_at && (
                <> — Resolvido em {format(new Date(incident.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Badge className={config.badgeBg}>{config.label}</Badge>
            <Badge variant="outline">{incidentStatusLabels[incident.status] || incident.status}</Badge>
          </div>
        </div>
      </CardHeader>
      {(incident.description || (incident.updates && incident.updates.length > 0)) && (
        <CardContent className="pt-0">
          {incident.description && <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>}
          {incident.affected_services.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {incident.affected_services.map(s => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          )}
          {incident.updates && incident.updates.length > 0 && (
            <div className="border-l-2 border-muted pl-4 space-y-3 mt-3">
              {incident.updates.map(update => (
                <div key={update.id}>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] py-0">{incidentStatusLabels[update.status] || update.status}</Badge>
                    {format(new Date(update.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </div>
                  <p className="text-sm mt-1">{update.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function SystemStatus() {
  const { overallStatus, services, getServiceStatus, recentIncidents, isLoading } = useSystemStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group incidents by date
  const incidentsByDate: Record<string, SystemIncident[]> = {};
  recentIncidents.forEach(inc => {
    const dateKey = format(new Date(inc.started_at), 'yyyy-MM-dd');
    if (!incidentsByDate[dateKey]) incidentsByDate[dateKey] = [];
    incidentsByDate[dateKey].push(inc);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoRed} alt="AG Sell" className="h-8" />
            <span className="font-semibold text-foreground">Status</span>
          </Link>
          <Link to="/login" className="text-sm text-primary hover:underline">Acessar plataforma</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <OverallBanner status={overallStatus} />

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Serviços</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {services.map(service => (
                <ServiceRow key={service.key} name={service.name} status={getServiceStatus(service.key)} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incident History */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Histórico de Incidentes — Últimos 30 dias</h3>
          {Object.keys(incidentsByDate).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Nenhum incidente registrado nos últimos 30 dias</p>
                <p className="text-sm mt-1">Todos os sistemas funcionaram normalmente.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(incidentsByDate).map(([dateKey, incidents]) => (
                <div key={dateKey}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    {format(new Date(dateKey), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </h4>
                  <div className="space-y-3">
                    {incidents.map(inc => <IncidentCard key={inc.id} incident={inc} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />
        <p className="text-center text-xs text-muted-foreground pb-8">
          © {new Date().getFullYear()} AG Sell. Todos os direitos reservados.
        </p>
      </main>
    </div>
  );
}
