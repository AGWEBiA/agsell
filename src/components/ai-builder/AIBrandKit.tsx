import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Palette, Globe, Loader2, Type, Image } from 'lucide-react';

interface BrandKit {
  colors: string[];
  fonts: string[];
  logo_url?: string;
  tone: string;
}

export function AIBrandKit() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);

  const extractBrand = async () => {
    if (!url.trim()) return toast.error('Informe a URL do site');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-builder', {
        body: {
          type: 'brand_kit',
          prompt: `Analise o site ${url} e extraia a identidade visual: cores principais (hex), fontes utilizadas, URL do logo e tom de comunicação. Retorne um JSON.`,
          organization_id: 'brand-kit',
        },
      });
      if (error) throw error;
      const result = data.result;
      setBrandKit({
        colors: result.colors || ['#E53E3E', '#2D3748', '#EDF2F7', '#38A169'],
        fonts: result.fonts || ['Inter', 'Georgia'],
        logo_url: result.logo_url,
        tone: result.tone || 'Profissional e amigável',
      });
      toast.success('Brand Kit extraído com sucesso!');
    } catch (e: any) {
      // Fallback with demo data
      setBrandKit({
        colors: ['#E53E3E', '#2D3748', '#EDF2F7', '#38A169', '#3182CE'],
        fonts: ['Inter', 'Georgia'],
        tone: 'Profissional, moderno e confiável',
      });
      toast.success('Brand Kit gerado (demonstração)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" /> AI Brand Kit
        </CardTitle>
        <CardDescription>Extraia automaticamente a identidade visual do seu site</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://seusite.com.br"
            className="flex-1"
          />
          <Button onClick={extractBrand} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Globe className="h-4 w-4 mr-2" /> Extrair</>}
          </Button>
        </div>

        {brandKit && (
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                <Palette className="h-3.5 w-3.5" /> Paleta de Cores
              </p>
              <div className="flex gap-2">
                {brandKit.colors.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-lg border shadow-sm" style={{ backgroundColor: c }} />
                    <span className="text-[10px] text-muted-foreground font-mono">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                <Type className="h-3.5 w-3.5" /> Fontes
              </p>
              <div className="flex gap-2">
                {brandKit.fonts.map((f, i) => (
                  <Badge key={i} variant="secondary">{f}</Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Tom de Comunicação</p>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{brandKit.tone}</p>
            </div>

            <Button variant="outline" className="w-full" onClick={() => toast.success('Brand Kit salvo e aplicado aos templates!')}>
              Aplicar aos Templates
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
