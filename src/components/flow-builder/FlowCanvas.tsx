import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { FlowNode, FlowConnection, FlowNodePosition } from './flowNodeTypes';
import { triggerOptions, actionOptions, conditionOptions } from './flowNodeTypes';
import { CanvasNode } from './CanvasNode';
import { Badge } from '@/components/ui/badge';
import {
  Settings, X, Plus,
} from 'lucide-react';

interface FlowCanvasProps {
  nodes: FlowNode[];
  connections: FlowConnection[];
  onNodesChange: React.Dispatch<React.SetStateAction<FlowNode[]>>;
  onConnectionsChange: React.Dispatch<React.SetStateAction<FlowConnection[]>>;
  onEditNode: (node: FlowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  analytics?: Array<{ node_id: string; entries_count: number; conversions_count: number; errors_count: number }>;
  sidebarDragPayload?: { nodeType: FlowNode['type']; subtype: string } | null;
  onSidebarDragConsume?: () => void;
  nodeScale?: number;
  onNodeScaleChange?: (scale: number) => void;
}

export function FlowCanvas({
  nodes,
  connections,
  onNodesChange,
  onConnectionsChange,
  onEditNode,
  onDeleteNode,
  analytics,
  sidebarDragPayload,
  onSidebarDragConsume,
  nodeScale = 1,
  onNodeScaleChange,
}: FlowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Canvas transform state
  const [offset, setOffset] = useState<FlowNodePosition>({ x: 50, y: 50 });
  const [scale, setScale] = useState(1);

  // Dragging states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<FlowNodePosition>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragNodeStart, setDragNodeStart] = useState<{ nodePos: FlowNodePosition; mousePos: FlowNodePosition } | null>(null);

  // Resize state for note nodes
  const [resizingNodeId, setResizingNodeId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ w: number; h: number; mouseX: number; mouseY: number } | null>(null);

  // Connection drawing
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; port: 'default' | 'yes' | 'no' } | null>(null);
  const [connectingMouse, setConnectingMouse] = useState<FlowNodePosition>({ x: 0, y: 0 });

  // Sidebar drag-drop onto canvas
  const [dragOverCanvas, setDragOverCanvas] = useState(false);

