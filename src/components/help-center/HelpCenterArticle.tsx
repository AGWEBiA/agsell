import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChevronRight, Clock, BookOpen, ExternalLink, Eye, Maximize2, X, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HelpCategory, HelpArticle } from '@/data/helpCenterData';
import { TutorialPresentation } from '@/components/help-center/TutorialPresentation';
import { tutorialPresentations } from '@/data/tutorialPresentations';

interface Props {
  article: HelpArticle;
  category?: HelpCategory;
  onBack: () => void;
  allArticles: HelpArticle[];
  onNavigate: (articleId?: string, categoryId?: string) => void;
}

function ScreenshotPreview({ label, route }: { label: string; route: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="my-6 rounded-xl border overflow-hidden bg-muted/20 group">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-muted-foreground ml-2 font-mono">{route}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setExpanded(true)}
            >
              <Maximize2 className="h-3 w-3 mr-1" />
              Ampliar
            </Button>
            <Link to={route}>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                Abrir
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative h-[320px] overflow-hidden">
          <iframe
            src={route}
            className="w-[1366px] h-[768px] border-0 pointer-events-none"
            style={{
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
              width: '1366px',
              height: '768px',
            }}
            title={label}
            loading="lazy"
          />
        </div>
        <div className="px-4 py-2 bg-muted/20 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Eye className="h-3 w-3" />
            {label}
          </p>
        </div>
      </div>

      {/* Expanded modal */}
      {expanded && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-[85vh] rounded-xl border overflow-hidden bg-background shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-sm text-muted-foreground ml-2">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link to={route}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" /> Ir para a página
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={route}
                className="w-full h-full border-0 pointer-events-none"
                title={label}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function HelpCenterArticle({ article, category, onBack, allArticles, onNavigate }: Props) {
  const relatedArticles = allArticles
    .filter((a) => a.categoryId === article.categoryId && a.id !== article.id)
    .slice(0, 4);

  const Icon = article.icon;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {category?.title || 'Voltar'}
      </Button>

      {/* Article header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{article.title}</h1>
          <p className="text-muted-foreground mt-1">{article.description}</p>
          <div className="flex items-center gap-3 mt-2">
            {category && (
              <Badge variant="secondary" className="text-xs">{category.title}</Badge>
            )}
            {article.readTime && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {article.readTime}
              </span>
            )}
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Article content */}
      <article className="prose prose-sm dark:prose-invert max-w-none">
        {article.content.split('\n\n').map((block, idx) => {
          if (block.startsWith('### ')) {
            return <h3 key={idx} className="text-lg font-semibold mt-6 mb-3">{block.replace('### ', '')}</h3>;
          }
          if (block.startsWith('## ')) {
            return <h2 key={idx} className="text-xl font-bold mt-8 mb-4">{block.replace('## ', '')}</h2>;
          }
          if (block.startsWith('> ')) {
            return (
              <div key={idx} className="border-l-4 border-primary/40 bg-primary/5 rounded-r-lg p-4 my-4">
                <p className="text-sm">{block.replace('> ', '')}</p>
              </div>
            );
          }
          if (block.startsWith('- ') || block.startsWith('* ')) {
            const items = block.split('\n').filter(Boolean);
            return (
              <ul key={idx} className="space-y-2 my-4">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="text-sm" dangerouslySetInnerHTML={{ __html: item.replace(/^[-*]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ul>
            );
          }
          if (block.startsWith('1. ')) {
            const items = block.split('\n').filter(Boolean);
            return (
              <ol key={idx} className="space-y-3 my-4">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm pt-0.5" dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ol>
            );
          }
          // Video embed
          if (block.startsWith('[video:')) {
            const match = block.match(/\[video:(.*?)(?:\|(.*?))?\]/);
            const label = match?.[1] || 'Tutorial em vídeo';
            const videoSrc = match?.[2];
            if (videoSrc) {
              return (
                <div key={idx} className="my-6 rounded-xl border overflow-hidden bg-muted/20">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b">
                    <PlayCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className="relative aspect-video bg-black">
                    <video
                      src={videoSrc}
                      controls
                      preload="metadata"
                      className="w-full h-full"
                      poster=""
                    >
                      Seu navegador não suporta vídeos.
                    </video>
                  </div>
                </div>
              );
            }
          }
          // Presentation embed
          if (block.startsWith('[presentation:')) {
            const match = block.match(/\[presentation:(.*?)\]/);
            const presId = match?.[1];
            if (presId && tutorialPresentations[presId]) {
              return <TutorialPresentation key={idx} presentation={tutorialPresentations[presId]} />;
            }
          }
          // Screenshot with route
          if (block.startsWith('[screenshot:')) {
            const match = block.match(/\[screenshot:(.*?)(?:\|(.*?))?\]/);
            const label = match?.[1] || 'Tela do sistema';
            const route = match?.[2];

            if (route) {
              return <ScreenshotPreview key={idx} label={label} route={route} />;
            }

            // Fallback for screenshots without route
            return (
              <div key={idx} className="my-6 rounded-xl border bg-muted/30 p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm font-medium">Captura de tela</span>
                </div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            );
          }
          if (block.startsWith('💡') || block.startsWith('⚠️') || block.startsWith('ℹ️')) {
            const isWarning = block.startsWith('⚠️');
            return (
              <div
                key={idx}
                className={`rounded-lg p-4 my-4 border ${
                  isWarning ? 'bg-amber-500/5 border-amber-500/20' : 'bg-blue-500/5 border-blue-500/20'
                }`}
              >
                <p className="text-sm">{block}</p>
              </div>
            );
          }
          return <p key={idx} className="text-sm leading-relaxed my-3 text-foreground/80" dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
        })}
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-10">
          <Separator className="mb-6" />
          <h3 className="font-semibold mb-3">Artigos relacionados</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {relatedArticles.map((ra) => (
              <button
                key={ra.id}
                onClick={() => onNavigate(ra.id, ra.categoryId)}
                className="text-left p-3 rounded-lg border hover:border-primary/30 hover:bg-accent/50 transition-all group"
              >
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{ra.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ra.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
