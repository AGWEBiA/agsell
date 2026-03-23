import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, Search, BookOpen, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { HelpCenterSidebar } from '@/components/help-center/HelpCenterSidebar';
import { HelpCenterHome } from '@/components/help-center/HelpCenterHome';
import { HelpCenterArticle } from '@/components/help-center/HelpCenterArticle';
import { helpCategories, helpArticles } from '@/data/helpCenterData';

export default function HelpCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeArticleId = searchParams.get('article');
  const activeCategoryId = searchParams.get('category');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeArticle = activeArticleId ? helpArticles.find((a) => a.id === activeArticleId) : null;
  const activeCategory = activeCategoryId ? helpCategories.find((c) => c.id === activeCategoryId) : null;

  const filteredArticles = search
    ? helpArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.description.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const navigateTo = (articleId?: string, categoryId?: string) => {
    const params = new URLSearchParams();
    if (articleId) params.set('article', articleId);
    if (categoryId) params.set('category', categoryId);
    setSearchParams(params);
    setSearch('');
  };

  const categoryArticles = activeCategoryId
    ? helpArticles.filter((a) => a.categoryId === activeCategoryId)
    : [];

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 overflow-hidden bg-background">
      <HelpCenterSidebar
        categories={helpCategories}
        articles={helpArticles}
        activeCategoryId={activeCategoryId}
        activeArticleId={activeArticleId}
        onNavigate={navigateTo}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b px-6 py-2.5 bg-card/50 backdrop-blur-sm">
          <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <BookOpen className="h-4 w-4" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-1 min-w-0">
            <button onClick={() => navigateTo()} className="hover:text-foreground transition-colors font-medium text-xs">
              Central de Ajuda
            </button>
            {activeCategory && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <button
                  onClick={() => navigateTo(undefined, activeCategory.id)}
                  className="hover:text-foreground transition-colors truncate text-xs"
                >
                  {activeCategory.title}
                </button>
              </>
            )}
            {activeArticle && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className="text-foreground truncate text-xs font-medium">{activeArticle.title}</span>
              </>
            )}
          </div>

          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30"
            />
          </div>
        </div>

        {/* Search results overlay */}
        {search && (
          <div className="absolute top-[calc(4rem+2.75rem)] right-6 w-80 max-h-80 bg-popover border rounded-xl shadow-xl z-50 overflow-auto">
            {filteredArticles.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhum resultado para "{search}"
              </div>
            ) : (
              <div className="p-1.5">
                {filteredArticles.map((article) => {
                  const cat = helpCategories.find((c) => c.id === article.categoryId);
                  return (
                    <button
                      key={article.id}
                      onClick={() => navigateTo(article.id, article.categoryId)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{article.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{cat?.title}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Content area */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {activeArticle ? (
              <HelpCenterArticle
                article={activeArticle}
                category={helpCategories.find((c) => c.id === activeArticle.categoryId)}
                onBack={() => navigateTo(undefined, activeArticle.categoryId)}
                allArticles={helpArticles}
                onNavigate={navigateTo}
              />
            ) : activeCategoryId && activeCategory ? (
              <div>
                <Button variant="ghost" size="sm" onClick={() => navigateTo()} className="mb-5 -ml-2 text-muted-foreground hover:text-foreground gap-1">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
                    {React.createElement(activeCategory.icon, { className: 'h-5 w-5 text-primary' })}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{activeCategory.title}</h1>
                    <p className="text-sm text-muted-foreground">{activeCategory.description}</p>
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="space-y-2">
                  {categoryArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => navigateTo(article.id, article.categoryId)}
                      className="w-full text-left flex items-start gap-3 p-4 rounded-xl border hover:border-primary/30 hover:bg-accent/30 transition-all duration-200 group"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                        {React.createElement(article.icon, { className: 'h-4 w-4 text-primary' })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{article.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{article.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <HelpCenterHome
                categories={helpCategories}
                articles={helpArticles}
                onNavigate={navigateTo}
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
