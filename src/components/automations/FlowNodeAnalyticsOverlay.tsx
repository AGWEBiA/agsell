import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, LogOut, Target, AlertTriangle } from 'lucide-react';
import type { FlowNodeAnalytic } from '@/hooks/useFlowNodeAnalytics';

interface Props {
  analytics?: FlowNodeAnalytic;
}

export function FlowNodeAnalyticsOverlay({ analytics }: Props) {
  if (!analytics || (analytics.entries_count === 0 && analytics.exits_count === 0)) return null;

  const conversionRate = analytics.entries_count > 0
    ? Math.round((analytics.conversions_count / analytics.entries_count) * 100)
    : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-0.5 text-[10px]">
              <Users className="h-3 w-3 text-blue-500" />
              <span className="font-medium">{analytics.entries_count}</span>
            </div>
            <div className="flex items-center gap-0.5 text-[10px]">
              <LogOut className="h-3 w-3 text-orange-500" />
              <span className="font-medium">{analytics.exits_count}</span>
            </div>
            {analytics.conversions_count > 0 && (
              <div className="flex items-center gap-0.5 text-[10px]">
                <Target className="h-3 w-3 text-green-500" />
                <span className="font-medium">{conversionRate}%</span>
              </div>
            )}
            {analytics.errors_count > 0 && (
              <div className="flex items-center gap-0.5 text-[10px]">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="font-medium">{analytics.errors_count}</span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <p><strong>Entradas:</strong> {analytics.entries_count}</p>
            <p><strong>Saídas:</strong> {analytics.exits_count}</p>
            <p><strong>Conversões:</strong> {analytics.conversions_count} ({conversionRate}%)</p>
            {analytics.errors_count > 0 && <p className="text-red-400"><strong>Erros:</strong> {analytics.errors_count}</p>}
            {analytics.last_triggered_at && (
              <p><strong>Último trigger:</strong> {new Date(analytics.last_triggered_at).toLocaleDateString('pt-BR')}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
