import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChevronRight, Clock, BookOpen } from 'lucide-react';
import type { HelpCategory, HelpArticle } from '@/data/helpCenterData';

interface Props {
  article: HelpArticle;
  category?: HelpCategory;
  onBack: () => void;
  allArticles: HelpArticle[];
  onNavigate: (articleId?: string, categoryId?: string) => void;
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
                    <span className="text-sm">{item.replace(/^[-*]\s/, '')}</span>
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
                    <span className="text-sm pt-0.5">{item.replace(/^\d+\.\s/, '')}</span>
                  </li>
                ))}
              </ol>
            );
          }
          if (block.startsWith('[screenshot:')) {
            const label = block.match(/\[screenshot:(.*?)\]/)?.[1] || 'Tela do sistema';
            return (
              <div key={idx} className="my-6 rounded-xl border bg-muted/30 p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm font-medium">Captura de tela</span>
                </div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="mt-3 h-48 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground/60">📸 {label}</span>
                </div>
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
          return <p key={idx} className="text-sm leading-relaxed my-3 text-foreground/80">{block}</p>;
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
