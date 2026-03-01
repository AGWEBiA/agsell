import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, BookOpen, Rocket, Star } from 'lucide-react';
import type { HelpCategory, HelpArticle } from '@/data/helpCenterData';

interface Props {
  categories: HelpCategory[];
  articles: HelpArticle[];
  onNavigate: (articleId?: string, categoryId?: string) => void;
}

const categoryColors: Record<string, string> = {
  'getting-started': 'from-blue-500/20 to-blue-600/10',
  crm: 'from-emerald-500/20 to-emerald-600/10',
  communication: 'from-violet-500/20 to-violet-600/10',
  marketing: 'from-amber-500/20 to-amber-600/10',
  intelligence: 'from-pink-500/20 to-pink-600/10',
  settings: 'from-slate-500/20 to-slate-600/10',
};

export function HelpCenterHome({ categories, articles, onNavigate }: Props) {
  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">👋</div>
        <h1 className="text-3xl font-bold mb-3">Bem-vindo à Central de Ajuda</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Aqui você encontrará todas as informações necessárias para começar a utilizar o AG Sell
          e explorar ao máximo todos os recursos disponíveis.
        </p>
      </div>

      {/* Quick start */}
      <div className="mb-10 p-5 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Início Rápido</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {articles.filter((a) => a.categoryId === 'getting-started').slice(0, 3).map((article) => (
            <button
              key={article.id}
              onClick={() => onNavigate(article.id, article.categoryId)}
              className="text-left p-3 rounded-lg bg-background border hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                {React.createElement(article.icon, { className: 'h-4 w-4 text-primary' })}
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{article.title}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{article.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Category cards grid */}
      <h2 className="text-xl font-semibold mb-4">Tudo o que precisa saber para usar o AG Sell</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const catArticles = articles.filter((a) => a.categoryId === category.id);
          const Icon = category.icon;
          const gradientClass = categoryColors[category.id] || 'from-gray-500/20 to-gray-600/10';

          return (
            <Card
              key={category.id}
              className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all overflow-hidden"
              onClick={() => onNavigate(undefined, category.id)}
            >
              {/* Colored header */}
              <div className={`h-28 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background/80 shadow-sm group-hover:scale-110 transition-transform">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{category.title}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {catArticles.length} artigos
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ-style popular articles */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Artigos Populares</h2>
        </div>
        <div className="space-y-2">
          {articles.filter((a) => a.popular).slice(0, 6).map((article) => {
            const cat = categories.find((c) => c.id === article.categoryId);
            return (
              <button
                key={article.id}
                onClick={() => onNavigate(article.id, article.categoryId)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 hover:bg-accent/50 transition-all group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  {React.createElement(article.icon, { className: 'h-4 w-4 text-primary' })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{article.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{cat?.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
