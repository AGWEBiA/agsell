import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLandingPages, useCreateLandingPage, useUpdateLandingPage, useDeleteLandingPage, LandingPage } from '@/hooks/useLandingPages';
import {
  Eye, Plus, Trash2, Edit, Globe, Copy, ExternalLink, Layout, Save,
  Type, Image, Square, Minus, Heading1, AlignLeft, AlignCenter, AlignRight,
  ChevronUp, ChevronDown, GripVertical, X, Settings, Palette, Code, Loader2,
  List, Star, Users, Quote, Video, MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

// ─── Section Types ───
type SectionType = 'hero' | 'text' | 'features' | 'cta' | 'image' | 'testimonials' | 'faq' | 'form' | 'video' | 'divider' | 'spacer';

interface Section {
  id: string;
  type: SectionType;
  content: Record<string, unknown>;
}

const sectionTypes: { type: SectionType; label: string; icon: typeof Type }[] = [
  { type: 'hero', label: 'Hero', icon: Layout },
  { type: 'text', label: 'Texto', icon: Type },
  { type: 'features', label: 'Features', icon: Star },
  { type: 'cta', label: 'CTA', icon: Square },
  { type: 'image', label: 'Imagem', icon: Image },
  { type: 'testimonials', label: 'Depoimentos', icon: Quote },
  { type: 'faq', label: 'FAQ', icon: List },
  { type: 'video', label: 'Vídeo', icon: Video },
  { type: 'divider', label: 'Divisor', icon: Minus },
  { type: 'spacer', label: 'Espaço', icon: Layout },
];

const getDefaultSectionContent = (type: SectionType): Record<string, unknown> => {
  switch (type) {
    case 'hero': return { title: 'Título Principal', subtitle: 'Subtítulo descritivo para sua landing page', buttonText: 'Saiba Mais', buttonUrl: '#', bgColor: '#1a1a2e', textColor: '#ffffff', align: 'center' };
    case 'text': return { text: 'Adicione seu conteúdo aqui. Descreva seu produto, serviço ou oferta de forma clara e convincente.', align: 'center', fontSize: '18px' };
    case 'features': return { title: 'Nossos Diferenciais', items: [
      { icon: '🚀', title: 'Rápido', description: 'Resultados em minutos' },
      { icon: '🔒', title: 'Seguro', description: 'Seus dados protegidos' },
      { icon: '💡', title: 'Inteligente', description: 'IA integrada' },
    ]};
    case 'cta': return { title: 'Pronto para começar?', subtitle: 'Junte-se a milhares de clientes satisfeitos', buttonText: 'Começar Agora', buttonUrl: '#', bgColor: '#3B82F6', textColor: '#ffffff' };
    case 'image': return { src: '', alt: 'Imagem', width: '100%' };
    case 'testimonials': return { title: 'O que dizem nossos clientes', items: [
      { name: 'Maria Silva', role: 'CEO, TechCorp', text: 'Incrível ferramenta! Transformou nosso marketing.' },
      { name: 'João Santos', role: 'Diretor, StartupX', text: 'Resultados impressionantes em poucas semanas.' },
    ]};
    case 'faq': return { title: 'Perguntas Frequentes', items: [
      { question: 'Como funciona?', answer: 'É simples! Basta se cadastrar e começar a usar.' },
      { question: 'Tem período de teste?', answer: 'Sim, oferecemos 7 dias grátis.' },
    ]};
    case 'video': return { url: '', title: 'Veja como funciona' };
    case 'divider': return { color: '#E5E7EB', style: 'solid' };
    case 'spacer': return { height: '40px' };
    default: return {};
  }
};

// ─── Section Preview Renderer ───
function SectionPreview({ section }: { section: Section }) {
  const c = section.content;
  switch (section.type) {
    case 'hero':
      return (
        <div style={{ backgroundColor: (c.bgColor as string) || '#1a1a2e', color: (c.textColor as string) || '#fff', padding: '48px 24px', textAlign: (c.align as any) || 'center', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>{(c.title as string) || 'Título'}</h2>
          <p style={{ fontSize: '16px', opacity: 0.85, marginBottom: '20px' }}>{(c.subtitle as string) || 'Subtítulo'}</p>
          {c.buttonText && (
            <button style={{ backgroundColor: '#fff', color: (c.bgColor as string) || '#1a1a2e', padding: '12px 28px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
              {c.buttonText as string}
            </button>
          )}
        </div>
      );
    case 'text':
      return (
        <div style={{ textAlign: (c.align as any) || 'center', padding: '24px', fontSize: (c.fontSize as string) || '18px', lineHeight: '1.6', color: '#333' }}>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(((c.text as string) || '').replace(/\n/g, '<br>')) }} />
        </div>
      );
    case 'features': {
      const items = (c.items as any[]) || [];
      return (
        <div style={{ padding: '24px' }}>
          {c.title && <h3 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}>{c.title as string}</h3>}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: '16px' }}>
            {items.map((item: any, i: number) => (
              <div key={i} style={{ textAlign: 'center', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '4px' }}>{item.title}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'cta':
      return (
        <div style={{ backgroundColor: (c.bgColor as string) || '#3B82F6', color: (c.textColor as string) || '#fff', padding: '40px 24px', textAlign: 'center', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{(c.title as string) || 'CTA'}</h3>
          <p style={{ opacity: 0.9, marginBottom: '16px' }}>{(c.subtitle as string) || ''}</p>
          <button style={{ backgroundColor: '#fff', color: (c.bgColor as string) || '#3B82F6', padding: '12px 28px', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>
            {(c.buttonText as string) || 'Ação'}
          </button>
        </div>
      );
    case 'image':
      return (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          {c.src ? (
            <img src={c.src as string} alt={(c.alt as string) || ''} style={{ maxWidth: (c.width as string) || '100%', borderRadius: '8px' }} />
          ) : (
            <div className="bg-muted h-40 flex items-center justify-center rounded-lg"><Image className="h-8 w-8 text-muted-foreground" /><span className="ml-2 text-sm text-muted-foreground">Insira a URL da imagem</span></div>
          )}
        </div>
      );
    case 'testimonials': {
      const items = (c.items as any[]) || [];
      return (
        <div style={{ padding: '24px' }}>
          {c.title && <h3 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}>{c.title as string}</h3>}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 2)}, 1fr)`, gap: '16px' }}>
            {items.map((item: any, i: number) => (
              <div key={i} style={{ padding: '16px', borderLeft: '4px solid #3B82F6', backgroundColor: '#f8fafc', borderRadius: '0 8px 8px 0' }}>
                <p style={{ fontStyle: 'italic', marginBottom: '8px', fontSize: '14px' }}>"{item.text}"</p>
                <p style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.name}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>{item.role}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'faq': {
      const items = (c.items as any[]) || [];
      return (
        <div style={{ padding: '24px' }}>
          {c.title && <h3 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}>{c.title as string}</h3>}
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {items.map((item: any, i: number) => (
              <div key={i} style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{item.question}</p>
                <p style={{ fontSize: '14px', color: '#666' }}>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'video':
      return (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          {c.title && <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>{c.title as string}</h3>}
          <div className="bg-muted h-48 flex items-center justify-center rounded-lg">
            <Video className="h-10 w-10 text-muted-foreground" />
            {c.url && <span className="ml-2 text-sm text-muted-foreground truncate max-w-xs">{c.url as string}</span>}
          </div>
        </div>
      );
    case 'divider':
      return <hr style={{ borderColor: (c.color as string) || '#E5E7EB', borderStyle: (c.style as string) || 'solid', margin: '16px 0' }} />;
    case 'spacer':
      return <div style={{ height: (c.height as string) || '40px' }} />;
    default:
      return <div className="p-4 text-sm text-muted-foreground">Seção desconhecida</div>;
  }
}

// ─── Section Properties Editor ───
function SectionEditor({ section, onUpdate }: { section: Section; onUpdate: (content: Record<string, unknown>) => void }) {
  const c = section.content;
  const update = (data: Record<string, unknown>) => onUpdate({ ...c, ...data });

  const AlignButtons = ({ value }: { value: string }) => (
    <div className="flex gap-1">
      {[{ v: 'left', I: AlignLeft }, { v: 'center', I: AlignCenter }, { v: 'right', I: AlignRight }].map(({ v, I }) => (
        <Button key={v} size="icon" variant={value === v ? 'default' : 'outline'} className="h-8 w-8" onClick={() => update({ align: v })}><I className="h-4 w-4" /></Button>
      ))}
    </div>
  );

  switch (section.type) {
    case 'hero':
      return (
        <div className="space-y-3">
          <div><Label className="text-xs">Título</Label><Input value={(c.title as string) || ''} onChange={e => update({ title: e.target.value })} /></div>
          <div><Label className="text-xs">Subtítulo</Label><Textarea rows={2} value={(c.subtitle as string) || ''} onChange={e => update({ subtitle: e.target.value })} /></div>
          <div><Label className="text-xs">Texto do Botão</Label><Input value={(c.buttonText as string) || ''} onChange={e => update({ buttonText: e.target.value })} /></div>
          <div><Label className="text-xs">URL do Botão</Label><Input value={(c.buttonUrl as string) || ''} onChange={e => update({ buttonUrl: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Cor Fundo</Label><Input type="color" value={(c.bgColor as string) || '#1a1a2e'} onChange={e => update({ bgColor: e.target.value })} className="h-8" /></div>
            <div><Label className="text-xs">Cor Texto</Label><Input type="color" value={(c.textColor as string) || '#ffffff'} onChange={e => update({ textColor: e.target.value })} className="h-8" /></div>
          </div>
          <div><Label className="text-xs">Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} /></div>
        </div>
      );
    case 'text':
      return (
        <div className="space-y-3">
          <div><Label className="text-xs">Texto</Label><Textarea rows={5} value={(c.text as string) || ''} onChange={e => update({ text: e.target.value })} /></div>
          <div><Label className="text-xs">Tamanho fonte</Label><Input value={(c.fontSize as string) || '18px'} onChange={e => update({ fontSize: e.target.value })} /></div>
          <div><Label className="text-xs">Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} /></div>
        </div>
      );
    case 'features': {
      const items = (c.items as any[]) || [];
      return (
        <div className="space-y-3">
          <div><Label className="text-xs">Título da Seção</Label><Input value={(c.title as string) || ''} onChange={e => update({ title: e.target.value })} /></div>
          <Label className="text-xs">Itens ({items.length})</Label>
          {items.map((item: any, i: number) => (
            <div key={i} className="p-2 border rounded space-y-1">
              <div className="flex gap-1">
                <Input value={item.icon} onChange={e => { const n = [...items]; n[i] = { ...item, icon: e.target.value }; update({ items: n }); }} className="w-14 h-7 text-xs" placeholder="🚀" />
                <Input value={item.title} onChange={e => { const n = [...items]; n[i] = { ...item, title: e.target.value }; update({ items: n }); }} className="h-7 text-xs" placeholder="Título" />
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => update({ items: items.filter((_: any, j: number) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
              </div>
              <Input value={item.description} onChange={e => { const n = [...items]; n[i] = { ...item, description: e.target.value }; update({ items: n }); }} className="h-7 text-xs" placeholder="Descrição" />
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => update({ items: [...items, { icon: '✨', title: 'Novo', description: 'Descrição' }] })}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
        </div>
      );
    }
    case 'cta':
      return (
        <div className="space-y-3">
          <div><Label className="text-xs">Título</Label><Input value={(c.title as string) || ''} onChange={e => update({ title: e.target.value })} /></div>
          <div><Label className="text-xs">Subtítulo</Label><Input value={(c.subtitle as string) || ''} onChange={e => update({ subtitle: e.target.value })} /></div>
          <div><Label className="text-xs">Texto do Botão</Label><Input value={(c.buttonText as string) || ''} onChange={e => update({ buttonText: e.target.value })} /></div>
          <div><Label className="text-xs">URL do Botão</Label><Input value={(c.buttonUrl as string) || ''} onChange={e => update({ buttonUrl: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Cor Fundo</Label><Input type="color" value={(c.bgColor as string) || '#3B82F6'} onChange={e => update({ bgColor: e.target.value })} className="h-8" /></div>
            <div><Label className="text-xs">Cor Texto</Label><Input type="color" value={(c.textColor as string) || '#ffffff'} onChange={e => update({ textColor: e.target.value })} className="h-8" /></div>
          </div>
        </div>
      );
    case 'image':
      return (
        <div className="space-y-3">
          <div><Label className="text-xs">URL da Imagem</Label><Input value={(c.src as string) || ''} onChange={e => update({ src: e.target.value })} placeholder="https://..." /></div>
          <div><Label className="text-xs">Texto Alt</Label><Input value={(c.alt as string) || ''} onChange={e => update({ alt: e.target.value })} /></div>
          <div><Label className="text-xs">Largura</Label><Input value={(c.width as string) || '100%'} onChange={e => update({ width: e.target.value })} /></div>
        </div>
      );
    case 'testimonials': {
      const items = (c.items as any[]) || [];
      return (
        <div className="space-y-3">
          <div><Label className="text-xs">Título</Label><Input value={(c.title as string) || ''} onChange={e => update({ title: e.target.value })} /></div>
          {items.map((item: any, i: number) => (
            <div key={i} className="p-2 border rounded space-y-1">
              <div className="flex gap-1">
                <Input value={item.name} onChange={e => { const n = [...items]; n[i] = { ...item, name: e.target.value }; update({ items: n }); }} className="h-7 text-xs" placeholder="Nome" />
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => update({ items: items.filter((_: any, j: number) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
              </div>
              <Input value={item.role} onChange={e => { const n = [...items]; n[i] = { ...item, role: e.target.value }; update({ items: n }); }} className="h-7 text-xs" placeholder="Cargo" />
              <Textarea rows={2} value={item.text} onChange={e => { const n = [...items]; n[i] = { ...item, text: e.target.value }; update({ items: n }); }} className="text-xs" placeholder="Depoimento" />
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => update({ items: [...items, { name: 'Nome', role: 'Cargo', text: 'Depoimento...' }] })}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
        </div>
      );
    }
    case 'faq': {
      const items = (c.items as any[]) || [];
      return (
        <div className="space-y-3">
          <div><Label className="text-xs">Título</Label><Input value={(c.title as string) || ''} onChange={e => update({ title: e.target.value })} /></div>
          {items.map((item: any, i: number) => (
            <div key={i} className="p-2 border rounded space-y-1">
              <div className="flex gap-1">
                <Input value={item.question} onChange={e => { const n = [...items]; n[i] = { ...item, question: e.target.value }; update({ items: n }); }} className="h-7 text-xs" placeholder="Pergunta" />
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => update({ items: items.filter((_: any, j: number) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
              </div>
              <Textarea rows={2} value={item.answer} onChange={e => { const n = [...items]; n[i] = { ...item, answer: e.target.value }; update({ items: n }); }} className="text-xs" placeholder="Resposta" />
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => update({ items: [...items, { question: 'Nova pergunta?', answer: 'Resposta...' }] })}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
        </div>
      );
    }
    case 'video':
      return (
        <div className="space-y-3">
          <div><Label className="text-xs">Título</Label><Input value={(c.title as string) || ''} onChange={e => update({ title: e.target.value })} /></div>
          <div><Label className="text-xs">URL do Vídeo (YouTube/Vimeo)</Label><Input value={(c.url as string) || ''} onChange={e => update({ url: e.target.value })} placeholder="https://youtube.com/..." /></div>
        </div>
      );
    case 'divider':
      return (
        <div className="space-y-3">
          <div><Label className="text-xs">Cor</Label><Input type="color" value={(c.color as string) || '#E5E7EB'} onChange={e => update({ color: e.target.value })} className="h-8" /></div>
          <div><Label className="text-xs">Estilo</Label>
            <Select value={(c.style as string) || 'solid'} onValueChange={v => update({ style: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="solid">Sólido</SelectItem><SelectItem value="dashed">Tracejado</SelectItem><SelectItem value="dotted">Pontilhado</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      );
    case 'spacer':
      return (
        <div><Label className="text-xs">Altura</Label><Input value={(c.height as string) || '40px'} onChange={e => update({ height: e.target.value })} /></div>
      );
    default:
      return <p className="text-xs text-muted-foreground">Sem configurações</p>;
  }
}

// ─── Landing Page Editor ───
function LandingPageEditor({ page, onSave, onClose }: { page: LandingPage; onSave: (updates: Partial<LandingPage>) => void; onClose: () => void }) {
  const [sections, setSections] = useState<Section[]>(() => {
    try {
      return (page.content || []).map((s: any) => ({ ...s, id: s.id || crypto.randomUUID() }));
    } catch { return []; }
  });
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'settings' | 'seo'>('sections');
  const [settings, setSettings] = useState({
    seo_title: page.seo_title || '',
    seo_description: page.seo_description || '',
    custom_css: page.custom_css || '',
    slug: page.slug,
    name: page.name,
    description: page.description || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  const addSection = (type: SectionType) => {
    const newSection: Section = { id: crypto.randomUUID(), type, content: getDefaultSectionContent(type) };
    setSections(prev => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
  };

  const updateSection = (id: string, content: Record<string, unknown>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content } : s));
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const moveSection = (id: string, dir: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === id);
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === sections.length - 1)) return;
    const newSections = [...sections];
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    [newSections[idx], newSections[newIdx]] = [newSections[newIdx], newSections[idx]];
    setSections(newSections);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave({
        content: sections as any,
        name: settings.name,
        slug: settings.slug,
        description: settings.description || null,
        seo_title: settings.seo_title || null,
        seo_description: settings.seo_description || null,
        custom_css: settings.custom_css || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
          <div>
            <Input value={settings.name} onChange={e => setSettings(s => ({ ...s, name: e.target.value }))} className="h-7 text-sm font-semibold border-0 p-0 focus-visible:ring-0" />
            <span className="text-xs text-muted-foreground">/{settings.slug}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{sections.length} seções</Badge>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Section Palette */}
        <div className="w-56 border-r flex flex-col shrink-0">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="flex flex-col h-full">
            <TabsList className="mx-2 mt-2 shrink-0">
              <TabsTrigger value="sections" className="text-xs flex-1">Seções</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs flex-1">Config</TabsTrigger>
              <TabsTrigger value="seo" className="text-xs flex-1">SEO</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1">
              <TabsContent value="sections" className="p-2 mt-0 space-y-1.5">
                {sectionTypes.map(({ type, label, icon: Icon }) => (
                  <Button key={type} variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8" onClick={() => addSection(type)}>
                    <Icon className="h-3.5 w-3.5" />{label}
                  </Button>
                ))}
              </TabsContent>
              <TabsContent value="settings" className="p-3 mt-0 space-y-3">
                <div><Label className="text-xs">Nome</Label><Input value={settings.name} onChange={e => setSettings(s => ({ ...s, name: e.target.value }))} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Slug (URL)</Label><Input value={settings.slug} onChange={e => setSettings(s => ({ ...s, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Descrição</Label><Textarea rows={3} value={settings.description} onChange={e => setSettings(s => ({ ...s, description: e.target.value }))} className="text-xs" /></div>
                <div><Label className="text-xs">CSS Customizado</Label><Textarea rows={4} value={settings.custom_css} onChange={e => setSettings(s => ({ ...s, custom_css: e.target.value }))} className="text-xs font-mono" placeholder=".hero { ... }" /></div>
              </TabsContent>
              <TabsContent value="seo" className="p-3 mt-0 space-y-3">
                <div><Label className="text-xs">Título SEO</Label><Input value={settings.seo_title} onChange={e => setSettings(s => ({ ...s, seo_title: e.target.value }))} className="h-8 text-xs" placeholder="Título para mecanismos de busca" /></div>
                <div><Label className="text-xs">Descrição SEO</Label><Textarea rows={3} value={settings.seo_description} onChange={e => setSettings(s => ({ ...s, seo_description: e.target.value }))} className="text-xs" placeholder="Meta description para SEO" /></div>
                <p className="text-[10px] text-muted-foreground">Otimize para mecanismos de busca e compartilhamento em redes sociais.</p>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-hidden flex flex-col bg-muted/30">
          <ScrollArea className="flex-1">
            <div className="max-w-[800px] mx-auto py-6 px-4">
              {sections.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Layout className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Adicione seções da barra lateral para começar</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => addSection('hero')}><Layout className="h-4 w-4 mr-1" />Hero</Button>
                    <Button variant="outline" size="sm" onClick={() => addSection('text')}><Type className="h-4 w-4 mr-1" />Texto</Button>
                    <Button variant="outline" size="sm" onClick={() => addSection('features')}><Star className="h-4 w-4 mr-1" />Features</Button>
                    <Button variant="outline" size="sm" onClick={() => addSection('cta')}><Square className="h-4 w-4 mr-1" />CTA</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map(section => (
                    <div
                      key={section.id}
                      className={`group relative rounded-lg border-2 transition-all cursor-pointer ${selectedSectionId === section.id ? 'border-primary ring-1 ring-primary/20' : 'border-transparent hover:border-muted-foreground/20'}`}
                      onClick={() => setSelectedSectionId(section.id)}
                    >
                      {/* Controls */}
                      <div className="absolute -right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5 z-10">
                        <Button size="icon" variant="secondary" className="h-6 w-6 shadow-sm" onClick={e => { e.stopPropagation(); moveSection(section.id, 'up'); }}><ChevronUp className="h-3 w-3" /></Button>
                        <Button size="icon" variant="secondary" className="h-6 w-6 shadow-sm" onClick={e => { e.stopPropagation(); moveSection(section.id, 'down'); }}><ChevronDown className="h-3 w-3" /></Button>
                        <Button size="icon" variant="secondary" className="h-6 w-6 shadow-sm text-destructive" onClick={e => { e.stopPropagation(); removeSection(section.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      {/* Label */}
                      <div className="absolute -left-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Badge variant="secondary" className="text-[10px] shadow-sm">{sectionTypes.find(t => t.type === section.type)?.label || section.type}</Badge>
                      </div>
                      {/* Preview */}
                      <div className="bg-white dark:bg-card rounded-lg overflow-hidden">
                        <SectionPreview section={section} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Properties */}
        <div className="w-64 border-l shrink-0 flex flex-col">
          <div className="p-3 border-b shrink-0">
            <p className="font-medium text-sm">Propriedades</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3">
              {selectedSection ? (
                <SectionEditor section={selectedSection} onUpdate={content => updateSection(selectedSection.id, content)} />
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">Selecione uma seção para editar</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function LandingPages() {
  const { data: pages = [], isLoading } = useLandingPages();
  const createPage = useCreateLandingPage();
  const updatePage = useUpdateLandingPage();
  const deletePage = useDeleteLandingPage();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [newPage, setNewPage] = useState({ name: '', slug: '', description: '' });

  const handleCreate = async () => {
    if (!newPage.name || !newPage.slug) return toast.error('Nome e slug são obrigatórios');
    await createPage.mutateAsync({
      name: newPage.name,
      slug: newPage.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: newPage.description || null,
      content: [
        { id: crypto.randomUUID(), type: 'hero', content: getDefaultSectionContent('hero') },
        { id: crypto.randomUUID(), type: 'features', content: getDefaultSectionContent('features') },
        { id: crypto.randomUUID(), type: 'cta', content: getDefaultSectionContent('cta') },
      ],
      settings: { theme: 'light', font: 'Inter' },
    });
    setNewPage({ name: '', slug: '', description: '' });
    setShowCreate(false);
  };

  const handleSaveEditor = (updates: Partial<LandingPage>) => {
    if (!editingPage) return;
    updatePage.mutate({ id: editingPage.id, ...updates }, {
      onSuccess: () => {
        setEditingPage(null);
        toast.success('Landing page salva!');
      },
    });
  };

  if (editingPage) {
    return <LandingPageEditor page={editingPage} onSave={handleSaveEditor} onClose={() => setEditingPage(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Landing Pages</h1>
          <p className="text-muted-foreground">Crie páginas de captura e conversão com editor visual</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Landing Page</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Landing Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={newPage.name} onChange={e => setNewPage(p => ({ ...p, name: e.target.value }))} placeholder="Campanha Black Friday" />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input value={newPage.slug} onChange={e => setNewPage(p => ({ ...p, slug: e.target.value }))} placeholder="black-friday" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={newPage.description} onChange={e => setNewPage(p => ({ ...p, description: e.target.value }))} placeholder="Descrição opcional" />
              </div>
              <Button onClick={handleCreate} disabled={createPage.isPending} className="w-full">
                {createPage.isPending ? 'Criando...' : 'Criar Landing Page'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pages.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Layout className="h-16 w-16 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold text-foreground">Nenhuma landing page</h3>
            <p className="text-muted-foreground text-center max-w-md">Crie sua primeira landing page para capturar leads e aumentar suas conversões.</p>
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Criar Agora</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map(page => (
            <Card key={page.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{page.name}</CardTitle>
                    <CardDescription className="text-xs">/{page.slug}</CardDescription>
                  </div>
                  <Badge variant={page.is_published ? 'default' : 'secondary'}>
                    {page.is_published ? 'Publicada' : 'Rascunho'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {page.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{page.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {page.visits_count}</span>
                  <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {page.conversions_count}</span>
                  <span>{page.conversion_rate}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="default" size="sm" onClick={() => setEditingPage(page)}>
                    <Edit className="h-3.5 w-3.5 mr-1" />Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePage.mutate({ id: page.id, is_published: !page.is_published })}
                  >
                    {page.is_published ? 'Despublicar' : 'Publicar'}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => deletePage.mutate(page.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
