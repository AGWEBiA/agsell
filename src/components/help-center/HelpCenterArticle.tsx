import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChevronRight, Clock, BookOpen, ExternalLink, Eye, Maximize2, X, PlayCircle, Lightbulb, AlertTriangle, Info } from 'lucide-react';
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
      <div className="my-6 rounded-xl border overflow-hidden bg-card shadow-sm group hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <span className="text-[10px] text-muted-foreground ml-2 font-mono">{route}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setExpanded(true)}>
              <Maximize2 className="h-3 w-3 mr-1" /> Ampliar
            </Button>
            <Link to={route}>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                <ExternalLink className="h-3 w-3 mr-1" /> Abrir
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative h-[320px] overflow-hidden bg-muted/10">
          <iframe
            src={route}
            className="w-[1366px] h-[768px] border-0 pointer-events-none"
            style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '1366px', height: '768px' }}
            title={label}
            loading="lazy"
          />
        </div>
        <div className="px-4 py-2 bg-muted/10 border-t">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <Eye className="h-3 w-3" /> {label}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl h-[85vh] rounded-2xl border overflow-hidden bg-background shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
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
              <iframe src={route} className="w-full h-full border-0 pointer-events-none" title={label} />
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
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-5 text-muted-foreground hover:text-foreground gap-1">
        <ArrowLeft className="h-4 w-4" /> {category?.title || 'Voltar'}
      </Button>

      {/* Article header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{article.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{article.description}</p>
          <div className="flex items-center gap-3 mt-2.5">
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

      <Separator className="mb-8" />

      {/* Article content */}
      <article className="prose prose-sm dark:prose-invert max-w-none">
        {article.content.split('\n\n').map((block, idx) => {
          if (block.startsWith('### ')) {
            return <h3 key={idx} className="text-lg font-semibold mt-8 mb-3 text-foreground">{block.replace('### ', '')}</h3>;
          }
          if (block.startsWith('## ')) {
            return <h2 key={idx} className="text-xl font-bold mt-10 mb-4 text-foreground">{block.replace('## ', '')}</h2>;
          }
          if (block.startsWith('> ')) {
            return (
              <div key={idx} className="border-l-4 border-primary/40 bg-primary/5 rounded-r-xl p-4 my-5">
                <p className="text-sm leading-relaxed">{block.replace('> ', '')}</p>
              </div>
            );
          }
          if (block.startsWith('- ') || block.startsWith('* ')) {
            const items = block.split('\n').filter(Boolean);
            return (
              <ul key={idx} className="space-y-2.5 my-5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: item.replace(/^[-*]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ul>
            );
          }
          if (block.startsWith('1. ')) {
            const items = block.split('\n').filter(Boolean);
            return (
              <ol key={idx} className="space-y-3.5 my-5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm pt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
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
                <div key={idx} className="my-6 rounded-xl border overflow-hidden bg-card shadow-sm">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-primary/5 to-transparent border-b">
                    <PlayCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                  <div className="relative aspect-video bg-black">
                    <video src={videoSrc} controls preload="metadata" className="w-full h-full">
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
            if (route) return <ScreenshotPreview key={idx} label={label} route={route} />;
            return (
              <div key={idx} className="my-6 rounded-xl border bg-muted/20 p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm font-medium">Captura de tela</span>
                </div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            );
          }
          // Callouts
          if (block.startsWith('💡')) {
            return (
              <div key={idx} className="rounded-xl p-4 my-5 border bg-blue-500/5 border-blue-500/15 flex items-start gap-2.5">
                <Lightbulb className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{block.replace('💡 ', '')}</p>
              </div>
            );
          }
          if (block.startsWith('⚠️')) {
            return (
              <div key={idx} className="rounded-xl p-4 my-5 border bg-amber-500/5 border-amber-500/15 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{block.replace('⚠️ ', '')}</p>
              </div>
            );
          }
          if (block.startsWith('ℹ️')) {
            return (
              <div key={idx} className="rounded-xl p-4 my-5 border bg-primary/5 border-primary/15 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{block.replace('ℹ️ ', '')}</p>
              </div>
            );
          }
          return <p key={idx} className="text-sm leading-relaxed my-3.5 text-foreground/80" dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
        })}
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-12">
          <Separator className="mb-6" />
          <h3 className="font-semibold mb-4 text-foreground">Artigos relacionados</h3>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {relatedArticles.map((ra) => (
              <button
                key={ra.id}
                onClick={() => onNavigate(ra.id, ra.categoryId)}
                className="group text-left p-3.5 rounded-xl border hover:border-primary/30 hover:bg-accent/30 transition-all duration-200"
              >
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{ra.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ra.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
