import React from 'react';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronDown, Home, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import type { HelpCategory, HelpArticle } from '@/data/helpCenterData';

interface Props {
  categories: HelpCategory[];
  articles: HelpArticle[];
  activeCategoryId: string | null;
  activeArticleId: string | null;
  onNavigate: (articleId?: string, categoryId?: string) => void;
  open: boolean;
  onToggle: () => void;
}

export function HelpCenterSidebar({ categories, articles, activeCategoryId, activeArticleId, onNavigate, open }: Props) {
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (activeCategoryId) initial[activeCategoryId] = true;
    return initial;
  });
  const [sidebarSearch, setSidebarSearch] = React.useState('');

  React.useEffect(() => {
    if (activeCategoryId) {
      setExpandedCategories((prev) => ({ ...prev, [activeCategoryId]: true }));
    }
  }, [activeCategoryId]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCategories = sidebarSearch
    ? categories.filter(cat => {
        const catArticles = articles.filter(a => a.categoryId === cat.id);
        return cat.title.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
          catArticles.some(a => a.title.toLowerCase().includes(sidebarSearch.toLowerCase()));
      })
    : categories;

  return (
    <aside
      className={cn(
        'border-r bg-card/50 backdrop-blur-sm transition-all duration-300 shrink-0',
        open ? 'w-72' : 'w-0 overflow-hidden',
        'hidden lg:block'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b bg-muted/20">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <button onClick={() => onNavigate()} className="font-semibold text-sm hover:text-primary transition-colors tracking-wide">
          CENTRAL DE AJUDA
        </button>
      </div>

      {/* Sidebar search */}
      <div className="px-3 py-2.5 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrar..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/30 border-muted"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-7.5rem)]">
        <nav className="p-2 space-y-0.5">
          {/* Home link */}
          <button
            onClick={() => onNavigate()}
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150',
              !activeCategoryId && !activeArticleId
                ? 'bg-primary/10 text-primary font-medium shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            <Home className="h-4 w-4" />
            Início
          </button>

          <div className="h-px bg-border my-2" />

          {filteredCategories.map((category) => {
            const catArticles = articles.filter((a) => a.categoryId === category.id);
            const matchedArticles = sidebarSearch
              ? catArticles.filter(a => a.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
              : catArticles;
            const isExpanded = expandedCategories[category.id] ?? false;
            const isActiveCategory = activeCategoryId === category.id;
            const Icon = category.icon;

            return (
              <div key={category.id}>
                <button
                  onClick={() => {
                    toggleCategory(category.id);
                    onNavigate(undefined, category.id);
                  }}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150',
                    isActiveCategory && !activeArticleId
                      ? 'bg-primary/10 text-primary font-medium shadow-sm'
                      : 'text-foreground/80 hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{category.title}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{catArticles.length}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                      isExpanded ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </button>

                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200',
                    isExpanded || sidebarSearch ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="ml-5 border-l border-border/60 pl-2.5 mt-0.5 mb-1 space-y-0.5">
                    {(sidebarSearch ? matchedArticles : catArticles).map((article) => (
                      <button
                        key={article.id}
                        onClick={() => onNavigate(article.id, category.id)}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-all duration-150 truncate leading-relaxed',
                          activeArticleId === article.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                        )}
                      >
                        {article.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
