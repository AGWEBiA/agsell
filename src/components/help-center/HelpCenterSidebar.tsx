import React from 'react';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  React.useEffect(() => {
    if (activeCategoryId) {
      setExpandedCategories((prev) => ({ ...prev, [activeCategoryId]: true }));
    }
  }, [activeCategoryId]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={cn(
        'border-r bg-muted/30 transition-all duration-300 shrink-0',
        open ? 'w-72' : 'w-0 overflow-hidden',
        'hidden lg:block'
      )}
    >
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <BookOpen className="h-5 w-5 text-primary" />
        <button onClick={() => onNavigate()} className="font-semibold text-sm hover:text-primary transition-colors">
          CENTRAL DE AJUDA
        </button>
      </div>

      <ScrollArea className="h-[calc(100%-3.5rem)]">
        <nav className="p-2 space-y-0.5">
          {/* Home */}
          <button
            onClick={() => onNavigate()}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors',
              !activeCategoryId && !activeArticleId
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            👋 Bem-vindo ao AG Sell
          </button>

          {categories.map((category) => {
            const catArticles = articles.filter((a) => a.categoryId === category.id);
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
                    'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors',
                    isActiveCategory && !activeArticleId
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground/80 hover:bg-accent'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{category.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-transform',
                      isExpanded ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </button>

                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200',
                    isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="ml-4 border-l pl-2 mt-0.5 space-y-0.5">
                    {catArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => onNavigate(article.id, category.id)}
                        className={cn(
                          'w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors truncate',
                          activeArticleId === article.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
