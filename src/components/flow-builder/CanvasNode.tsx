import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Settings, X, StickyNote } from 'lucide-react';
import type { FlowNode } from './flowNodeTypes';
import { triggerOptions, actionOptions, conditionOptions, WEEKDAYS } from './flowNodeTypes';

interface CanvasNodeProps {
  node: FlowNode;
  onMouseDown: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPortMouseDown: (port: 'default' | 'yes' | 'no', e: React.MouseEvent) => void;
  onInputMouseUp: () => void;
  isConnecting: boolean;
  analytics?: { entries_count: number; conversions_count: number; errors_count: number };
  onResizeStart?: (e: React.MouseEvent) => void;
}

export function CanvasNode({
  node,
  onMouseDown,
  onEdit,
  onDelete,
  onPortMouseDown,
  onInputMouseUp,
  isConnecting,
  analytics,
  onResizeStart,
}: CanvasNodeProps) {
  if (!node.position) return null;

  const getTriggerInfo = () => triggerOptions.find(t => t.id === node.subtype);
  const getActionInfo = () => [...actionOptions, ...conditionOptions].find(a => a.id === node.subtype);

  const getTypeLabel = () => {
    if (node.type === 'trigger') return 'GATILHO';
    if (['timer', 'warmup'].includes(node.subtype)) return node.subtype === 'timer' ? 'TIMER' : 'AQUECIMENTO';
    if (['tag_filter'].includes(node.subtype)) return 'FILTRO';
    if (['send_email_marketing', 'send_email_performance'].includes(node.subtype)) return 'EMAIL';
    if (node.subtype === 'parallel_channels') return 'PARALELO';
    if (node.subtype === 'voice_torpedo') return 'VOZ';
    if (node.subtype === 'send_voip_call') return 'VOIP';
    if (node.subtype === 'link_split') return 'SPLIT';
    if (node.subtype === 'note') return 'NOTA';
    if (['sequence_transaction', 'sequence_lead', 'sequence_rewarming', 'sequence_optin'].includes(node.subtype)) return 'SEQUÊNCIA';
    if (node.type === 'condition') return 'CONDIÇÃO';
    if (node.type === 'delay') return 'ESPERA';
    return 'AÇÃO';
  };

  const getNodeSummary = () => {
    const c = node.config;
    const statusLabels: Record<string, string> = {
      cart_abandoned: 'Abandonou carrinho', purchase_approved: 'Compra aprovada',
      purchase_completed: 'Compra realizada', boleto_generated: 'Boleto gerado',
      refund: 'Reembolso', new: 'Novo lead', engaged: 'Engajado',
      qualified: 'Qualificado', customer: 'Cliente', inactive: 'Inativo',
    };
    switch (node.subtype) {
      case 'timer':
        if (c.timer_mode === 'specific_date' && c.specific_date) return `Data: ${String(c.specific_date)}`;
        return `${c.duration || 1} ${c.unit === 'hours' ? 'h' : c.unit === 'days' ? 'dias' : 'min'}`;
      case 'warmup': return `${c.leads_per_minute || 1} leads/min`;
      case 'send_email_marketing':
      case 'send_email_performance':
        return c.subject ? `"${String(c.subject)}"` : '';
      case 'sequence_transaction':
        if (c.entry_status || c.exit_status) {
          const entry = statusLabels[String(c.entry_status)] || String(c.entry_status || '');
          const exit = statusLabels[String(c.exit_status)] || String(c.exit_status || '');
          return `${entry} → ${exit}`;
        }
        return '';
      case 'sequence_lead':
        if (c.entry_status) return `${statusLabels[String(c.entry_status)] || String(c.entry_status)} → ${statusLabels[String(c.exit_status)] || String(c.exit_status || '')}`;
        return '';
      case 'sequence_rewarming':
        return c.inactivity_days ? `${c.inactivity_days} dias inativo` : '';
      case 'sequence_optin':
        return c.optin_type === 'double' ? 'Double Opt-in' : 'Single Opt-in';
      default:
        if (c.message) return `"${String(c.message).slice(0, 30)}..."`;
        if (c.tag_name) return `Tag: ${String(c.tag_name)}`;
        return '';
    }
  };

  const info = node.type === 'trigger' ? getTriggerInfo() : getActionInfo();
  if (!info) return null;
  const Icon = info.icon;
  const summary = getNodeSummary();
  const colorClass = node.type === 'trigger' ? `bg-gradient-to-br ${(info as any).color}` : (info as any).color;
  const isCondition = node.type === 'condition';
  const NODE_WIDTH = 220;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete();
  };

  const handleDeleteMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit();
  };

  const handleSettingsMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Note node special rendering — sticky annotation (like n8n), NOT connectable
  if (node.subtype === 'note') {
    const noteColorMap: Record<string, { bg: string; border: string; text: string }> = {
      yellow: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)', text: 'rgba(250,204,21,0.9)' },
      green: { bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.4)', text: 'rgba(74,222,128,0.9)' },
      blue: { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', text: 'rgba(96,165,250,0.9)' },
      pink: { bg: 'rgba(244,114,182,0.15)', border: 'rgba(244,114,182,0.4)', text: 'rgba(244,114,182,0.9)' },
      red: { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)', text: 'rgba(248,113,113,0.9)' },
      purple: { bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.4)', text: 'rgba(192,132,252,0.9)' },
    };
    const colorKey = (node.config.color as string) || 'yellow';
    const colors = noteColorMap[colorKey] || noteColorMap.yellow;
    const noteW = (node.config.width as number) || 260;
    const noteH = (node.config.height as number) || 120;

    return (
      <div
        className="absolute select-none group"
        style={{
          left: node.position.x,
          top: node.position.y,
          width: noteW,
          height: noteH,
          zIndex: 0,
        }}
      >
        <div
          className="w-full h-full rounded-xl cursor-move relative"
          style={{
            backgroundColor: colors.bg,
            border: `2px solid ${colors.border}`,
          }}
          onMouseDown={onMouseDown}
          onDoubleClick={onEdit}
        >
          {/* Delete button */}
          <button
            onClick={handleDeleteClick}
            onMouseDown={handleDeleteMouseDown}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20"
          >
            <X className="h-3 w-3" />
          </button>
          {/* Settings button */}
          <button
            onClick={handleSettingsClick}
            onMouseDown={handleSettingsMouseDown}
            className="absolute top-2 right-2 h-6 w-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
          >
            <Settings className="h-3.5 w-3.5" style={{ color: colors.text }} />
          </button>
          {/* Content */}
          <div className="p-3 h-full flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <StickyNote className="h-3.5 w-3.5" style={{ color: colors.text }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.text }}>Nota</span>
            </div>
            <p className="text-xs text-white/70 flex-1 overflow-hidden leading-relaxed">
              {node.config.text ? String(node.config.text) : 'Duplo clique para editar...'}
            </p>
          </div>
          {/* Resize handle — bottom-right corner */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart?.(e);
            }}
            style={{ borderRight: `3px solid ${colors.border}`, borderBottom: `3px solid ${colors.border}`, borderRadius: '0 0 10px 0' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute select-none"
      style={{ left: node.position.x, top: node.position.y, width: NODE_WIDTH }}
    >
      {/* Input port */}
      <div
        className={cn("absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full border-2 flex items-center justify-center z-10 transition-all",
          isConnecting ? "border-primary bg-primary/30 scale-125 cursor-crosshair" : "border-white/20 bg-[#1a1a2e]"
        )}
        onMouseUp={onInputMouseUp}
      >
        <div className="h-2 w-2 rounded-full bg-white/40" />
      </div>

      {/* Node body */}
      <div
        className={cn(
          'relative rounded-xl border hover:border-white/25 bg-[#222240] p-3 cursor-move group transition-colors shadow-lg',
          node.type === 'trigger' ? 'border-2 p-[2px]' : 'border-white/10',
          node.type === 'trigger' && `bg-gradient-to-r ${(info as any).color}`
        )}
        onMouseDown={onMouseDown}
        onDoubleClick={onEdit}
      >
        {/* Delete button - positioned relative to node body */}
        <button
          onClick={handleDeleteClick}
          onMouseDown={handleDeleteMouseDown}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20"
        >
          <X className="h-3 w-3" />
        </button>

        {node.type === 'trigger' ? (
          <div className="bg-[#222240] rounded-[10px] p-3">
            <InnerContent />
          </div>
        ) : (
          <InnerContent />
        )}
      </div>

      {/* Output ports */}
      {isCondition ? (
        <div className="flex justify-between px-8 mt-1">
          <div
            className="flex flex-col items-center gap-0.5 cursor-crosshair"
            onMouseDown={(e) => onPortMouseDown('yes', e)}
          >
            <div className="h-5 w-5 rounded-full border-2 border-green-500/50 bg-[#1a1a2e] flex items-center justify-center hover:border-green-400 hover:bg-green-500/20 transition-all">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            </div>
            <span className="text-[9px] text-green-400/70">Sim</span>
          </div>
          <div
            className="flex flex-col items-center gap-0.5 cursor-crosshair"
            onMouseDown={(e) => onPortMouseDown('no', e)}
          >
            <div className="h-5 w-5 rounded-full border-2 border-red-500/50 bg-[#1a1a2e] flex items-center justify-center hover:border-red-400 hover:bg-red-500/20 transition-all">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
            </div>
            <span className="text-[9px] text-red-400/70">Não</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-center mt-1">
          <div
            className="h-5 w-5 rounded-full border-2 border-white/20 bg-[#1a1a2e] flex items-center justify-center cursor-crosshair hover:border-primary hover:bg-primary/20 transition-all"
            onMouseDown={(e) => onPortMouseDown('default', e)}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      )}
    </div>
  );

  function InnerContent() {
    return (
      <>
        <div className="flex items-center gap-2">
          <div className={cn('flex items-center justify-center h-8 w-8 rounded-lg shadow-md shrink-0', node.type === 'trigger' ? `bg-gradient-to-br text-white ${(info as any).color}` : colorClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[8px] px-1 py-0 border-white/20 text-white/60">{getTypeLabel()}</Badge>
            </div>
            <p className="font-semibold text-xs mt-0.5 text-white truncate">{info.label}</p>
            {summary && <p className="text-[10px] text-white/50 mt-0.5 truncate">{summary}</p>}
          </div>
          <button
            onClick={handleSettingsClick}
            onMouseDown={handleSettingsMouseDown}
            className="h-6 w-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-white/10"
            title="Configurar"
          >
            <Settings className="h-3.5 w-3.5 text-white/50 hover:text-white" />
          </button>
        </div>
        {isCondition && (
          <div className="mt-2 flex gap-1.5 text-[10px]">
            <div className="flex-1 rounded-md bg-green-900/30 p-1.5 text-center text-green-400 border border-green-700/30">✅ Sim</div>
            <div className="flex-1 rounded-md bg-red-900/30 p-1.5 text-center text-red-400 border border-red-700/30">❌ Não</div>
          </div>
        )}
        {analytics && (
          <div className="flex gap-1 mt-1.5">
            <Badge className="text-[8px] px-1 py-0 bg-green-500/20 text-green-400 border-green-500/30">{analytics.entries_count}</Badge>
            <Badge className="text-[8px] px-1 py-0 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{analytics.conversions_count}</Badge>
            <Badge className="text-[8px] px-1 py-0 bg-red-500/20 text-red-400 border-red-500/30">{analytics.errors_count}</Badge>
          </div>
        )}
      </>
    );
  }
}