  const screenToCanvas = useCallback((screenX: number, screenY: number): FlowNodePosition => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (screenX - rect.left - offset.x) / scale,
      y: (screenY - rect.top - offset.y) / scale,
    };
  }, [offset, scale]);

  // Pan
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current && e.target !== svgRef.current) return;
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    if (draggingNodeId && dragNodeStart) {
      const dx = (e.clientX - dragNodeStart.mousePos.x) / scale;
      const dy = (e.clientY - dragNodeStart.mousePos.y) / scale;
      onNodesChange(currentNodes => currentNodes.map(n =>
        n.id === draggingNodeId
          ? { ...n, position: { x: dragNodeStart.nodePos.x + dx, y: dragNodeStart.nodePos.y + dy } }
          : n
      ));
    }
    if (resizingNodeId && resizeStart) {
      const dx = (e.clientX - resizeStart.mouseX) / scale;
      const dy = (e.clientY - resizeStart.mouseY) / scale;
      const newW = Math.max(160, resizeStart.w + dx);
      const newH = Math.max(80, resizeStart.h + dy);
      onNodesChange(currentNodes => currentNodes.map(n =>
        n.id === resizingNodeId
          ? { ...n, config: { ...n.config, width: newW, height: newH } }
          : n
      ));
    }
    if (connectingFrom) {
      setConnectingMouse(screenToCanvas(e.clientX, e.clientY));
    }
  }, [isPanning, panStart, draggingNodeId, dragNodeStart, scale, onNodesChange, connectingFrom, screenToCanvas, resizingNodeId, resizeStart]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setDragNodeStart(null);
    setResizingNodeId(null);
    setResizeStart(null);
    if (connectingFrom) {
      setConnectingFrom(null);
    }
  }, [connectingFrom]);

  // Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.2), 3);
    const ratio = newScale / scale;
    setScale(newScale);
    setOffset({
      x: mouseX - (mouseX - offset.x) * ratio,
      y: mouseY - (mouseY - offset.y) * ratio,
    });
  }, [scale, offset]);

  // Node drag start
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node?.position) return;
    setDraggingNodeId(nodeId);
    setDragNodeStart({
      nodePos: { ...node.position },
      mousePos: { x: e.clientX, y: e.clientY },
    });
  }, [nodes]);

  // Connection port handlers
  const handlePortMouseDown = useCallback((nodeId: string, port: 'default' | 'yes' | 'no', e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingFrom({ nodeId, port });
    setConnectingMouse(screenToCanvas(e.clientX, e.clientY));
  }, [screenToCanvas]);

  const handleNodeInputDrop = useCallback((targetNodeId: string) => {
    if (!connectingFrom || connectingFrom.nodeId === targetNodeId) return;
    onConnectionsChange(currentConnections => {
      const exists = currentConnections.some(c => c.from === connectingFrom.nodeId && c.fromPort === connectingFrom.port && c.to === targetNodeId);
      if (exists) return currentConnections;

      const newConn: FlowConnection = {
        id: crypto.randomUUID(),
        from: connectingFrom.nodeId,
        to: targetNodeId,
        fromPort: connectingFrom.port,
      };

      return [...currentConnections, newConn];
    });
    setConnectingFrom(null);
  }, [connectingFrom, onConnectionsChange]);

  // Drop from sidebar
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCanvas(false);

    // Try multiple data transfer formats
    let raw = '';
    try {
      raw = e.dataTransfer.getData('application/flow-node');
    } catch {}
    if (!raw) {
      try {
        raw = e.dataTransfer.getData('text/plain');
      } catch {}
    }
    if (!raw) {
      try {
        raw = e.dataTransfer.getData('text');
      } catch {}
    }

    let droppedNode: { nodeType: FlowNode['type']; subtype: string } | null = null;

    try {
      if (raw) {
        const parsed = JSON.parse(raw) as { nodeType: FlowNode['type']; subtype: string };
        if (parsed?.nodeType && parsed?.subtype) {
          droppedNode = parsed;
        }
      }
    } catch {
      console.warn('[FlowCanvas] Failed to parse drop data:', raw);
    }

    // Fallback to sidebar payload state
    if (!droppedNode && sidebarDragPayload) {
      droppedNode = sidebarDragPayload;
    }

    if (!droppedNode) {
      console.warn('[FlowCanvas] Drop event received but no valid payload found');
      return;
    }

    const info = [...actionOptions, ...conditionOptions, ...triggerOptions].find(a => a.id === droppedNode?.subtype);
    if (!info) {
      console.warn('[FlowCanvas] Unknown subtype:', droppedNode.subtype);
      return;
    }

    const pos = screenToCanvas(e.clientX, e.clientY);
    const newNode: FlowNode = {
      id: crypto.randomUUID(),
      type: droppedNode.nodeType,
      subtype: droppedNode.subtype,
      label: info.label,
      config: {},
      position: { x: pos.x - 90, y: pos.y - 30 },
    };
    onNodesChange(currentNodes => [...currentNodes, newNode]);
    onSidebarDragConsume?.();
  }, [screenToCanvas, onNodesChange, onSidebarDragConsume, sidebarDragPayload]);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragOverCanvas) setDragOverCanvas(true);
  }, [dragOverCanvas]);

  const handleDeleteConnection = useCallback((connId: string) => {
    onConnectionsChange(currentConnections => currentConnections.filter(c => c.id !== connId));
  }, [onConnectionsChange]);

  // Get node center positions for connection rendering
  const getNodePort = (nodeId: string, port: 'input' | 'default' | 'yes' | 'no'): FlowNodePosition => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node?.position) return { x: 0, y: 0 };
    
    // Width is constant
    const w = Math.round(180 * nodeScale);
    
    // Approximate height based on CanvasNode rendering logic
    let h = 70; // Base height
    if (node.type === 'condition') h = 100; // Conditions are taller
    if (node.config.groups || node.config.group_jid || node.config.message) h += 10; // Extra line for summary
    
    // Scale the approximate height
    const scaledH = Math.round(h * nodeScale);
    
    if (port === 'input') return { x: node.position.x + w / 2, y: node.position.y };
    if (port === 'yes') return { x: node.position.x + w * 0.2, y: node.position.y + scaledH };
    if (port === 'no') return { x: node.position.x + w * 0.8, y: node.position.y + scaledH };
    return { x: node.position.x + w / 2, y: node.position.y + scaledH };
  };

  const renderConnectionPath = (from: FlowNodePosition, to: FlowNodePosition) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const cy = Math.max(Math.abs(dy) * 0.5, 50);
    return `M ${from.x} ${from.y} C ${from.x} ${from.y + cy}, ${to.x} ${to.y - cy}, ${to.x} ${to.y}`;
  };

  return (
    <div
      ref={canvasRef}
      className={cn(
        "absolute inset-0 overflow-hidden cursor-grab bg-[#1a1a2e]",
        isPanning && "cursor-grabbing",
        dragOverCanvas && "ring-2 ring-primary ring-inset"
      )}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
        backgroundSize: `${24 * scale}px ${24 * scale}px`,
        backgroundPosition: `${offset.x}px ${offset.y}px`,
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onWheel={handleWheel}
      onDrop={handleCanvasDrop}
      onDragOver={handleCanvasDragOver}
      onDragLeave={() => setDragOverCanvas(false)}
    >
      {/* Transform layer — drops handled by outer canvas div only */}
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1px',
          height: '1px',
          overflow: 'visible',
        }}
      >
        {/* SVG connections layer */}
        <svg
          ref={svgRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: '1px', height: '1px', overflow: 'visible' }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(139,92,246,0.6)" />
            </marker>
          </defs>
          {/* Existing connections */}
          {connections.map(conn => {
            const from = getNodePort(conn.from, conn.fromPort);
            const to = getNodePort(conn.to, 'input');
            return (
              <g key={conn.id} className="pointer-events-auto cursor-pointer" onClick={() => handleDeleteConnection(conn.id)}>
                <path
                  d={renderConnectionPath(from, to)}
                  fill="none"
                  stroke="rgba(139,92,246,0.4)"
                  strokeWidth={2.5}
                  markerEnd="url(#arrowhead)"
                  className="hover:stroke-primary transition-colors"
                />
                {/* Invisible wider path for easier clicking */}
                <path
                  d={renderConnectionPath(from, to)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                />
                {conn.fromPort !== 'default' && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 8}
                    fill={conn.fromPort === 'yes' ? '#4ade80' : '#f87171'}
                    fontSize={11}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    {conn.fromPort === 'yes' ? '✅ Sim' : '❌ Não'}
                  </text>
                )}
              </g>
            );
          })}
          {/* Active connection being drawn */}
          {connectingFrom && (() => {
            const from = getNodePort(connectingFrom.nodeId, connectingFrom.port);
            return (
              <path
                d={renderConnectionPath(from, connectingMouse)}
                fill="none"
                stroke="rgba(139,92,246,0.6)"
                strokeWidth={2}
                strokeDasharray="8 4"
              />
            );
          })()}
        </svg>

        {/* Notes rendered first (behind other nodes) */}
        {nodes.filter(n => n.subtype === 'note').map(node => (
          <CanvasNode
            key={node.id}
            node={node}
            nodeScale={nodeScale}
            onMouseDown={(e) => handleNodeDragStart(node.id, e)}
            onEdit={() => onEditNode(node)}
            onDelete={() => onDeleteNode(node.id)}
            onPortMouseDown={() => {}}
            onInputMouseUp={() => {}}
            isConnecting={false}
            onResizeStart={(e) => {
              setResizingNodeId(node.id);
              setResizeStart({
                w: (node.config.width as number) || 260,
                h: (node.config.height as number) || 120,
                mouseX: e.clientX,
                mouseY: e.clientY,
              });
            }}
          />
        ))}
        {/* Regular nodes */}
        {nodes.filter(n => n.subtype !== 'note').map(node => (
          <CanvasNode
            key={node.id}
            node={node}
            nodeScale={nodeScale}
            onMouseDown={(e) => handleNodeDragStart(node.id, e)}
            onEdit={() => onEditNode(node)}
            onDelete={() => onDeleteNode(node.id)}
            onPortMouseDown={(port, e) => handlePortMouseDown(node.id, port, e)}
            onInputMouseUp={() => handleNodeInputDrop(node.id)}
            isConnecting={!!connectingFrom}
            analytics={analytics?.find(a => a.node_id === node.id)}
          />
        ))}
      </div>

      {/* Zoom & node scale controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-[#222240] rounded-lg p-1 border border-white/10 z-10">
        <button onClick={() => { setScale(s => Math.max(0.2, s - 0.1)); }} className="px-2 py-1 text-white/60 hover:text-white text-sm">−</button>
        <span className="text-white/50 text-xs min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
        <button onClick={() => { setScale(s => Math.min(3, s + 0.1)); }} className="px-2 py-1 text-white/60 hover:text-white text-sm">+</button>
        <button onClick={() => { setScale(1); setOffset({ x: 100, y: 100 }); }} className="px-2 py-1 text-white/40 hover:text-white text-[10px] border-l border-white/10">Reset</button>
        {onNodeScaleChange && (
          <>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <span className="text-white/30 text-[9px] uppercase tracking-wider">Nós</span>
            <button onClick={() => onNodeScaleChange(Math.max(0.6, nodeScale - 0.1))} className="px-1.5 py-1 text-white/60 hover:text-white text-sm">−</button>
            <span className="text-white/50 text-[10px] min-w-[28px] text-center">{Math.round(nodeScale * 100)}%</span>
            <button onClick={() => onNodeScaleChange(Math.min(1.5, nodeScale + 0.1))} className="px-1.5 py-1 text-white/60 hover:text-white text-sm">+</button>
          </>
        )}
      </div>

      {/* Instructions overlay */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <p className="text-white/60 text-lg font-semibold">Arraste um gatilho da barra lateral</p>
            <p className="text-white/40 text-sm mt-1">ou clique em um gatilho para começar</p>
          </div>
        </div>
      )}
    </div>
  );
}
