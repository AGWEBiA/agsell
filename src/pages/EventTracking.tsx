import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSiteEvents, useSiteEventStats } from '@/hooks/useSiteEvents';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Activity, Code, Copy, Eye, MousePointer, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from '@/lib/recharts';

export default function EventTracking() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const { data: events = [], isLoading } = useSiteEvents({ limit: 100 });
  const { data: stats } = useSiteEventStats();

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const trackingScript = `<script>
(function(){
  var endpoint='https://${projectId}.supabase.co/functions/v1/track-event';
  var orgId='${orgId}';
  var vid=localStorage._ag_vid||(localStorage._ag_vid='v_'+Math.random().toString(36).substr(2,9));
  function send(name,data){
    fetch(endpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        organization_id:orgId,
        event_name:name,
        event_data:data||{},
        page_url:location.href,
        referrer:document.referrer,
        visitor_id:vid,
        contact_email:window._ag_email||null
      })
    }).catch(function(){});
  }
  window.agsell={
    track:function(e,d){send(e,d)},
    identify:function(em){window._ag_email=em}
  };
  // Auto-track page view
  send('page_view',{title:document.title,path:location.pathname});
  // Track SPA navigation
  var pushState=history.pushState;
  history.pushState=function(){
    pushState.apply(history,arguments);
    send('page_view',{title:document.title,path:location.pathname});
  };
  window.addEventListener('popstate',function(){
    send('page_view',{title:document.title,path:location.pathname});
  });
})();
</script>`;

  const dayChartData = stats?.byDay
    ? Object.entries(stats.byDay).slice(-14).map(([day, count]) => ({ day: day.substring(5), eventos: count }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Event Tracking</h1>
        <p className="text-muted-foreground">Rastreie eventos do seu site e aplicações em tempo real</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-primary/10"><Zap className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total (30 dias)</p>
              <p className="text-2xl font-bold text-foreground">{stats?.totalEvents ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-info/10"><Activity className="h-6 w-6 text-info" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Tipos de Evento</p>
              <p className="text-2xl font-bold text-foreground">{stats?.uniqueEvents ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-success/10"><Eye className="h-6 w-6 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Page Views</p>
              <p className="text-2xl font-bold text-foreground">{stats?.byEvent?.['page_view'] ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Eventos Recentes</TabsTrigger>
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
          <TabsTrigger value="setup">Instalação</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Página</TableHead>
                    <TableHead>Visitor ID</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map(ev => (
                    <TableRow key={ev.id}>
                      <TableCell>
                        <Badge variant="outline">{ev.event_name}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {ev.page_url || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {ev.visitor_id?.substring(0, 8) || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(ev.created_at), 'dd/MM HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {events.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum evento registrado ainda. Instale o snippet de rastreamento.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Eventos por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              {dayChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dayChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="eventos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">Sem dados para exibir</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Snippet de Rastreamento</CardTitle>
              <CardDescription>Cole este código antes do &lt;/head&gt; do seu site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto text-foreground">
                  {trackingScript}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => { navigator.clipboard.writeText(trackingScript); toast.success('Snippet copiado!'); }}
                >
                  <Copy className="h-4 w-4 mr-1" /> Copiar
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Uso via JavaScript:</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm text-foreground">
{`// Rastrear evento customizado
agsell.track('button_click', { button: 'comprar', page: 'produto' });

// Identificar visitante (vincular ao contato)
agsell.identify('email@exemplo.com');

// Rastrear conversão
agsell.track('purchase', { value: 99.90, product: 'Plano Pro' });`}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Uso via API REST:</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm text-foreground">
{`POST https://${projectId}.supabase.co/functions/v1/track-event
Content-Type: application/json

{
  "organization_id": "${orgId}",
  "event_name": "signup",
  "event_data": { "plan": "pro" },
  "contact_email": "user@example.com"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
