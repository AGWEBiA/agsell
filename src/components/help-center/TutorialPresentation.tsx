import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Maximize2, X, Monitor, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface TutorialSlide {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  bullets?: string[];
  tip?: string;
  warning?: string;
  route?: string;
  image?: string;
}

export interface TutorialPresentationData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  slides: TutorialSlide[];
}

interface Props {
  presentation: TutorialPresentationData;
}

export function TutorialPresentation({ presentation }: Props) {
  const [current, setCurrent] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const total = presentation.slides.length;
  const slide = presentation.slides[current];

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(total - 1, c + 1)), [total]);

  // Keyboard navigation
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expanded, next, prev]);

  const SlideContent = ({ compact = false }: { compact?: boolean }) => {
    const Icon = slide.icon || presentation.icon;
    return (
      <div className={cn('flex flex-col h-full', compact ? 'p-5' : 'p-6 md:p-10')}>
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-5">
          <div className={cn(
            'flex items-center justify-center rounded-xl bg-primary/10 shadow-sm',
            compact ? 'h-9 w-9' : 'h-11 w-11'
          )}>
            <Icon className={cn('text-primary', compact ? 'h-4 w-4' : 'h-5 w-5')} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Passo {current + 1}/{total}
              </span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${((current + 1) / total) * 100}%` }}
                />
              </div>
            </div>
            <h3 className={cn('font-bold mt-1', compact ? 'text-base' : 'text-xl')}>
              {slide.title}
            </h3>
          </div>
        </div>

        {slide.subtitle && (
          <p className={cn('text-muted-foreground mb-5 leading-relaxed', compact ? 'text-xs' : 'text-sm')}>
            {slide.subtitle}
          </p>
        )}

        {/* Bullets */}
        {slide.bullets && slide.bullets.length > 0 && (
          <ul className={cn('space-y-3 flex-1', compact ? 'space-y-2.5' : 'space-y-3.5')}>
            {slide.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 group/bullet">
                <span className={cn(
                  'flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold transition-colors group-hover/bullet:bg-primary/20',
                  compact ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-xs'
                )}>
                  {i + 1}
                </span>
                <span className={cn('leading-relaxed', compact ? 'text-xs' : 'text-sm')}
                  dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>') }}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Route preview */}
        {slide.route && (
          <div className="mt-5 rounded-xl border overflow-hidden bg-muted/20 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive/40" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
                <div className="w-2 h-2 rounded-full bg-green-500/40" />
              </div>
              <Monitor className="h-3 w-3 text-muted-foreground ml-1" />
              <span className="text-[10px] text-muted-foreground font-mono">{slide.route}</span>
            </div>
            <div className="relative h-[180px] overflow-hidden">
              <iframe
                src={slide.route}
                className="w-[1366px] h-[768px] border-0 pointer-events-none"
                style={{ transform: 'scale(0.38)', transformOrigin: 'top left' }}
                title={slide.title}
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Tip / Warning */}
        <div className="mt-auto pt-4 space-y-3">
          {slide.tip && (
            <div className="rounded-xl p-3.5 bg-blue-500/5 border border-blue-500/15 flex items-start gap-2.5">
              <Lightbulb className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className={cn('leading-relaxed', compact ? 'text-xs' : 'text-sm')}>{slide.tip}</p>
            </div>
          )}
          {slide.warning && (
            <div className="rounded-xl p-3.5 bg-amber-500/5 border border-amber-500/15 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className={cn('leading-relaxed', compact ? 'text-xs' : 'text-sm')}>{slide.warning}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Navigation = ({ size = 'default' }: { size?: 'sm' | 'default' }) => (
    <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/10">
      <Button variant="ghost" size={size === 'sm' ? 'sm' : 'default'} onClick={prev} disabled={current === 0} className="gap-1">
        <ChevronLeft className="h-4 w-4" /> Anterior
      </Button>
      <div className="flex items-center gap-1.5">
        {presentation.slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'rounded-full transition-all duration-300',
              i === current
                ? 'w-7 h-2 bg-primary shadow-sm'
                : i < current
                  ? 'w-2 h-2 bg-primary/40'
                  : 'w-2 h-2 bg-muted-foreground/20 hover:bg-muted-foreground/40'
            )}
          />
        ))}
      </div>
      <Button variant="ghost" size={size === 'sm' ? 'sm' : 'default'} onClick={next} disabled={current === total - 1} className="gap-1">
        Próximo <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const PresentationIcon = presentation.icon;

  return (
    <>
      <div className="my-6 rounded-xl border overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-primary/5 to-transparent border-b">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Play className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold">{presentation.title}</span>
              <span className="text-[10px] text-muted-foreground ml-2">• {total} passos</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" onClick={() => setExpanded(true)}>
            <Maximize2 className="h-3 w-3" /> Tela cheia
          </Button>
        </div>

        {/* Slide content */}
        <div className="min-h-[360px]">
          <SlideContent compact />
        </div>

        <Navigation size="sm" />
      </div>

      {/* Fullscreen modal */}
      {expanded && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[85vh] rounded-2xl border overflow-hidden bg-card shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-primary/5 to-transparent border-b shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
                  <PresentationIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{presentation.title}</p>
                  <p className="text-xs text-muted-foreground">{presentation.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setExpanded(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <SlideContent />
            </div>
            <Navigation />
          </div>
        </div>
      )}
    </>
  );
}
