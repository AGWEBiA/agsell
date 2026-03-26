import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Type, Image, Square, Link2, List, Minus, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Palette, Eye, Code, Trash2, GripVertical, Plus,
  ChevronUp, ChevronDown, Video, Quote, ListOrdered, Table, Star, MapPin,
  Clock, Share2, Users, Heading1, Heading2, LayoutGrid, Copy, Strikethrough,
  CaseSensitive, Paintbrush, BoxSelect, AlignJustify, Maximize2, LetterText,
} from 'lucide-react';

type BlockType = 'text' | 'heading' | 'image' | 'button' | 'divider' | 'spacer' | 'columns' | 'video' | 'social' | 'quote' | 'list' | 'timer' | 'html' | 'table';

interface Block {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
}

interface EmailTemplateEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const FONT_FAMILIES = [
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: "'Trebuchet MS', Helvetica, sans-serif", label: 'Trebuchet MS' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: "'Courier New', Courier, monospace", label: 'Courier New' },
  { value: "'Lucida Console', Monaco, monospace", label: 'Lucida Console' },
  { value: "Impact, Charcoal, sans-serif", label: 'Impact' },
  { value: "'Comic Sans MS', cursive, sans-serif", label: 'Comic Sans' },
];

const FONT_SIZES = ['10px', '11px', '12px', '13px', '14px', '15px', '16px', '18px', '20px', '22px', '24px', '28px', '32px', '36px', '42px', '48px'];

const blockCategories = [
  {
    label: 'Conteúdo',
    blocks: [
      { type: 'heading' as BlockType, label: 'Título', icon: Heading1 },
      { type: 'text' as BlockType, label: 'Texto', icon: Type },
      { type: 'image' as BlockType, label: 'Imagem', icon: Image },
      { type: 'video' as BlockType, label: 'Vídeo', icon: Video },
      { type: 'quote' as BlockType, label: 'Citação', icon: Quote },
      { type: 'list' as BlockType, label: 'Lista', icon: List },
      { type: 'table' as BlockType, label: 'Tabela', icon: Table },
    ],
  },
  {
    label: 'Ação',
    blocks: [
      { type: 'button' as BlockType, label: 'Botão', icon: Square },
      { type: 'social' as BlockType, label: 'Redes Sociais', icon: Share2 },
      { type: 'timer' as BlockType, label: 'Countdown', icon: Clock },
    ],
  },
  {
    label: 'Layout',
    blocks: [
      { type: 'divider' as BlockType, label: 'Divisor', icon: Minus },
      { type: 'spacer' as BlockType, label: 'Espaço', icon: LayoutGrid },
      { type: 'columns' as BlockType, label: 'Colunas', icon: LayoutGrid },
      { type: 'html' as BlockType, label: 'HTML', icon: Code },
    ],
  },
];

const presetTemplates = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    description: 'Email de boas-vindas para novos leads',
    blocks: [
      { id: '1', type: 'image' as BlockType, content: { src: '', alt: 'Logo', align: 'center', width: '200px' } },
      { id: '2', type: 'heading' as BlockType, content: { text: 'Olá {{nome}}, seja bem-vindo!', align: 'center', level: 'h1', color: '#1a1a2e', fontFamily: 'Arial, Helvetica, sans-serif' } },
      { id: '3', type: 'text' as BlockType, content: { text: 'Estamos muito felizes em ter você conosco. Explore nossos recursos e descubra como podemos ajudar você a alcançar seus objetivos.', align: 'center', fontSize: '16px', lineHeight: '1.6' } },
      { id: '4', type: 'button' as BlockType, content: { text: 'Começar Agora', url: '#', align: 'center', bgColor: '#3B82F6', textColor: '#FFFFFF', borderRadius: '8px', fullWidth: false } },
      { id: '5', type: 'divider' as BlockType, content: { color: '#E5E7EB', style: 'solid', thickness: '1px' } },
      { id: '6', type: 'text' as BlockType, content: { text: 'Abraços,\nEquipe AG Sell', align: 'left', fontSize: '14px' } },
    ],
  },
  {
    id: 'promotion',
    name: 'Promoção',
    description: 'Email promocional com desconto',
    blocks: [
      { id: '1', type: 'image' as BlockType, content: { src: '', alt: 'Banner', align: 'center', width: '100%' } },
      { id: '2', type: 'heading' as BlockType, content: { text: '🎉 OFERTA ESPECIAL 🎉', align: 'center', level: 'h1', color: '#dc2626' } },
      { id: '3', type: 'text' as BlockType, content: { text: 'Por tempo limitado, aproveite 50% de desconto em todos os planos!', align: 'center', fontSize: '18px', lineHeight: '1.5' } },
      { id: '4', type: 'timer' as BlockType, content: { endDate: '', label: 'Oferta expira em:', align: 'center' } },
      { id: '5', type: 'button' as BlockType, content: { text: 'Aproveitar Desconto', url: '#', align: 'center', bgColor: '#22C55E', textColor: '#FFFFFF', borderRadius: '8px', fullWidth: true } },
      { id: '6', type: 'text' as BlockType, content: { text: '*Oferta válida até o final do mês', align: 'center', fontSize: '12px', color: '#666' } },
    ],
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Newsletter mensal',
    blocks: [
      { id: '1', type: 'heading' as BlockType, content: { text: 'Newsletter - {{mes}} {{ano}}', align: 'center', level: 'h1', color: '#1a1a2e' } },
      { id: '2', type: 'divider' as BlockType, content: { color: '#3B82F6', style: 'solid', thickness: '3px' } },
      { id: '3', type: 'heading' as BlockType, content: { text: '📢 Novidades do Mês', align: 'left', level: 'h2', color: '#1a1a2e' } },
      { id: '4', type: 'text' as BlockType, content: { text: 'Aqui está um resumo das principais novidades e atualizações da nossa plataforma.', align: 'left', fontSize: '16px', lineHeight: '1.6' } },
      { id: '5', type: 'spacer' as BlockType, content: { height: '20px' } },
      { id: '6', type: 'heading' as BlockType, content: { text: '💡 Dicas da Semana', align: 'left', level: 'h2', color: '#1a1a2e' } },
      { id: '7', type: 'list' as BlockType, content: { items: ['Otimize suas automações', 'Segmente seus contatos', 'Acompanhe as métricas'], ordered: false } },
      { id: '8', type: 'button' as BlockType, content: { text: 'Ler Mais no Blog', url: '#', align: 'center', bgColor: '#3B82F6', textColor: '#FFFFFF', borderRadius: '8px' } },
      { id: '9', type: 'divider' as BlockType, content: { color: '#E5E7EB', style: 'solid', thickness: '1px' } },
      { id: '10', type: 'social' as BlockType, content: { align: 'center', instagram: '#', facebook: '#', linkedin: '#', youtube: '#' } },
    ],
  },
  {
    id: 'abandoned-cart',
    name: 'Carrinho Abandonado',
    description: 'Recuperar vendas de carrinho abandonado',
    blocks: [
      { id: '1', type: 'heading' as BlockType, content: { text: 'Você esqueceu algo! 🛒', align: 'center', level: 'h1', color: '#1a1a2e' } },
      { id: '2', type: 'text' as BlockType, content: { text: 'Olá {{nome}}, notamos que você deixou itens no carrinho. Finalize sua compra agora e aproveite condições especiais!', align: 'center', fontSize: '16px', lineHeight: '1.6' } },
      { id: '3', type: 'spacer' as BlockType, content: { height: '16px' } },
      { id: '4', type: 'button' as BlockType, content: { text: 'Finalizar Compra', url: '#', align: 'center', bgColor: '#F59E0B', textColor: '#000000', borderRadius: '8px', fullWidth: true } },
      { id: '5', type: 'spacer' as BlockType, content: { height: '12px' } },
      { id: '6', type: 'text' as BlockType, content: { text: 'Seu carrinho será mantido por mais 24h.', align: 'center', fontSize: '13px', color: '#999' } },
    ],
  },
  {
    id: 'event-invite',
    name: 'Convite para Evento',
    description: 'Convite para webinar ou evento',
    blocks: [
      { id: '1', type: 'image' as BlockType, content: { src: '', alt: 'Banner do Evento', align: 'center', width: '100%' } },
      { id: '2', type: 'heading' as BlockType, content: { text: 'Você está convidado! 🎤', align: 'center', level: 'h1', color: '#7c3aed' } },
      { id: '3', type: 'text' as BlockType, content: { text: 'Participe do nosso webinar exclusivo sobre estratégias de marketing digital e vendas.', align: 'center', fontSize: '16px', lineHeight: '1.6' } },
      { id: '4', type: 'quote' as BlockType, content: { text: '📅 Data: DD/MM/AAAA às 19h\n📍 Online via Zoom\n⏰ Duração: 1h30', borderColor: '#7c3aed' } },
      { id: '5', type: 'button' as BlockType, content: { text: 'Garantir Minha Vaga', url: '#', align: 'center', bgColor: '#7c3aed', textColor: '#FFFFFF', borderRadius: '8px' } },
    ],
  },
];

