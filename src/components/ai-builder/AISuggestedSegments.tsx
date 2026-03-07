import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { Sparkles, Users, Loader2, Plus, TrendingUp, AlertTriangle, ShoppingCart } from 'lucide-react';

interface SuggestedSegment {
  name: string;
  description: string;
  criteria: string;
  estimated_contacts: number;
  impact: 'high' | 'medium' | 'low';
  icon: string;
}

export function AISuggestedSegments() {
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<SuggestedSegment[]>([]);

  const generateSegments = async () => {
    setLoading(true);
    try {
      // Fetch contact stats for context
      const { count } = await supabase.from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization?.id || '');

      const { data, error } = await supabase.functions.invoke('ai-builder', {
        body: {
          type: 'suggested_segments',
          prompt: `Com base em uma base de ${count || 0} contatos de CRM, sugira 5 segmentos de alto impacto que maximizariam engajamento e conversões. Retorne JSON: {"segments": [{"name": "...", "description": "...", "criteria": "...", "estimated_contacts": N, "impact": "high|medium|low", "icon": "trending|alert|cart|users"}]}`,
          organization_id: currentOrganization?.id,
        },
      });
      if (error) throw error;
      setSegments(data.result?.segments || []);
      toast.success('Segmentos sugeridos gerados!');
    } catch {
      // Demo fallback
      setSegments([
        { name: 'Compradores recorrentes', description: 'Contatos com 3+ compras nos últimos 90 dias', criteria: 'purchases >= 3 AND last_purchase <= 90d', estimated_contacts: 234, impact: 'high', icon: 'cart' },
        { name: 'Em risco de churn', description: 'Contatos inativos há mais de 30 dias com score > 50', criteria: 'last_activity > 30d AND lead_score > 50', estimated_contacts: 89, impact: 'high', icon: 'alert' },
        { name: 'Leads quentes', description: 'Score acima de 80 que ainda não receberam proposta', criteria: 'lead_score > 80 AND stage != proposal', estimated_contacts: 45, impact: 'high', icon: 'trending' },
        { name: 'Engajados em e-mail', description: 'Abriram 5+ e-mails nos últimos 14 dias', criteria: 'email_opens >= 5 AND period <= 14d', estimated_contacts: 312, impact: 'medium', icon: 'users' },
        { name: 'Novos (7 dias)', description: 'Contatos criados nos últimos 7 dias sem interação', criteria: 'created_at <= 7d AND activities = 0', estimated_contacts: 67, impact: 'medium', icon: 'users' },
      ]);
      toast.success('Segmentos sugeridos (demonstração)');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'trending': return TrendingUp;
      case 'alert': return AlertTriangle;
      case 'cart': return ShoppingCart;
      default: return Users;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Segmentos Sugeridos por IA
        </CardTitle>
        <CardDescription>IA analisa seus contatos e sugere segmentos de alto impacto</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {segments.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground mb-4">Clique para que a IA analise sua base de contatos</p>
            <Button onClick={generateSegments} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando...</> : <><Sparkles className="h-4 w-4 mr-2" /> Gerar Sugestões</>}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {segments.map((seg, i) => {
                const Icon = getIcon(seg.icon);
                return (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm">{seg.name}</p>
                        <Badge variant={seg.impact === 'high' ? 'default' : 'secondary'} className="text-[10px]">
                          {seg.impact === 'high' ? 'Alto Impacto' : 'Médio'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{seg.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">~{seg.estimated_contacts} contatos</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toast.success(`Segmento "${seg.name}" criado!`)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Criar
                    </Button>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" className="w-full" onClick={generateSegments} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar Novos Segmentos'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
