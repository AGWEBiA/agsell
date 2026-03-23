import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Maximize2, X, Monitor } from 'lucide-react';
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
  route?: string; // shows live screenshot
  image?: string; // path to static image
}

export interface TutorialPresentationData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string; // tailwind hsl token e.g. 'primary'
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

  const SlideContent = ({ compact = false }: { compact?: boolean }) => {
    const Icon = slide.icon || presentation.icon;
    return (
      <div className={cn('flex flex-col h-full', compact ? 'p-4' : 'p-6 md:p-8')}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            'flex items-center justify-center rounded-xl bg-primary/10',
            compact ? 'h-8 w-8' : 'h-10 w-10'
          )}>
            <Icon className={cn('text-primary', compact ? 'h-4 w-4' : 'h-5 w-5')} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium">
              Passo {current + 1} de {total}
            </p>
            <h3 className={cn('font-bold truncate', compact ? 'text-base' : 'text-lg')}>
              {slide.title}
            </h3>
          </div>
        </div>

        {slide.subtitle && (
          <p className={cn('text-muted-foreground mb-4', compact ? 'text-xs' : 'text-sm')}>
            {slide.subtitle}
          </p>
        )}

        {/* Bullets */}
        {slide.bullets && slide.bullets.length > 0 && (
          <ul className="space-y-2.5 flex-1">
            {slide.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className={cn(
                  'flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold',
                  compact ? 'h-5 w-5 text-[10px] mt-0.5' : 'h-6 w-6 text-xs'
                )}>
                  {i + 1}
                </span>
                <span className={cn('leading-relaxed', compact ? 'text-xs' : 'text-sm')}
                  dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Route preview */}
        {slide.route && (
          <div className="mt-4 rounded-lg border overflow-hidden bg-muted/20">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b">
              <Monitor className="h-3 w-3 text-muted-foreground" />
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
        {slide.tip && (
          <div className="mt-4 rounded-lg p-3 bg-blue-500/5 border border-blue-500/20">
            <p className={cn(compact ? 'text-xs' : 'text-sm')}>💡 {slide.tip}</p>
          </div>
        )}
        {slide.warning && (
          <div className="mt-4 rounded-lg p-3 bg-amber-500/5 border border-amber-500/20">
            <p className={cn(compact ? 'text-xs' : 'text-sm')}>⚠️ {slide.warning}</p>
          </div>
        )}
      </div>
    );
  };

  const Navigation = ({ size = 'default' }: { size?: 'sm' | 'default' }) => (
    <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20">
      <Button variant="ghost" size={size === 'sm' ? 'sm' : 'default'} onClick={prev} disabled={current === 0}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
      </Button>
      <div className="flex items-center gap-1">
        {presentation.slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'rounded-full transition-all',
              i === current
                ? 'w-6 h-2 bg-primary'
                : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            )}
          />
        ))}
      </div>
      <Button variant="ghost" size={size === 'sm' ? 'sm' : 'default'} onClick={next} disabled={current === total - 1}>
        Próximo <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );

  const PresentationIcon = presentation.icon;

  return (
    <>
      <div className="my-6 rounded-xl border overflow-hidden bg-card shadow-sm">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{presentation.title}</span>
            <span className="text-xs text-muted-foreground">• {total} passos</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setExpanded(true)}>
            <Maximize2 className="h-3 w-3 mr-1" /> Tela cheia
          </Button>
        </div>

        {/* Slide content */}
        <div className="min-h-[340px]">
          <SlideContent compact />
        </div>

        <Navigation size="sm" />
      </div>

      {/* Fullscreen modal */}
      {expanded && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[85vh] rounded-xl border overflow-hidden bg-card shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <PresentationIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{presentation.title}</p>
                  <p className="text-xs text-muted-foreground">{presentation.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(false)}>
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
