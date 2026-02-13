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
import {
  Type,
  Image,
  Square,
  Link2,
  List,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
  Eye,
  Code,
  Trash2,
  GripVertical,
  Plus,
} from 'lucide-react';

type BlockType = 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'columns';

interface Block {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
}

interface EmailTemplateEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const blockTypes = [
  { type: 'text' as BlockType, label: 'Texto', icon: Type },
  { type: 'image' as BlockType, label: 'Imagem', icon: Image },
  { type: 'button' as BlockType, label: 'Botão', icon: Square },
  { type: 'divider' as BlockType, label: 'Divisor', icon: Minus },
  { type: 'spacer' as BlockType, label: 'Espaço', icon: List },
  { type: 'columns' as BlockType, label: 'Colunas', icon: AlignCenter },
];

const presetTemplates = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    description: 'Email de boas-vindas para novos leads',
    blocks: [
      { id: '1', type: 'image' as BlockType, content: { src: '', alt: 'Logo', align: 'center' } },
      { id: '2', type: 'text' as BlockType, content: { text: 'Olá {{nome}}, seja bem-vindo!', align: 'center', fontSize: '24px', fontWeight: 'bold' } },
      { id: '3', type: 'text' as BlockType, content: { text: 'Estamos muito felizes em ter você conosco. Explore nossos recursos e descubra como podemos ajudar você.', align: 'center' } },
      { id: '4', type: 'button' as BlockType, content: { text: 'Começar Agora', url: '#', align: 'center', bgColor: '#3B82F6', textColor: '#FFFFFF' } },
      { id: '5', type: 'divider' as BlockType, content: {} },
      { id: '6', type: 'text' as BlockType, content: { text: 'Abraços,\nEquipe AG Sell', align: 'left' } },
    ],
  },
  {
    id: 'promotion',
    name: 'Promoção',
    description: 'Email promocional com desconto',
    blocks: [
      { id: '1', type: 'image' as BlockType, content: { src: '', alt: 'Banner', align: 'center' } },
      { id: '2', type: 'text' as BlockType, content: { text: '🎉 OFERTA ESPECIAL 🎉', align: 'center', fontSize: '28px', fontWeight: 'bold' } },
      { id: '3', type: 'text' as BlockType, content: { text: 'Por tempo limitado, aproveite 50% de desconto em todos os planos!', align: 'center', fontSize: '18px' } },
      { id: '4', type: 'button' as BlockType, content: { text: 'Aproveitar Desconto', url: '#', align: 'center', bgColor: '#22C55E', textColor: '#FFFFFF' } },
      { id: '5', type: 'text' as BlockType, content: { text: '*Oferta válida até o final do mês', align: 'center', fontSize: '12px', color: '#666' } },
    ],
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Newsletter mensal',
    blocks: [
      { id: '1', type: 'text' as BlockType, content: { text: 'Newsletter - {{mes}} {{ano}}', align: 'center', fontSize: '24px', fontWeight: 'bold' } },
      { id: '2', type: 'divider' as BlockType, content: {} },
      { id: '3', type: 'text' as BlockType, content: { text: 'Novidades do Mês', align: 'left', fontSize: '20px', fontWeight: 'bold' } },
      { id: '4', type: 'text' as BlockType, content: { text: 'Aqui está um resumo das principais novidades e atualizações.', align: 'left' } },
      { id: '5', type: 'spacer' as BlockType, content: { height: '20px' } },
      { id: '6', type: 'text' as BlockType, content: { text: 'Dicas da Semana', align: 'left', fontSize: '20px', fontWeight: 'bold' } },
      { id: '7', type: 'text' as BlockType, content: { text: 'Confira nossas dicas para melhorar seus resultados.', align: 'left' } },
      { id: '8', type: 'button' as BlockType, content: { text: 'Ler Mais', url: '#', align: 'center', bgColor: '#3B82F6', textColor: '#FFFFFF' } },
    ],
  },
];