export function EmailTemplateEditor({ content, onChange }: EmailTemplateEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    try { return JSON.parse(content) || []; } catch { return []; }
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'code'>('edit');
  const [globalSettings, setGlobalSettings] = useState({
    bgColor: '#ffffff',
    contentBgColor: '#ffffff',
    contentWidth: '600px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    padding: '20px',
  });

  const updateBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    onChange(JSON.stringify(newBlocks));
  };

  const addBlock = (type: BlockType) => {
    const newBlock: Block = { id: crypto.randomUUID(), type, content: getDefaultContent(type) };
    updateBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const duplicateBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const newBlock = { ...block, id: crypto.randomUUID(), content: { ...block.content } };
    const idx = blocks.findIndex(b => b.id === blockId);
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, newBlock);
    updateBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const getDefaultContent = (type: BlockType): Record<string, unknown> => {
    switch (type) {
      case 'heading': return { text: 'Seu título aqui', align: 'center', level: 'h1', color: '#1a1a2e', fontFamily: '', letterSpacing: '0px', textTransform: 'none', bgColor: '', padding: '0px', borderRadius: '0px' };
      case 'text': return { text: 'Digite seu texto aqui...', align: 'left', fontSize: '16px', lineHeight: '1.6', color: '#333333', bold: false, italic: false, underline: false, strikethrough: false, textTransform: 'none', fontFamily: '', letterSpacing: '0px', bgColor: '', padding: '0px', borderRadius: '0px', borderColor: '', borderWidth: '0px', borderStyle: 'none' };
      case 'image': return { src: '', alt: 'Imagem', align: 'center', width: '100%', link: '', borderRadius: '0px', shadow: false, border: false, borderColor: '#E5E7EB' };
      case 'video': return { url: '', thumbnailUrl: '', align: 'center' };
      case 'button': return { text: 'Clique Aqui', url: '#', align: 'center', bgColor: '#3B82F6', textColor: '#FFFFFF', borderRadius: '8px', fullWidth: false, size: 'md', fontFamily: '', fontWeight: 'bold', borderColor: '', borderWidth: '0px', shadow: false, letterSpacing: '0px', textTransform: 'none' };
      case 'divider': return { color: '#E5E7EB', style: 'solid', thickness: '1px', width: '100%', align: 'center' };
      case 'spacer': return { height: '20px' };
      case 'columns': return { columns: 2, gap: '16px' };
      case 'quote': return { text: 'Sua citação aqui...', borderColor: '#3B82F6', bgColor: '#F8FAFC', fontStyle: 'italic', fontSize: '15px', color: '#555555', padding: '12px 16px', borderRadius: '0 8px 8px 0', borderWidth: '4px' };
      case 'list': return { items: ['Item 1', 'Item 2', 'Item 3'], ordered: false, fontSize: '15px', color: '#333333', lineHeight: '1.6', fontFamily: '', bulletColor: '#3B82F6' };
      case 'social': return { align: 'center', instagram: '', facebook: '', linkedin: '', youtube: '', twitter: '', tiktok: '', whatsapp: '', style: 'text', bgColor: '' };
      case 'timer': return { endDate: '', label: 'Oferta expira em:', align: 'center', bgColor: '#FEF3C7', textColor: '#92400E', numberBgColor: '#FDE68A', numberColor: '#78350F' };
      case 'html': return { code: '<div style="text-align:center;">HTML personalizado</div>' };
      case 'table': return { rows: 3, cols: 2, headers: ['Coluna 1', 'Coluna 2'], data: [['Dado 1', 'Dado 2'], ['Dado 3', 'Dado 4']], headerBgColor: '#3B82F6', headerTextColor: '#FFFFFF', borderColor: '#E5E7EB', stripedRows: true, fontSize: '14px' };
      default: return {};
    }
  };

  const updateBlockContent = (blockId: string, newContent: Record<string, unknown>) => {
    updateBlocks(blocks.map(b => b.id === blockId ? { ...b, content: { ...b.content, ...newContent } } : b));
  };

  const removeBlock = (blockId: string) => {
    updateBlocks(blocks.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return;
    const newBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    updateBlocks(newBlocks);
  };

  const loadTemplate = (templateId: string) => {
    const template = presetTemplates.find(t => t.id === templateId);
    if (template) updateBlocks(template.blocks.map(b => ({ ...b, id: crypto.randomUUID() })));
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const renderBlockPreview = (block: Block) => {
    const c = block.content;
    const blockBgStyle: React.CSSProperties = c.bgColor ? { backgroundColor: c.bgColor as string, padding: (c.padding as string) || '0px', borderRadius: (c.borderRadius as string) || '0px' } : {};
    const blockBorderStyle: React.CSSProperties = c.borderStyle && c.borderStyle !== 'none' ? { border: `${c.borderWidth || '1px'} ${c.borderStyle} ${c.borderColor || '#E5E7EB'}` } : {};

    switch (block.type) {
      case 'heading': {
        const Tag = (c.level as string) === 'h2' ? 'h2' : (c.level as string) === 'h3' ? 'h3' : 'h1';
        const sizes = { h1: '28px', h2: '22px', h3: '18px' };
        return <Tag style={{ textAlign: (c.align as any) || 'center', color: (c.color as string) || '#1a1a2e', fontSize: sizes[(c.level as string) as keyof typeof sizes] || '28px', fontWeight: 'bold', margin: '8px 0', fontFamily: (c.fontFamily as string) || undefined, letterSpacing: (c.letterSpacing as string) || undefined, textTransform: (c.textTransform as any) || undefined, ...blockBgStyle }}>{(c.text as string) || 'Título'}</Tag>;
      }
      case 'text': {
        const style: React.CSSProperties = {
          textAlign: (c.align as any) || 'left',
          fontSize: (c.fontSize as string) || '16px',
          fontWeight: c.bold ? 'bold' : 'normal',
          fontStyle: c.italic ? 'italic' : 'normal',
          textDecoration: [c.underline && 'underline', c.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
          color: (c.color as string) || '#333',
          lineHeight: (c.lineHeight as string) || '1.6',
          fontFamily: (c.fontFamily as string) || undefined,
          letterSpacing: (c.letterSpacing as string) || undefined,
          textTransform: (c.textTransform as any) || undefined,
          ...blockBgStyle,
          ...blockBorderStyle,
        };
        return <div style={style} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(((c.text as string) || '').replace(/\n/g, '<br>'), { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 's', 'del'], ALLOWED_ATTR: ['href', 'target', 'style'] }) }} />;
      }
      case 'image': {
        const imgStyle: React.CSSProperties = {
          maxWidth: (c.width as string) || '100%',
          display: 'inline-block',
          borderRadius: (c.borderRadius as string) || '0px',
          boxShadow: c.shadow ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
          border: c.border ? `2px solid ${(c.borderColor as string) || '#E5E7EB'}` : undefined,
        };
        return (
          <div style={{ textAlign: (c.align as any) || 'center' }}>
            {c.src ? (
              <img src={c.src as string} alt={c.alt as string} style={imgStyle} />
            ) : (
              <div className="bg-muted h-40 flex flex-col items-center justify-center rounded-md gap-2">
                <Image className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Insira a URL da imagem</span>
              </div>
            )}
          </div>
        );
      }
      case 'video':
        return (
          <div style={{ textAlign: (c.align as any) || 'center' }}>
            {c.url ? (
              <div className="bg-muted rounded-md p-4 flex flex-col items-center gap-2">
                <Video className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate max-w-full">{c.url as string}</span>
                <span className="text-[10px] text-muted-foreground">O vídeo será exibido como thumbnail com link</span>
              </div>
            ) : (
              <div className="bg-muted h-32 flex flex-col items-center justify-center rounded-md gap-2">
                <Video className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Insira a URL do vídeo</span>
              </div>
            )}
          </div>
        );
      case 'button': {
        const btnSize = { sm: '8px 16px', md: '12px 24px', lg: '16px 32px' };
        return (
          <div style={{ textAlign: (c.align as any) || 'center' }}>
            <button style={{
              backgroundColor: (c.bgColor as string) || '#3B82F6',
              color: (c.textColor as string) || '#FFFFFF',
              padding: btnSize[(c.size as string) as keyof typeof btnSize] || '12px 24px',
              borderRadius: (c.borderRadius as string) || '8px',
              border: c.borderColor ? `${(c.borderWidth as string) || '2px'} solid ${c.borderColor as string}` : 'none',
              fontWeight: (c.fontWeight as string) || 'bold',
              cursor: 'pointer',
              width: c.fullWidth ? '100%' : 'auto',
              fontSize: (c.size as string) === 'lg' ? '18px' : (c.size as string) === 'sm' ? '13px' : '15px',
              fontFamily: (c.fontFamily as string) || undefined,
              letterSpacing: (c.letterSpacing as string) || undefined,
              textTransform: (c.textTransform as any) || undefined,
              boxShadow: c.shadow ? '0 4px 12px rgba(0,0,0,0.2)' : undefined,
            }}>
              {(c.text as string) || 'Botão'}
            </button>
          </div>
        );
      }
      case 'divider':
        return (
          <div style={{ textAlign: (c.align as any) || 'center' }}>
            <hr style={{ borderColor: (c.color as string) || '#E5E7EB', borderStyle: (c.style as string) || 'solid', borderWidth: `${(c.thickness as string) || '1px'} 0 0 0`, width: (c.width as string) || '100%', display: 'inline-block' }} />
          </div>
        );
      case 'spacer':
        return <div style={{ height: (c.height as string) || '20px' }} className="bg-muted/30 rounded flex items-center justify-center text-[10px] text-muted-foreground">{c.height as string}</div>;
      case 'quote':
        return (
          <div style={{ borderLeft: `${(c.borderWidth as string) || '4px'} solid ${(c.borderColor as string) || '#3B82F6'}`, padding: (c.padding as string) || '12px 16px', backgroundColor: (c.bgColor as string) || '#F8FAFC', borderRadius: (c.borderRadius as string) || '0 8px 8px 0', margin: '8px 0' }}>
            <p style={{ fontStyle: (c.fontStyle as string) || 'italic', fontSize: (c.fontSize as string) || '15px', color: (c.color as string) || '#555', margin: 0, whiteSpace: 'pre-wrap' }}>{(c.text as string) || 'Citação'}</p>
          </div>
        );
      case 'list': {
        const items = (c.items as string[]) || [];
        const ListTag = c.ordered ? 'ol' : 'ul';
        return (
          <ListTag style={{ paddingLeft: '20px', margin: '8px 0', fontFamily: (c.fontFamily as string) || undefined }}>
            {items.map((item, i) => <li key={i} style={{ marginBottom: '4px', fontSize: (c.fontSize as string) || '15px', color: (c.color as string) || '#333', lineHeight: (c.lineHeight as string) || '1.6' }}>{item}</li>)}
          </ListTag>
        );
      }
      case 'table': {
        const headers = (c.headers as string[]) || [];
        const data = (c.data as string[][]) || [];
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: (c.fontSize as string) || '14px' }}>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} style={{ backgroundColor: (c.headerBgColor as string) || '#3B82F6', color: (c.headerTextColor as string) || '#FFFFFF', padding: '10px 12px', textAlign: 'left', border: `1px solid ${(c.borderColor as string) || '#E5E7EB'}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri} style={{ backgroundColor: c.stripedRows && ri % 2 === 1 ? '#F9FAFB' : 'transparent' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '8px 12px', border: `1px solid ${(c.borderColor as string) || '#E5E7EB'}`, color: '#333' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
      case 'social': {
        const socials = [
          { key: 'instagram', label: 'Instagram', emoji: '📸' },
          { key: 'facebook', label: 'Facebook', emoji: '👍' },
          { key: 'linkedin', label: 'LinkedIn', emoji: '💼' },
          { key: 'youtube', label: 'YouTube', emoji: '🎬' },
          { key: 'twitter', label: 'X/Twitter', emoji: '🐦' },
          { key: 'tiktok', label: 'TikTok', emoji: '🎵' },
          { key: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
        ].filter(s => c[s.key]);
        return (
          <div style={{ textAlign: (c.align as any) || 'center', padding: '8px 0', backgroundColor: (c.bgColor as string) || undefined }}>
            {socials.length === 0 ? (
              <span className="text-xs text-muted-foreground">Configure os links das redes sociais</span>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {socials.map(s => (
                  <span key={s.key} style={{ fontSize: '14px', color: '#3B82F6', textDecoration: 'underline', cursor: 'pointer' }}>{s.emoji} {s.label}</span>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'timer':
        return (
          <div style={{ textAlign: (c.align as any) || 'center', padding: '16px', backgroundColor: (c.bgColor as string) || '#FEF3C7', borderRadius: '8px' }}>
            <p style={{ fontSize: '13px', color: (c.textColor as string) || '#92400E', margin: '0 0 8px 0' }}>{(c.label as string) || 'Oferta expira em:'}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {['00d', '00h', '00m', '00s'].map((t, i) => (
                <span key={i} style={{ backgroundColor: (c.numberBgColor as string) || '#FDE68A', padding: '8px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '18px', color: (c.numberColor as string) || '#78350F' }}>{t}</span>
              ))}
            </div>
          </div>
        );
      case 'html':
        return <div className="bg-muted/50 p-3 rounded border text-xs font-mono overflow-hidden" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((c.code as string) || '') }} />;
      default:
        return null;
    }
  };

  const renderPropertiesPanel = () => {
    if (!selectedBlock) {
      return (
        <div className="p-4 space-y-4">
          <div className="text-center text-muted-foreground">
            <Paintbrush className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Configurações Globais</p>
            <p className="text-xs mt-1">Clique em um bloco para editar ou ajuste as configs gerais abaixo</p>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Cor de fundo do email</Label>
              <Input type="color" value={globalSettings.bgColor} onChange={e => setGlobalSettings(p => ({ ...p, bgColor: e.target.value }))} className="h-8" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor de fundo do conteúdo</Label>
              <Input type="color" value={globalSettings.contentBgColor} onChange={e => setGlobalSettings(p => ({ ...p, contentBgColor: e.target.value }))} className="h-8" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Largura do conteúdo</Label>
              <Select value={globalSettings.contentWidth} onValueChange={v => setGlobalSettings(p => ({ ...p, contentWidth: v }))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="500px">500px — Compacto</SelectItem>
                  <SelectItem value="600px">600px — Padrão</SelectItem>
                  <SelectItem value="700px">700px — Largo</SelectItem>
                  <SelectItem value="100%">100% — Full</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Fonte padrão</Label>
              <Select value={globalSettings.fontFamily} onValueChange={v => setGlobalSettings(p => ({ ...p, fontFamily: v }))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map(f => (
                    <SelectItem key={f.value} value={f.value}><span style={{ fontFamily: f.value }}>{f.label}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Padding geral</Label>
              <Select value={globalSettings.padding} onValueChange={v => setGlobalSettings(p => ({ ...p, padding: v }))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10px">10px</SelectItem>
                  <SelectItem value="16px">16px</SelectItem>
                  <SelectItem value="20px">20px</SelectItem>
                  <SelectItem value="30px">30px</SelectItem>
                  <SelectItem value="40px">40px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    }

    const AlignButtons = ({ value, onChange: onAlignChange, showJustify = false }: { value: string; onChange: (v: string) => void; showJustify?: boolean }) => (
      <div className="flex gap-1">
        {[{ v: 'left', I: AlignLeft }, { v: 'center', I: AlignCenter }, { v: 'right', I: AlignRight }, ...(showJustify ? [{ v: 'justify', I: AlignJustify }] : [])].map(({ v, I }) => (
          <Button key={v} size="icon" variant={value === v ? 'default' : 'outline'} className="h-8 w-8" onClick={() => onAlignChange(v)}><I className="h-4 w-4" /></Button>
        ))}
      </div>
    );

    const FontFamilySelect = ({ value, onChange: onFontChange }: { value: string; onChange: (v: string) => void }) => (
      <Select value={value || ''} onValueChange={onFontChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Herdar padrão" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">Herdar padrão</SelectItem>
          {FONT_FAMILIES.map(f => (
            <SelectItem key={f.value} value={f.value}><span style={{ fontFamily: f.value }}>{f.label}</span></SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

    const FontSizeSelect = ({ value, onChange: onSizeChange }: { value: string; onChange: (v: string) => void }) => (
      <Select value={value || '16px'} onValueChange={onSizeChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

    const TextTransformSelect = ({ value, onChange: onTransformChange }: { value: string; onChange: (v: string) => void }) => (
      <Select value={value || 'none'} onValueChange={onTransformChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Normal</SelectItem>
          <SelectItem value="uppercase">MAIÚSCULAS</SelectItem>
          <SelectItem value="lowercase">minúsculas</SelectItem>
          <SelectItem value="capitalize">Capitalizar</SelectItem>
        </SelectContent>
      </Select>
    );

    const BackgroundSection = ({ bgColor, padding, borderRadius, onUpdate }: { bgColor: string; padding: string; borderRadius: string; onUpdate: (d: Record<string, unknown>) => void }) => (
      <div className="space-y-3 pt-2">
        <Separator />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Fundo & Espaçamento</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label className="text-xs">Cor fundo</Label><Input type="color" value={bgColor || '#ffffff'} onChange={e => onUpdate({ bgColor: e.target.value === '#ffffff' ? '' : e.target.value })} className="h-7" /></div>
          <div className="space-y-1"><Label className="text-xs">Padding</Label><Input value={padding || '0px'} onChange={e => onUpdate({ padding: e.target.value })} className="h-7 text-xs" placeholder="0px" /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Borda arredondada</Label><Input value={borderRadius || '0px'} onChange={e => onUpdate({ borderRadius: e.target.value })} className="h-7 text-xs" placeholder="0px" /></div>
      </div>
    );

    const c = selectedBlock.content;
    const update = (data: Record<string, unknown>) => updateBlockContent(selectedBlock.id, data);

    switch (selectedBlock.type) {
      case 'heading':
        return (
          <div className="space-y-3 p-4">
            <div className="space-y-2"><Label>Texto</Label><Input value={(c.text as string) || ''} onChange={e => update({ text: e.target.value })} /></div>
            <div className="space-y-2"><Label>Nível</Label>
              <Select value={(c.level as string) || 'h1'} onValueChange={v => update({ level: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1 — Grande</SelectItem>
                  <SelectItem value="h2">H2 — Médio</SelectItem>
                  <SelectItem value="h3">H3 — Pequeno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fonte</Label><FontFamilySelect value={(c.fontFamily as string) || ''} onChange={v => update({ fontFamily: v })} /></div>
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} onChange={v => update({ align: v })} /></div>
            <div className="space-y-2"><Label>Cor</Label><Input type="color" value={(c.color as string) || '#1a1a2e'} onChange={e => update({ color: e.target.value })} className="h-8" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Espaçamento letras</Label><Input value={(c.letterSpacing as string) || '0px'} onChange={e => update({ letterSpacing: e.target.value })} className="h-7 text-xs" /></div>
              <div className="space-y-1"><Label className="text-xs">Transformação</Label><TextTransformSelect value={(c.textTransform as string) || 'none'} onChange={v => update({ textTransform: v })} /></div>
            </div>
            <BackgroundSection bgColor={(c.bgColor as string) || ''} padding={(c.padding as string) || '0px'} borderRadius={(c.borderRadius as string) || '0px'} onUpdate={update} />
          </div>
        );

      case 'text':
        return (
          <div className="space-y-3 p-4">
            <div className="space-y-2"><Label>Texto</Label><Textarea rows={5} value={(c.text as string) || ''} onChange={e => update({ text: e.target.value })} placeholder="Digite seu texto..." /></div>
            <div className="space-y-2">
              <Label>Formatação</Label>
              <div className="flex gap-1 flex-wrap">
                <Button size="icon" variant={c.bold ? 'default' : 'outline'} className="h-8 w-8" onClick={() => update({ bold: !c.bold })}><Bold className="h-4 w-4" /></Button>
                <Button size="icon" variant={c.italic ? 'default' : 'outline'} className="h-8 w-8" onClick={() => update({ italic: !c.italic })}><Italic className="h-4 w-4" /></Button>
                <Button size="icon" variant={c.underline ? 'default' : 'outline'} className="h-8 w-8" onClick={() => update({ underline: !c.underline })}><Underline className="h-4 w-4" /></Button>
                <Button size="icon" variant={c.strikethrough ? 'default' : 'outline'} className="h-8 w-8" onClick={() => update({ strikethrough: !c.strikethrough })}><Strikethrough className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="space-y-2"><Label>Fonte</Label><FontFamilySelect value={(c.fontFamily as string) || ''} onChange={v => update({ fontFamily: v })} /></div>
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'left'} onChange={v => update({ align: v })} showJustify /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Tamanho</Label><FontSizeSelect value={(c.fontSize as string) || '16px'} onChange={v => update({ fontSize: v })} /></div>
              <div className="space-y-1"><Label className="text-xs">Altura linha</Label>
                <Select value={(c.lineHeight as string) || '1.6'} onValueChange={v => update({ lineHeight: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['1.0', '1.2', '1.4', '1.5', '1.6', '1.8', '2.0', '2.5'].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Espaçamento letras</Label><Input value={(c.letterSpacing as string) || '0px'} onChange={e => update({ letterSpacing: e.target.value })} className="h-7 text-xs" /></div>
              <div className="space-y-1"><Label className="text-xs">Transformação</Label><TextTransformSelect value={(c.textTransform as string) || 'none'} onChange={v => update({ textTransform: v })} /></div>
            </div>
            <div className="space-y-2"><Label>Cor do texto</Label><Input type="color" value={(c.color as string) || '#333333'} onChange={e => update({ color: e.target.value })} className="h-8" /></div>
            <BackgroundSection bgColor={(c.bgColor as string) || ''} padding={(c.padding as string) || '0px'} borderRadius={(c.borderRadius as string) || '0px'} onUpdate={update} />
            <div className="space-y-3 pt-2">
              <Separator />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Borda</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs">Estilo</Label>
                  <Select value={(c.borderStyle as string) || 'none'} onValueChange={v => update({ borderStyle: v })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="solid">Sólida</SelectItem>
                      <SelectItem value="dashed">Tracejada</SelectItem>
                      <SelectItem value="dotted">Pontilhada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Espessura</Label><Input value={(c.borderWidth as string) || '1px'} onChange={e => update({ borderWidth: e.target.value })} className="h-7 text-xs" /></div>
              </div>
              {c.borderStyle && c.borderStyle !== 'none' && (
                <div className="space-y-1"><Label className="text-xs">Cor da borda</Label><Input type="color" value={(c.borderColor as string) || '#E5E7EB'} onChange={e => update({ borderColor: e.target.value })} className="h-7" /></div>
              )}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3 p-4">
            <div className="space-y-2"><Label>URL da Imagem</Label><Input value={(c.src as string) || ''} onChange={e => update({ src: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Texto Alternativo</Label><Input value={(c.alt as string) || ''} onChange={e => update({ alt: e.target.value })} /></div>
            <div className="space-y-2"><Label>Largura</Label><Input value={(c.width as string) || '100%'} onChange={e => update({ width: e.target.value })} placeholder="100% ou 300px" /></div>
            <div className="space-y-2"><Label>Link (ao clicar)</Label><Input value={(c.link as string) || ''} onChange={e => update({ link: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} onChange={v => update({ align: v })} /></div>
            <div className="space-y-2"><Label>Borda arredondada</Label><Input value={(c.borderRadius as string) || '0px'} onChange={e => update({ borderRadius: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={!!c.shadow} onCheckedChange={v => update({ shadow: v })} /><Label className="text-xs">Sombra</Label></div>
            <div className="flex items-center gap-2"><Switch checked={!!c.border} onCheckedChange={v => update({ border: v })} /><Label className="text-xs">Borda</Label></div>
            {c.border && (
              <div className="space-y-1"><Label className="text-xs">Cor da borda</Label><Input type="color" value={(c.borderColor as string) || '#E5E7EB'} onChange={e => update({ borderColor: e.target.value })} className="h-7" /></div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>URL do Vídeo</Label><Input value={(c.url as string) || ''} onChange={e => update({ url: e.target.value })} placeholder="https://youtube.com/..." /></div>
            <div className="space-y-2"><Label>URL da Thumbnail</Label><Input value={(c.thumbnailUrl as string) || ''} onChange={e => update({ thumbnailUrl: e.target.value })} placeholder="https://..." /></div>
            <p className="text-xs text-muted-foreground">Em emails, vídeos são exibidos como imagem com link de play.</p>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-3 p-4">
            <div className="space-y-2"><Label>Texto</Label><Input value={(c.text as string) || ''} onChange={e => update({ text: e.target.value })} /></div>
            <div className="space-y-2"><Label>URL</Label><Input value={(c.url as string) || ''} onChange={e => update({ url: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Tamanho</Label>
              <Select value={(c.size as string) || 'md'} onValueChange={v => update({ size: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Médio</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fonte</Label><FontFamilySelect value={(c.fontFamily as string) || ''} onChange={v => update({ fontFamily: v })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Cor Fundo</Label><Input type="color" value={(c.bgColor as string) || '#3B82F6'} onChange={e => update({ bgColor: e.target.value })} className="h-7" /></div>
              <div className="space-y-1"><Label className="text-xs">Cor Texto</Label><Input type="color" value={(c.textColor as string) || '#FFFFFF'} onChange={e => update({ textColor: e.target.value })} className="h-7" /></div>
            </div>
            <div className="space-y-2"><Label>Borda arredondada</Label><Input value={(c.borderRadius as string) || '8px'} onChange={e => update({ borderRadius: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Peso fonte</Label>
                <Select value={(c.fontWeight as string) || 'bold'} onValueChange={v => update({ fontWeight: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="500">Médio</SelectItem>
                    <SelectItem value="600">Semi-Bold</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Transformação</Label><TextTransformSelect value={(c.textTransform as string) || 'none'} onChange={v => update({ textTransform: v })} /></div>
            </div>
            <div className="space-y-2"><Label className="text-xs">Espaçamento letras</Label><Input value={(c.letterSpacing as string) || '0px'} onChange={e => update({ letterSpacing: e.target.value })} className="h-7 text-xs" /></div>
            <div className="flex items-center gap-2"><Switch checked={!!c.fullWidth} onCheckedChange={v => update({ fullWidth: v })} /><Label className="text-xs">Largura total</Label></div>
            <div className="flex items-center gap-2"><Switch checked={!!c.shadow} onCheckedChange={v => update({ shadow: v })} /><Label className="text-xs">Sombra</Label></div>
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} onChange={v => update({ align: v })} /></div>
            <Separator />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Borda do botão</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Cor borda</Label><Input type="color" value={(c.borderColor as string) || '#3B82F6'} onChange={e => update({ borderColor: e.target.value === '#3B82F6' ? '' : e.target.value })} className="h-7" /></div>
              <div className="space-y-1"><Label className="text-xs">Espessura</Label><Input value={(c.borderWidth as string) || '0px'} onChange={e => update({ borderWidth: e.target.value })} className="h-7 text-xs" /></div>
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="space-y-3 p-4">
            <div className="space-y-2"><Label>Cor</Label><Input type="color" value={(c.color as string) || '#E5E7EB'} onChange={e => update({ color: e.target.value })} className="h-8" /></div>
            <div className="space-y-2"><Label>Estilo</Label>
              <Select value={(c.style as string) || 'solid'} onValueChange={v => update({ style: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Sólido</SelectItem>
                  <SelectItem value="dashed">Tracejado</SelectItem>
                  <SelectItem value="dotted">Pontilhado</SelectItem>
                  <SelectItem value="double">Duplo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Espessura</Label><Input value={(c.thickness as string) || '1px'} onChange={e => update({ thickness: e.target.value })} /></div>
            <div className="space-y-2"><Label>Largura</Label>
              <Select value={(c.width as string) || '100%'} onValueChange={v => update({ width: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="100%">100%</SelectItem>
                  <SelectItem value="80%">80%</SelectItem>
                  <SelectItem value="60%">60%</SelectItem>
                  <SelectItem value="40%">40%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} onChange={v => update({ align: v })} /></div>
          </div>
        );

      case 'spacer':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Altura</Label>
              <Select value={(c.height as string) || '20px'} onValueChange={v => update({ height: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['5px', '10px', '15px', '20px', '30px', '40px', '50px', '60px', '80px', '100px'].map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="space-y-3 p-4">
            <div className="space-y-2"><Label>Citação</Label><Textarea rows={3} value={(c.text as string) || ''} onChange={e => update({ text: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tamanho fonte</Label><FontSizeSelect value={(c.fontSize as string) || '15px'} onChange={v => update({ fontSize: v })} /></div>
            <div className="space-y-2"><Label>Estilo texto</Label>
              <Select value={(c.fontStyle as string) || 'italic'} onValueChange={v => update({ fontStyle: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="italic">Itálico</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Cor do texto</Label><Input type="color" value={(c.color as string) || '#555555'} onChange={e => update({ color: e.target.value })} className="h-8" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Cor borda</Label><Input type="color" value={(c.borderColor as string) || '#3B82F6'} onChange={e => update({ borderColor: e.target.value })} className="h-7" /></div>
              <div className="space-y-1"><Label className="text-xs">Espessura borda</Label><Input value={(c.borderWidth as string) || '4px'} onChange={e => update({ borderWidth: e.target.value })} className="h-7 text-xs" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Cor fundo</Label><Input type="color" value={(c.bgColor as string) || '#F8FAFC'} onChange={e => update({ bgColor: e.target.value })} className="h-7" /></div>
              <div className="space-y-1"><Label className="text-xs">Borda arredondada</Label><Input value={(c.borderRadius as string) || '0 8px 8px 0'} onChange={e => update({ borderRadius: e.target.value })} className="h-7 text-xs" /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Padding</Label><Input value={(c.padding as string) || '12px 16px'} onChange={e => update({ padding: e.target.value })} className="h-7 text-xs" /></div>
          </div>
        );

      case 'list': {
        const items = (c.items as string[]) || [];
        return (
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2"><Switch checked={!!c.ordered} onCheckedChange={v => update({ ordered: v })} /><Label className="text-xs">Lista numerada</Label></div>
            <div className="space-y-2">
              <Label>Itens (um por linha)</Label>
              <Textarea rows={5} value={items.join('\n')} onChange={e => update({ items: e.target.value.split('\n') })} placeholder="Item 1&#10;Item 2&#10;Item 3" />
            </div>
            <div className="space-y-2"><Label>Fonte</Label><FontFamilySelect value={(c.fontFamily as string) || ''} onChange={v => update({ fontFamily: v })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Tamanho</Label><FontSizeSelect value={(c.fontSize as string) || '15px'} onChange={v => update({ fontSize: v })} /></div>
              <div className="space-y-1"><Label className="text-xs">Altura linha</Label>
                <Select value={(c.lineHeight as string) || '1.6'} onValueChange={v => update({ lineHeight: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['1.0', '1.2', '1.4', '1.6', '1.8', '2.0'].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Cor do texto</Label><Input type="color" value={(c.color as string) || '#333333'} onChange={e => update({ color: e.target.value })} className="h-7" /></div>
          </div>
        );
      }

      case 'table': {
        const headers = (c.headers as string[]) || [];
        const data = (c.data as string[][]) || [];
        return (
          <div className="space-y-3 p-4">
            <div className="space-y-2">
              <Label>Cabeçalhos (um por linha)</Label>
              <Textarea rows={2} value={headers.join('\n')} onChange={e => update({ headers: e.target.value.split('\n') })} />
            </div>
            <div className="space-y-2">
              <Label>Dados (linhas separadas por |)</Label>
              <Textarea rows={4} value={data.map(r => r.join(' | ')).join('\n')} onChange={e => {
                const rows = e.target.value.split('\n').map(r => r.split('|').map(cell => cell.trim()));
                update({ data: rows });
              }} placeholder="Dado 1 | Dado 2&#10;Dado 3 | Dado 4" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Cor cabeçalho</Label><Input type="color" value={(c.headerBgColor as string) || '#3B82F6'} onChange={e => update({ headerBgColor: e.target.value })} className="h-7" /></div>
              <div className="space-y-1"><Label className="text-xs">Texto cabeçalho</Label><Input type="color" value={(c.headerTextColor as string) || '#FFFFFF'} onChange={e => update({ headerTextColor: e.target.value })} className="h-7" /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Cor bordas</Label><Input type="color" value={(c.borderColor as string) || '#E5E7EB'} onChange={e => update({ borderColor: e.target.value })} className="h-7" /></div>
            <div className="space-y-1"><Label className="text-xs">Tamanho fonte</Label><FontSizeSelect value={(c.fontSize as string) || '14px'} onChange={v => update({ fontSize: v })} /></div>
            <div className="flex items-center gap-2"><Switch checked={!!c.stripedRows} onCheckedChange={v => update({ stripedRows: v })} /><Label className="text-xs">Linhas alternadas</Label></div>
          </div>
        );
      }

      case 'social':
        return (
          <div className="space-y-3 p-4">
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} onChange={v => update({ align: v })} /></div>
            <div className="space-y-1"><Label className="text-xs">Cor de fundo</Label><Input type="color" value={(c.bgColor as string) || '#ffffff'} onChange={e => update({ bgColor: e.target.value === '#ffffff' ? '' : e.target.value })} className="h-7" /></div>
            <Separator />
            {['instagram', 'facebook', 'linkedin', 'youtube', 'twitter', 'tiktok', 'whatsapp'].map(network => (
              <div key={network} className="space-y-1">
                <Label className="capitalize text-xs">{network}</Label>
                <Input value={(c[network] as string) || ''} onChange={e => update({ [network]: e.target.value })} placeholder={`https://${network}.com/...`} className="h-8 text-xs" />
              </div>
            ))}
          </div>
        );

      case 'timer':
        return (
          <div className="space-y-3 p-4">
            <div className="space-y-2"><Label>Legenda</Label><Input value={(c.label as string) || ''} onChange={e => update({ label: e.target.value })} /></div>
            <div className="space-y-2"><Label>Data de expiração</Label><Input type="datetime-local" value={(c.endDate as string) || ''} onChange={e => update({ endDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} onChange={v => update({ align: v })} /></div>
            <Separator />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Cores</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Fundo</Label><Input type="color" value={(c.bgColor as string) || '#FEF3C7'} onChange={e => update({ bgColor: e.target.value })} className="h-7" /></div>
              <div className="space-y-1"><Label className="text-xs">Texto</Label><Input type="color" value={(c.textColor as string) || '#92400E'} onChange={e => update({ textColor: e.target.value })} className="h-7" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Fundo números</Label><Input type="color" value={(c.numberBgColor as string) || '#FDE68A'} onChange={e => update({ numberBgColor: e.target.value })} className="h-7" /></div>
              <div className="space-y-1"><Label className="text-xs">Cor números</Label><Input type="color" value={(c.numberColor as string) || '#78350F'} onChange={e => update({ numberColor: e.target.value })} className="h-7" /></div>
            </div>
          </div>
        );

      case 'html':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>Código HTML</Label><Textarea rows={8} value={(c.code as string) || ''} onChange={e => update({ code: e.target.value })} className="font-mono text-xs" /></div>
            <p className="text-xs text-muted-foreground">⚠️ HTML avançado. Certifique-se de que é compatível com clientes de email.</p>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[650px]">
      {/* Sidebar - Blocks */}
      <div className="col-span-2 border rounded-lg flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <p className="font-medium text-sm">Blocos</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-3">
            {blockCategories.map(cat => (
              <div key={cat.label}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase px-1 mb-1">{cat.label}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {cat.blocks.map(({ type, label, icon: Icon }) => (
                    <Button key={type} variant="outline" size="sm" className="h-auto py-2 flex-col gap-1 text-[11px]" onClick={() => addBlock(type)}>
                      <Icon className="h-3.5 w-3.5" />{label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-2" />
          <div className="p-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase px-1 mb-1">Templates</p>
            <div className="space-y-1.5">
              {presetTemplates.map(template => (
                <Button key={template.id} variant="outline" size="sm" className="w-full justify-start text-left h-auto py-1.5" onClick={() => loadTemplate(template.id)}>
                  <div>
                    <p className="text-[11px] font-medium">{template.name}</p>
                    <p className="text-[10px] text-muted-foreground">{template.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Canvas */}
      <div className="col-span-7 border rounded-lg flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="font-medium text-sm">Editor</p>
          <div className="flex gap-1">
            {[
              { mode: 'edit' as const, icon: Type, label: 'Editar' },
              { mode: 'preview' as const, icon: Eye, label: 'Preview' },
              { mode: 'code' as const, icon: Code, label: 'HTML' },
            ].map(({ mode, icon: Icon, label }) => (
              <Button key={mode} size="sm" variant={viewMode === mode ? 'default' : 'ghost'} onClick={() => setViewMode(mode)}>
                <Icon className="h-4 w-4 mr-1" />{label}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {viewMode === 'edit' && (
            <div className="p-4 space-y-2">
              {blocks.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Type className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground mb-3 text-sm">Comece adicionando blocos ou escolha um template</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => addBlock('heading')}><Heading1 className="h-4 w-4 mr-1" />Título</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('text')}><Type className="h-4 w-4 mr-1" />Texto</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('image')}><Image className="h-4 w-4 mr-1" />Imagem</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('button')}><Square className="h-4 w-4 mr-1" />Botão</Button>
                  </div>
                </div>
              ) : (
                blocks.map(block => (
                  <Card
                    key={block.id}
                    className={`cursor-pointer group relative ${selectedBlockId === block.id ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-muted-foreground/20'}`}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <CardContent className="p-4">
                      {/* Block controls */}
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); moveBlock(block.id, 'up'); }}><ChevronUp className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); moveBlock(block.id, 'down'); }}><ChevronDown className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); duplicateBlock(block.id); }}><Copy className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); removeBlock(block.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      {renderBlockPreview(block)}
                    </CardContent>
                  </Card>
                ))
              )}
              {blocks.length > 0 && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => addBlock('text')}><Plus className="h-3 w-3 mr-1" />Adicionar bloco</Button>
                </div>
              )}
            </div>
          )}

          {viewMode === 'preview' && (
            <div className="p-4" style={{ backgroundColor: globalSettings.bgColor }}>
              <div style={{ maxWidth: globalSettings.contentWidth, margin: '0 auto', backgroundColor: globalSettings.contentBgColor, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: globalSettings.padding, fontFamily: globalSettings.fontFamily }}>
                {blocks.map(block => (
                  <div key={block.id} className="mb-4">{renderBlockPreview(block)}</div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'code' && (
            <div className="p-4">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(blocks, null, 2)}
              </pre>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Properties Panel */}
      <div className="col-span-3 border rounded-lg flex flex-col overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="font-medium text-sm">{selectedBlock ? 'Propriedades' : 'Configurações'}</p>
          {selectedBlock && (
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setSelectedBlockId(null)}>
              ← Geral
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1">
          {renderPropertiesPanel()}
        </ScrollArea>
      </div>
    </div>
  );
}
