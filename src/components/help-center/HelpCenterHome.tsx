import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, BookOpen, Rocket, Star, Sparkles, PlayCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HelpCategory, HelpArticle } from '@/data/helpCenterData';

interface Props {
  categories: HelpCategory[];
  articles: HelpArticle[];
  onNavigate: (articleId?: string, categoryId?: string) => void;
}

const categoryGradients: Record<string, { bg: string; border: string; icon: string }> = {
  'getting-started': { bg: 'from-blue-500/10 via-blue-400/5 to-transparent', border: 'border-blue-500/20 hover:border-blue-500/40', icon: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  crm: { bg: 'from-emerald-500/10 via-emerald-400/5 to-transparent', border: 'border-emerald-500/20 hover:border-emerald-500/40', icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  communication: { bg: 'from-violet-500/10 via-violet-400/5 to-transparent', border: 'border-violet-500/20 hover:border-violet-500/40', icon: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  marketing: { bg: 'from-amber-500/10 via-amber-400/5 to-transparent', border: 'border-amber-500/20 hover:border-amber-500/40', icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  intelligence: { bg: 'from-pink-500/10 via-pink-400/5 to-transparent', border: 'border-pink-500/20 hover:border-pink-500/40', icon: 'bg-pink-500/15 text-pink-600 dark:text-pink-400' },
  settings: { bg: 'from-slate-500/10 via-slate-400/5 to-transparent', border: 'border-slate-500/20 hover:border-slate-500/40', icon: 'bg-slate-500/15 text-slate-600 dark:text-slate-400' },
};

export function HelpCenterHome({ categories, articles, onNavigate }: Props) {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4">
            <Sparkles className="h-3 w-3" />
            Central de Ajuda AG Sell
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
            Como podemos ajudar?
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            Encontre guias, tutoriais em vídeo e apresentações interativas para dominar
            todas as funcionalidades do AG Sell.
          </p>
        </div>
      </div>

      {/* Quick Start Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Início Rápido</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {articles.filter((a) => a.categoryId === 'getting-started').slice(0, 3).map((article) => (
            <button
              key={article.id}
              onClick={() => onNavigate(article.id, article.categoryId)}
              className="group text-left p-4 rounded-xl bg-card border hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  {React.createElement(article.icon, { className: 'h-4 w-4 text-primary' })}
                </div>
                <span className="text-sm font-semibold group-hover:text-primary transition-colors">{article.title}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{article.description}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Ler artigo <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Category Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-5">Explore por categoria</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const catArticles = articles.filter((a) => a.categoryId === category.id);
            const Icon = category.icon;
            const style = categoryGradients[category.id] || categoryGradients['settings'];

            return (
              <button
                key={category.id}
                className={`group text-left rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg ${style.border}`}
                onClick={() => onNavigate(undefined, category.id)}
              >
                <div className={`h-24 bg-gradient-to-br ${style.bg} flex items-center justify-center relative`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.icon} shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="p-4 bg-card">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{category.title}</h3>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {catArticles.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{category.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Popular Articles */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Artigos Populares</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {articles.filter((a) => a.popular).slice(0, 6).map((article) => {
            const cat = categories.find((c) => c.id === article.categoryId);
            return (
              <button
                key={article.id}
                onClick={() => onNavigate(article.id, article.categoryId)}
                className="group w-full text-left flex items-center gap-3 p-3.5 rounded-xl border hover:border-primary/30 hover:bg-accent/30 transition-all duration-200"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  {React.createElement(article.icon, { className: 'h-4 w-4 text-primary' })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{article.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{cat?.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
