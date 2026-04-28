import { useEffect, useRef } from 'react';

interface SwaggerEmbedProps {
  specUrl: string;
}

const SWAGGER_CSS = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css';
const SWAGGER_JS_BUNDLE = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js';
const SWAGGER_JS_PRESET = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js';

declare global {
  interface Window {
    SwaggerUIBundle?: any;
    SwaggerUIStandalonePreset?: any;
  }
}

const loadCSS = (href: string) => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });

export function SwaggerEmbed({ specUrl }: SwaggerEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadCSS(SWAGGER_CSS);

    const init = async () => {
      try {
        await loadScript(SWAGGER_JS_BUNDLE);
        await loadScript(SWAGGER_JS_PRESET);
        if (cancelled || !containerRef.current || !window.SwaggerUIBundle) return;
        window.SwaggerUIBundle({
          url: specUrl,
          domNode: containerRef.current,
          deepLinking: true,
          docExpansion: 'list',
          defaultModelsExpandDepth: 1,
          tryItOutEnabled: true,
          persistAuthorization: true,
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIStandalonePreset,
          ],
          layout: 'BaseLayout',
        });
      } catch (e) {
        console.error('SwaggerEmbed load error', e);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [specUrl]);

  return (
    <div className="swagger-embed-wrapper rounded-lg border bg-white overflow-hidden">
      <div ref={containerRef} className="min-h-[400px]" />
    </div>
  );
}
