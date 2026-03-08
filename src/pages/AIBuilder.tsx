import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { Brain, Mail, MessageSquare, Workflow, Sparkles, Copy, Loader2, Palette, Users } from 'lucide-react';
import { AIBrandKit } from '@/components/ai-builder/AIBrandKit';
import { AISuggestedSegments } from '@/components/ai-builder/AISuggestedSegments';

type BuilderType = 'email_campaign' | 'automation_flow' | 'subject_line' | 'whatsapp_message';

export default function AIBuilder() {
  const { currentOrganization } = useOrganization();
  const [type, setType] = useState<BuilderType>('email_campaign');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return toast.error('Descreva o que deseja gerar');
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-builder', {
        body: { type, prompt, organization_id: currentOrganization?.id },
      });
      if (error) throw error;
      setResult(data.result);
      toast.success('Conteúdo gerado com sucesso!');
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const typeConfig: Record<BuilderType, { label: string; icon: React.ReactNode; placeholder: string }> = {
    email_campaign: {
      label: 'Campanha de E-mail',
      icon: <Mail className="h-4 w-4" />,
      placeholder: 'Ex: Crie um e-mail de boas-vindas para novos clientes de um SaaS de marketing...',
    },
    automation_flow: {
      label: 'Fluxo de Automação',
      icon: <Workflow className="h-4 w-4" />,
      placeholder: 'Ex: Crie um fluxo de nutrição de leads com 5 etapas...',
    },
    subject_line: {
      label: 'Assuntos de E-mail',
      icon: <Sparkles className="h-4 w-4" />,
      placeholder: 'Ex: Gere assuntos para uma promoção de 50% de desconto...',
    },
    whatsapp_message: {
      label: 'Mensagem WhatsApp',
      icon: <MessageSquare className="h-4 w-4" />,
      placeholder: 'Ex: Crie uma mensagem de follow-up para leads que baixaram nosso e-book...',
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" /> AI Builder
        </h1>
        <p className="text-muted-foreground">IA generativa para campanhas, automações, brand kit e segmentação inteligente</p>
      </div>

      <Tabs defaultValue="generator">
        <TabsList>
          <TabsTrigger value="generator"><Sparkles className="h-3.5 w-3.5 mr-1" /> Gerador</TabsTrigger>
          <TabsTrigger value="brandkit"><Palette className="h-3.5 w-3.5 mr-1" /> Brand Kit</TabsTrigger>
          <TabsTrigger value="segments"><Users className="h-3.5 w-3.5 mr-1" /> Segmentos IA</TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>O que deseja criar?</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Tipo de conteúdo</label>
                  <Select value={type} onValueChange={(v) => setType(v as BuilderType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">{cfg.icon} {cfg.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Descreva em detalhes</label>
                  <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={typeConfig[type].placeholder} rows={6} />
                </div>
                <Button onClick={generate} disabled={loading} className="w-full">
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : <><Sparkles className="h-4 w-4 mr-2" /> Gerar com IA</>}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultado</CardTitle>
                <CardDescription>Conteúdo gerado pela IA</CardDescription>
              </CardHeader>
              <CardContent>
                {!result && !loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Brain className="h-12 w-12 mb-4 opacity-30" />
                    <p>Descreva o que deseja e clique em "Gerar com IA"</p>
                  </div>
                )}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Gerando conteúdo...</p>
                  </div>
                )}
                {result && (
                  <div className="space-y-4">
                    {type === 'email_campaign' && result.subject && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Assunto</label>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground flex-1">{result.subject}</p>
                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(result.subject)}><Copy className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                        {result.preview_text && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Preview Text</label>
                            <p className="text-sm text-foreground">{result.preview_text}</p>
                          </div>
                        )}
                        {result.html_content && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-muted-foreground">HTML</label>
                              <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.html_content)}>
                                <Copy className="h-3.5 w-3.5 mr-1" /> Copiar HTML
                              </Button>
                            </div>
                            <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto bg-background" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result.html_content) }} />
                          </div>
                        )}
                      </>
                    )}
                    {type === 'subject_line' && result.suggestions && (
                      <div className="space-y-3">
                        {result.suggestions.map((s: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">{s.subject}</p>
                              <Badge variant="secondary" className="mt-1">{s.tone}</Badge>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(s.subject)}><Copy className="h-3.5 w-3.5" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {type === 'automation_flow' && result.steps && (
                      <div className="space-y-3">
                        <p className="font-semibold text-foreground">{result.name}</p>
                        <p className="text-sm text-muted-foreground">{result.description}</p>
                        {result.steps.map((step: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                            <Badge>{i + 1}</Badge>
                            <div>
                              <p className="font-medium text-foreground capitalize">{step.type}</p>
                              <p className="text-xs text-muted-foreground">{JSON.stringify(step.config)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {type === 'whatsapp_message' && result.message && (
                      <div className="space-y-3">
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-foreground whitespace-pre-wrap">{result.message}</p>
                        </div>
                        {result.cta && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">CTA sugerido</label>
                            <p className="text-sm font-medium text-foreground">{result.cta}</p>
                          </div>
                        )}
                        <Button variant="outline" onClick={() => copyToClipboard(result.message)}>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copiar Mensagem
                        </Button>
                      </div>
                    )}
                    {result.raw && (
                      <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap text-foreground">{result.raw}</pre>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="brandkit">
          <AIBrandKit />
        </TabsContent>

        <TabsContent value="segments">
          <AISuggestedSegments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
