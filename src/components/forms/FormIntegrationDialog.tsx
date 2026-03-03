import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Code, Globe, Webhook, ExternalLink, Paintbrush, Check } from 'lucide-react';
import { toast } from 'sonner';
import { HelpTooltip } from '@/components/ui/help-tooltip';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  formName: string;
}

const DEFAULT_STYLES = {
  primaryColor: '#6366f1',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  borderRadius: '8',
  fontFamily: '',
};

export function FormIntegrationDialog({ open, onOpenChange, formId, formName }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const [styles, setStyles] = useState(DEFAULT_STYLES);

  const baseUrl = window.location.origin;
  const formUrl = `${baseUrl}/forms/${formId}`;
  const apiUrl = `${baseUrl.replace('://', '://').replace(window.location.host, import.meta.env.VITE_SUPABASE_URL?.replace('https://', '') || window.location.host)}/functions/v1/public-api/forms/${formId}/submit`;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const apiEndpoint = `${supabaseUrl}/functions/v1/public-api/forms/${formId}/submit`;

  const buildStyleParams = () => {
    const params = new URLSearchParams();
    if (styles.primaryColor !== DEFAULT_STYLES.primaryColor) params.set('primary', styles.primaryColor.replace('#', ''));
    if (styles.backgroundColor !== DEFAULT_STYLES.backgroundColor) params.set('bg', styles.backgroundColor.replace('#', ''));
    if (styles.textColor !== DEFAULT_STYLES.textColor) params.set('text', styles.textColor.replace('#', ''));
    if (styles.borderRadius !== DEFAULT_STYLES.borderRadius) params.set('radius', styles.borderRadius);
    if (styles.fontFamily) params.set('font', styles.fontFamily);
    return params.toString();
  };

  const styledFormUrl = () => {
    const params = buildStyleParams();
    return params ? `${formUrl}?${params}` : formUrl;
  };

  const iframeCode = `<iframe 
  src="${styledFormUrl()}" 
  width="100%" 
  height="500" 
  frameborder="0" 
  style="border: none; border-radius: ${styles.borderRadius}px; max-width: 600px;"
  title="${formName}">
</iframe>`;

  const scriptCode = `<div id="agsell-form-${formId}"></div>
<script>
(function() {
  var container = document.getElementById('agsell-form-${formId}');
  if (!container) return;
  var iframe = document.createElement('iframe');
  iframe.src = '${styledFormUrl()}';
  iframe.style.cssText = 'width:100%;border:none;border-radius:${styles.borderRadius}px;max-width:600px;min-height:400px;';
  iframe.title = '${formName}';
  container.appendChild(iframe);
  // Auto-resize
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'agsell-form-height' && e.data.formId === '${formId}') {
      iframe.style.height = e.data.height + 'px';
    }
  });
})();
</script>`;

  const apiExample = `// Enviar submissão via API (POST)
// Endpoint: ${apiEndpoint}

fetch('${apiEndpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Opcional: 'Authorization': 'Bearer SUA_API_KEY'
  },
  body: JSON.stringify({
    // Os campos devem corresponder aos nomes dos campos do formulário
    name: "João Silva",
    email: "joao@email.com",
    phone: "(11) 99999-9999"
    // ... outros campos do formulário
  })
})
.then(res => res.json())
.then(data => console.log('Sucesso:', data))
.catch(err => console.error('Erro:', err));`;

  const webhookUrlExample = `URL do Webhook: ${apiEndpoint}
Método: POST
Content-Type: application/json

// Para Elementor Pro (WordPress):
// 1. Adicione uma ação "Webhook" no formulário
// 2. Cole a URL acima
// 3. Mapeie os campos usando os nomes do formulário AG Sell

// Para Unbounce:
// 1. Vá em "Form Confirmation" > "Webhook"  
// 2. Cole a URL acima
// 3. O payload será enviado automaticamente

// Para qualquer plataforma com webhook:
// Envie um POST com JSON contendo os campos do formulário`;

  const cssOverrideCode = `/* Cole este CSS na sua página para personalizar o formulário */
#agsell-form-${formId} iframe {
  /* Dimensões */
  width: 100%;
  max-width: 600px;
  min-height: 400px;
  
  /* Bordas */
  border: none;
  border-radius: ${styles.borderRadius}px;
  
  /* Sombra (opcional) */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  /* Margem */
  margin: 0 auto;
  display: block;
}

/* Responsivo */
@media (max-width: 640px) {
  #agsell-form-${formId} iframe {
    max-width: 100%;
    border-radius: 0;
  }
}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, label)}
      className="shrink-0"
    >
      {copied === label ? <Check className="h-3.5 w-3.5 mr-1 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
      {copied === label ? 'Copiado!' : 'Copiar'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Integrar Formulário
          </DialogTitle>
          <DialogDescription>
            Escolha como integrar o formulário "<strong>{formName}</strong>" na sua página
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="embed" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="embed" className="text-xs">
              <Code className="h-3.5 w-3.5 mr-1" />Embed
            </TabsTrigger>
            <TabsTrigger value="script" className="text-xs">
              <Globe className="h-3.5 w-3.5 mr-1" />Script
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs">
              <Webhook className="h-3.5 w-3.5 mr-1" />API
            </TabsTrigger>
            <TabsTrigger value="link" className="text-xs">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />Link
            </TabsTrigger>
            <TabsTrigger value="style" className="text-xs">
              <Paintbrush className="h-3.5 w-3.5 mr-1" />Estilo
            </TabsTrigger>
          </TabsList>

          {/* EMBED (iframe) */}
          <TabsContent value="embed" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Código Embed (iframe)</h3>
                  <Badge variant="secondary" className="text-[10px]">Recomendado</Badge>
                </div>
                <CopyButton text={iframeCode} label="Embed" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Cole este código HTML em qualquer página web, WordPress, Wix, Squarespace, etc.
              </p>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono border">
                {iframeCode}
              </pre>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 <strong>Elementor:</strong> Use o widget "HTML" e cole o código acima. Ajuste a altura conforme necessário.
              </p>
            </div>
          </TabsContent>

          {/* SCRIPT JS */}
          <TabsContent value="script" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Script JavaScript</h3>
                <CopyButton text={scriptCode} label="Script" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Renderiza o formulário diretamente na página com auto-resize. Compatível com Elementor, Webflow, Unbounce, etc.
              </p>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono border">
                {scriptCode}
              </pre>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 <strong>Elementor:</strong> Use o widget "HTML" e cole o código. O formulário se ajustará automaticamente à largura do container.
              </p>
            </div>
          </TabsContent>

          {/* API / WEBHOOK */}
          <TabsContent value="api" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Endpoint API (Webhook)</h3>
                <CopyButton text={apiEndpoint} label="URL API" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Use este endpoint para enviar dados de formulários nativos do Elementor, Unbounce, Typeform, ou qualquer plataforma com suporte a webhooks.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <Badge>POST</Badge>
                <code className="text-xs bg-muted px-2 py-1 rounded break-all">{apiEndpoint}</code>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Exemplo com JavaScript</h3>
                <CopyButton text={apiExample} label="Código API" />
              </div>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono border">
                {apiExample}
              </pre>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Configuração em plataformas</h3>
                <CopyButton text={webhookUrlExample} label="Instruções" />
              </div>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono border">
                {webhookUrlExample}
              </pre>
            </div>
          </TabsContent>

          {/* LINK DIRETO */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Link Direto</h3>
                <CopyButton text={styledFormUrl()} label="Link" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Compartilhe este link por WhatsApp, e-mail, redes sociais ou use em anúncios.
              </p>
              <div className="flex items-center gap-2">
                <Input value={styledFormUrl()} readOnly className="text-xs font-mono" />
                <Button variant="outline" size="sm" onClick={() => window.open(styledFormUrl(), '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-300">
                💡 Ideal para compartilhar via WhatsApp, bio do Instagram ou QR Code. O formulário abre em tela cheia com o estilo personalizado.
              </p>
            </div>
          </TabsContent>

          {/* PERSONALIZAÇÃO CSS */}
          <TabsContent value="style" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">Personalização Visual</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Configure cores e estilos. As alterações serão refletidas em todos os códigos de integração.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  Cor Principal
                  <HelpTooltip content="Cor dos botões e elementos de destaque" />
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={styles.primaryColor}
                    onChange={(e) => setStyles(s => ({ ...s, primaryColor: e.target.value }))}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    className="h-8 text-xs font-mono"
                    value={styles.primaryColor}
                    onChange={(e) => setStyles(s => ({ ...s, primaryColor: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  Cor de Fundo
                  <HelpTooltip content="Cor do fundo do formulário" />
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={styles.backgroundColor}
                    onChange={(e) => setStyles(s => ({ ...s, backgroundColor: e.target.value }))}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    className="h-8 text-xs font-mono"
                    value={styles.backgroundColor}
                    onChange={(e) => setStyles(s => ({ ...s, backgroundColor: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  Cor do Texto
                  <HelpTooltip content="Cor dos textos e labels" />
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={styles.textColor}
                    onChange={(e) => setStyles(s => ({ ...s, textColor: e.target.value }))}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    className="h-8 text-xs font-mono"
                    value={styles.textColor}
                    onChange={(e) => setStyles(s => ({ ...s, textColor: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  Arredondamento (px)
                  <HelpTooltip content="Border radius dos campos e botões" />
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  className="h-8 text-xs"
                  value={styles.borderRadius}
                  onChange={(e) => setStyles(s => ({ ...s, borderRadius: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                Fonte (font-family)
                <HelpTooltip content="Nome da fonte. Deixe em branco para usar a fonte padrão da página." />
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="Ex: 'Inter', 'Roboto', 'Open Sans'"
                value={styles.fontFamily}
                onChange={(e) => setStyles(s => ({ ...s, fontFamily: e.target.value }))}
              />
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">CSS Customizado (avançado)</h3>
                <CopyButton text={cssOverrideCode} label="CSS" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Para controle total, cole este CSS na sua página e ajuste as propriedades.
              </p>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono border">
                {cssOverrideCode}
              </pre>
            </div>

            <Button variant="outline" size="sm" onClick={() => setStyles(DEFAULT_STYLES)}>
              Restaurar padrão
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