export function EmailTemplateEditor({ content, onChange }: EmailTemplateEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    try {
      return JSON.parse(content) || [];
    } catch {
      return [];
    }
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'code'>('edit');

  const updateBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    onChange(JSON.stringify(newBlocks));
  };

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      content: getDefaultContent(type),
    };
    updateBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const getDefaultContent = (type: BlockType): Record<string, unknown> => {
    switch (type) {
      case 'text':
        return { text: 'Digite seu texto aqui...', align: 'left', fontSize: '16px' };
      case 'image':
        return { src: '', alt: 'Imagem', align: 'center' };
      case 'button':
        return { text: 'Clique Aqui', url: '#', align: 'center', bgColor: '#3B82F6', textColor: '#FFFFFF' };
      case 'divider':
        return { color: '#E5E7EB' };
      case 'spacer':
        return { height: '20px' };
      case 'columns':
        return { columns: 2 };
      default:
        return {};
    }
  };

  const updateBlockContent = (blockId: string, newContent: Record<string, unknown>) => {
    const newBlocks = blocks.map((block) =>
      block.id === blockId ? { ...block, content: { ...block.content, ...newContent } } : block
    );
    updateBlocks(newBlocks);
  };

  const removeBlock = (blockId: string) => {
    updateBlocks(blocks.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) return;

    const newBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    updateBlocks(newBlocks);
  };

  const loadTemplate = (templateId: string) => {
    const template = presetTemplates.find((t) => t.id === templateId);
    if (template) {
      const newBlocks = template.blocks.map((b) => ({ ...b, id: crypto.randomUUID() }));
      updateBlocks(newBlocks);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  const renderBlockPreview = (block: Block) => {
    switch (block.type) {
      case 'text':
        return (
          <div
            style={{
              textAlign: (block.content.align as 'left' | 'center' | 'right') || 'left',
              fontSize: (block.content.fontSize as string) || '16px',
              fontWeight: (block.content.fontWeight as string) || 'normal',
              color: (block.content.color as string) || 'inherit',
            }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(((block.content.text as string) || '').replace(/\n/g, '<br>'), { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'], ALLOWED_ATTR: ['href', 'target', 'style'] }) }}
          />
        );
      case 'image':
        return (
          <div style={{ textAlign: (block.content.align as 'left' | 'center' | 'right') || 'center' }}>
            {block.content.src ? (
              <img
                src={block.content.src as string}
                alt={block.content.alt as string}
                style={{ maxWidth: '100%' }}
              />
            ) : (
              <div className="bg-muted h-32 flex items-center justify-center rounded-md">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      case 'button':
        return (
          <div style={{ textAlign: (block.content.align as 'left' | 'center' | 'right') || 'center' }}>
            <button
              style={{
                backgroundColor: (block.content.bgColor as string) || '#3B82F6',
                color: (block.content.textColor as string) || '#FFFFFF',
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {(block.content.text as string) || 'Botão'}
            </button>
          </div>
        );
      case 'divider':
        return <hr style={{ borderColor: (block.content.color as string) || '#E5E7EB' }} />;
      case 'spacer':
        return <div style={{ height: (block.content.height as string) || '20px' }} />;
      default:
        return null;
    }
  };

  const renderPropertiesPanel = () => {
    if (!selectedBlock) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Selecione um bloco para editar suas propriedades</p>
        </div>
      );
    }

    switch (selectedBlock.type) {
      case 'text':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Texto</Label>
              <Textarea
                rows={4}
                value={(selectedBlock.content.text as string) || ''}
                onChange={(e) => updateBlockContent(selectedBlock.id, { text: e.target.value })}
                placeholder="Digite seu texto..."
              />
            </div>
            <div className="space-y-2">
              <Label>Alinhamento</Label>
              <div className="flex gap-1">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <Button
                    key={value}
                    size="icon"
                    variant={selectedBlock.content.align === value ? 'default' : 'outline'}
                    onClick={() => updateBlockContent(selectedBlock.id, { align: value })}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tamanho da Fonte</Label>
              <Input
                value={(selectedBlock.content.fontSize as string) || '16px'}
                onChange={(e) => updateBlockContent(selectedBlock.id, { fontSize: e.target.value })}
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <Input
                value={(selectedBlock.content.src as string) || ''}
                onChange={(e) => updateBlockContent(selectedBlock.id, { src: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Texto Alternativo</Label>
              <Input
                value={(selectedBlock.content.alt as string) || ''}
                onChange={(e) => updateBlockContent(selectedBlock.id, { alt: e.target.value })}
              />
            </div>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Texto do Botão</Label>
              <Input
                value={(selectedBlock.content.text as string) || ''}
                onChange={(e) => updateBlockContent(selectedBlock.id, { text: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>URL de Destino</Label>
              <Input
                value={(selectedBlock.content.url as string) || ''}
                onChange={(e) => updateBlockContent(selectedBlock.id, { url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cor do Fundo</Label>
                <Input
                  type="color"
                  value={(selectedBlock.content.bgColor as string) || '#3B82F6'}
                  onChange={(e) => updateBlockContent(selectedBlock.id, { bgColor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor do Texto</Label>
                <Input
                  type="color"
                  value={(selectedBlock.content.textColor as string) || '#FFFFFF'}
                  onChange={(e) => updateBlockContent(selectedBlock.id, { textColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'spacer':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Altura</Label>
              <Input
                value={(selectedBlock.content.height as string) || '20px'}
                onChange={(e) => updateBlockContent(selectedBlock.id, { height: e.target.value })}
              />
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Cor da Linha</Label>
              <Input
                type="color"
                value={(selectedBlock.content.color as string) || '#E5E7EB'}
                onChange={(e) => updateBlockContent(selectedBlock.id, { color: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[600px]">
      {/* Sidebar - Blocks */}
      <div className="col-span-2 border rounded-lg">
        <div className="p-3 border-b">
          <p className="font-medium text-sm">Blocos</p>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-2 grid grid-cols-2 gap-2">
            {blockTypes.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => addBlock(type)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-b">
          <p className="font-medium text-sm">Templates</p>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-2 space-y-2">
            {presetTemplates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left"
                onClick={() => loadTemplate(template.id)}
              >
                <div>
                  <p className="text-xs font-medium">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Canvas */}
      <div className="col-span-7 border rounded-lg flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="font-medium text-sm">Editor</p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewMode === 'edit' ? 'default' : 'ghost'}
              onClick={() => setViewMode('edit')}
            >
              <Type className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'preview' ? 'default' : 'ghost'}
              onClick={() => setViewMode('preview')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'code' ? 'default' : 'ghost'}
              onClick={() => setViewMode('code')}
            >
              <Code className="h-4 w-4 mr-1" />
              HTML
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {viewMode === 'edit' && (
            <div className="p-4 space-y-2">
              {blocks.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-2">
                    Arraste blocos da barra lateral ou clique para adicionar
                  </p>
                  <Button variant="outline" onClick={() => addBlock('text')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Bloco de Texto
                  </Button>
                </div>
              ) : (
                blocks.map((block) => (
                  <Card
                    key={block.id}
                    className={`cursor-pointer group ${selectedBlockId === block.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <CardContent className="p-4 relative">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, 'up');
                          }}
                        >
                          ↑
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, 'down');
                          }}
                        >
                          ↓
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlock(block.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {renderBlockPreview(block)}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {viewMode === 'preview' && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900">
              <div className="max-w-[600px] mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                {blocks.map((block) => (
                  <div key={block.id} className="mb-4">
                    {renderBlockPreview(block)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'code' && (
            <div className="p-4">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(blocks, null, 2)}
              </pre>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Properties Panel */}
      <div className="col-span-3 border rounded-lg">
        <div className="p-3 border-b">
          <p className="font-medium text-sm">Propriedades</p>
        </div>
        <ScrollArea className="h-[calc(100%-48px)]">
          {renderPropertiesPanel()}
        </ScrollArea>
      </div>
    </div>
  );
}
