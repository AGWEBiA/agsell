import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Building2, Kanban, Tags, CheckSquare,
  Inbox, Mail, MessageSquare, Zap, BarChart3, Target, FileText,
  Link as LinkIcon, Settings, Bot, Brain, ChevronLeft, ChevronRight,
  ChevronDown, Trophy, Shield, Key, Webhook, SlidersHorizontal,
  Instagram, ListChecks, Home, Megaphone, Lightbulb, Wrench, Headphones,
  HelpCircle, Briefcase, X, FlaskConical, Rocket, GitBranch, Send,
  Lock, BookOpen, Workflow, ArrowRightLeft, Ticket, ShieldCheck, Activity,
  Layout, Clock, Sparkles, Smile, Route, Crosshair, Wand2, Monitor,
  Phone, PhoneCall, DollarSign, Crown, Smartphone, QrCode, Server, Globe,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { Logo, LogoIcon } from '@/components/ui/Logo';
import { useAdminView } from '@/contexts/AdminViewContext';
import { usePlans } from '@/hooks/usePlans';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  adminOnly?: boolean;
  orgAdminOnly?: boolean;
  featureRequired?: string;
}

interface MenuSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

// Quick access favorites (always visible at top)
const favoriteItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'SAC', icon: Inbox, path: '/inbox' },
  { label: 'Contatos', icon: Users, path: '/contacts' },
  { label: 'Pipeline', icon: Kanban, path: '/pipeline' },
];

// Merged sections: 8 → 6
const menuSections: MenuSection[] = [
  {
    id: 'daily',
    label: 'Dia a Dia',
    icon: Home,
    items: [
      { label: 'Tarefas', icon: CheckSquare, path: '/tasks' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Users,
    items: [
      { label: 'Painel CRM', icon: BarChart3, path: '/crm-admin', orgAdminOnly: true },
      { label: 'Deals', icon: ListChecks, path: '/deals' },
      { label: 'Inteligência', icon: Brain, path: '/crm-intelligence-consolidated' },
    ],
  },
  {
    id: 'automations',
    label: 'Automações',
    icon: Workflow,
    items: [
      { label: 'Individuais', icon: Smartphone, path: '/flow-builder?channel=whatsapp', featureRequired: 'automacoes' },
      { label: 'Grupos', icon: Users, path: '/flow-builder?channel=groups', featureRequired: 'automacoes' },
      { label: 'Instagram', icon: Instagram, path: '/flow-builder?channel=instagram', featureRequired: 'automacoes' },
      { label: 'Chatbot / Agente IA', icon: Bot, path: '/chatbot-builder', featureRequired: 'automacoes' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Analytics',
    icon: Rocket,
    items: [
      // Growth
      { label: 'E-mail Marketing', icon: Send, path: '/email', featureRequired: 'email_marketing' },
      { label: 'Campanhas SMS/VoIP', icon: Megaphone, path: '/communication-campaigns' },
      { label: 'Growth Tools', icon: Rocket, path: '/growth-tools' },
      { label: 'Formulários', icon: FileText, path: '/forms' },
      { label: 'Landing Pages', icon: Layout, path: '/landing-pages' },
      { label: 'Testes A/B', icon: FlaskConical, path: '/ab-tests' },
      { label: 'Planejador Funil', icon: Target, path: '/funnel-planner' },
      { label: 'Event Tracking', icon: Activity, path: '/event-tracking' },
      { label: 'Site Tracking', icon: Monitor, path: '/site-tracking' },
      { label: 'Predictive Send', icon: Clock, path: '/predictive-sending' },
      { label: 'Metas', icon: Crosshair, path: '/goals' },
      { label: 'Conteúdo Dinâmico', icon: Wand2, path: '/conditional-content' },
      // Intelligence
      { label: 'Analytics', icon: BarChart3, path: '/analytics', featureRequired: 'analytics' },
      { label: 'BI do Funil', icon: Target, path: '/funnel-bi' },
      { label: 'Métricas Automação', icon: Activity, path: '/automation-metrics' },
      { label: 'Custom Reports', icon: ListChecks, path: '/custom-reports' },
      { label: 'Revenue', icon: DollarSign, path: '/revenue-reporting' },
      { label: 'Atribuição', icon: GitBranch, path: '/attribution' },
      { label: 'Sentimento', icon: Smile, path: '/sentiment' },
      { label: 'Lead Scoring', icon: Target, path: '/lead-scoring', featureRequired: 'lead_scoring' },
      { label: 'Assistente IA', icon: Bot, path: '/ai-assistant' },
      { label: 'Agentes IA', icon: Brain, path: '/ai-agents' },
      { label: 'AI Builder', icon: Sparkles, path: '/ai-builder' },
      { label: 'Gamificação', icon: Trophy, path: '/gamification' },
    ],
  },
  {
    id: 'config',
    label: 'Configurações',
    icon: Settings,
    items: [
      { label: 'Organização', icon: Building2, path: '/organization', orgAdminOnly: true },
      { label: 'Permissões', icon: Shield, path: '/permissions', orgAdminOnly: true },
      { label: 'Planos', icon: Target, path: '/plans' },
      { label: 'Clientes (Agência)', icon: Briefcase, path: '/agency-clients', featureRequired: 'agency_management' },
      { label: 'Canais', icon: Send, path: '/channels' },
      { label: 'WhatsApp', icon: Smartphone, path: '/whatsapp', featureRequired: 'whatsapp' },
      { label: 'Templates API', icon: FileText, path: '/whatsapp-templates', featureRequired: 'whatsapp' },
      { label: 'Grupos Pagos', icon: Crown, path: '/paid-groups', featureRequired: 'paid_groups' },
      { label: 'Direcionador Grupos', icon: Route, path: '/group-rotator', featureRequired: 'whatsapp' },
      { label: 'VoIP & Ligações', icon: PhoneCall, path: '/voip' },
      { label: 'Integrações', icon: LinkIcon, path: '/integrations' },
      { label: 'API Keys', icon: Key, path: '/api-keys', orgAdminOnly: true },
      { label: 'Webhooks (Entrada)', icon: Webhook, path: '/webhooks' },
      { label: 'Webhooks (Saída)', icon: Webhook, path: '/api-webhooks', orgAdminOnly: true },
      { label: 'Domínio E-mail', icon: Mail, path: '/email-domain' },
      { label: 'Config. SAC', icon: SlidersHorizontal, path: '/inbox-settings', orgAdminOnly: true },
      { label: 'Relatórios SAC', icon: BarChart3, path: '/inbox-reports' },
      { label: 'Portal de Suporte', icon: Headphones, path: '/support-portal-settings', orgAdminOnly: true, featureRequired: 'customer_support_center' },
      { label: 'Configurações', icon: Settings, path: '/settings' },
      { label: 'Admin', icon: Shield, path: '/admin', adminOnly: true },
    ],
  },
  {
    id: 'help',
    label: 'Ajuda',
    icon: HelpCircle,
    items: [
      { label: 'Suporte IA', icon: MessageSquare, path: '/support-center' },
      { label: 'Central de Ajuda', icon: HelpCircle, path: '/help-center' },
      { label: 'Guia do Sistema', icon: BookOpen, path: '/system-guide' },
      { label: 'Migração de Dados', icon: ArrowRightLeft, path: '/migration' },
    ],
  },
];

function getItemPathBase(path: string) {
  return path.split('?')[0];
}

function SectionHeader({
  section, isOpen, onToggle, collapsed, hasActiveItem,
}: {
  section: MenuSection; isOpen: boolean; onToggle: () => void; collapsed: boolean; hasActiveItem: boolean;
}) {
  const Icon = section.icon;

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            className={cn(
              'flex w-full items-center justify-center rounded-lg p-2 transition-colors',
              hasActiveItem
                ? 'text-primary bg-primary/10'
                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
            )}
            aria-label={section.label}
            aria-expanded={isOpen}
          >
            <Icon className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {section.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      onClick={onToggle}
      className={cn(
        'group relative flex w-full items-center gap-2 rounded-md pl-4 pr-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-all',
        hasActiveItem
          ? 'text-foreground bg-sidebar-accent/40'
          : 'text-sidebar-foreground/70 hover:text-foreground hover:bg-sidebar-accent/30'
      )}
      aria-expanded={isOpen}
      aria-label={`${isOpen ? 'Recolher' : 'Expandir'} seção ${section.label}`}
    >
      {/* Faixa lateral vermelha (hub indicator) */}
      <span
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all',
          hasActiveItem ? 'h-6 bg-primary' : 'h-3 bg-primary/40 group-hover:h-5 group-hover:bg-primary/70'
        )}
        aria-hidden="true"
      />
      <Icon className={cn('h-4 w-4 shrink-0', hasActiveItem ? 'text-primary' : 'text-sidebar-foreground/55 group-hover:text-primary/80')} />
      <span className="flex-1 text-left">{section.label}</span>
      <ChevronDown
        className={cn(
          'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
          isOpen ? 'rotate-0' : '-rotate-90'
        )}
      />
    </button>
  );
}

function MenuItemLink({
  item, isActive, collapsed, onNavigate, isLocked, isSecondary, sectionId,
}: {
  item: MenuItem; isActive: boolean; collapsed: boolean; onNavigate?: () => void; isLocked?: boolean; isSecondary?: boolean; sectionId?: string;
}) {
  const Icon = item.icon;
  const isRedSection = sectionId === 'crm' || sectionId === 'automations' || item.path.startsWith('/crm-') || item.path === '/deals' || item.path === '/crm-settings' || item.path.includes('/flow-builder') || item.path === '/chatbot-builder';


  const linkContent = (
    <Link
      to={isLocked ? '/plans' : item.path}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
        collapsed ? 'justify-center mx-1' : 'ml-2 mr-1',
        isLocked
          ? 'text-sidebar-foreground/35 hover:text-sidebar-foreground/55 hover:bg-sidebar-accent/40'
          : isActive
            ? isRedSection 
              ? 'bg-[#c0392b] text-white font-semibold shadow-md'
              : 'bg-gradient-to-r from-primary/15 via-primary/5 to-transparent text-foreground font-semibold'
            : isSecondary
              ? 'text-sidebar-foreground/45 hover:text-sidebar-foreground/75 hover:bg-sidebar-accent/30 text-[11px]'
              : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Indicador vermelho à esquerda (estilo vídeo) */}
      {isActive && !collapsed && !isSecondary && (
        <span
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full",
            isRedSection ? "bg-white/40" : "bg-primary"
          )}
          aria-hidden="true"
        />
      )}
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-colors',
          isActive 
            ? isRedSection ? 'text-white' : 'text-primary' 
            : isSecondary ? 'h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60' : 'text-sidebar-foreground/55 group-hover:text-sidebar-foreground/90'
        )}
      />
      {!collapsed && (
        <>
          <span className={cn("flex-1 truncate", isSecondary && "text-[12px]")}>{item.label}</span>
          {isLocked && <Lock className="h-3.5 w-3.5 shrink-0 opacity-50" />}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}{isLocked ? ' 🔒' : ''}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

function FavoritesSection({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <div className="py-1">
      {!collapsed && (
        <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
          <Star className="h-3 w-3" />
          <span>Acesso Rápido</span>
        </div>
      )}
      <div className="space-y-0.5">
        {favoriteItems.map((item) => {
          const itemBase = getItemPathBase(item.path);
          const isActive = location.pathname === itemBase;
          return (
            <MenuItemLink
              key={item.path}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          );
        })}
      </div>
    </div>
  );
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, isMobile, onClose }: SidebarProps) {
  const location = useLocation();
  const { currentPlan } = usePlans();
  const planFeatures = currentPlan?.features ?? [];

  // FIX: Auto-expand the section containing the active route
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuSections.forEach((section) => {
      const hasActive = section.items.some((item) => {
        const itemPath = getItemPathBase(item.path);
        return location.pathname === itemPath;
      });
      if (hasActive) {
        initial[section.id] = true;
      }
    });
    return initial;
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const { user, isAdmin } = useAuth();
  const { isUserMode } = useAdminView();

  const filteredSections = menuSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.adminOnly && (!isAdmin || isUserMode)) return false;
      if (item.orgAdminOnly && isUserMode) return false;
      return true;
    }),
  }));

  const renderSections = (sidebarCollapsed: boolean, navigateCallback?: () => void) => (
    <>
      <FavoritesSection collapsed={sidebarCollapsed} onNavigate={navigateCallback} />
      <Separator className="mx-2 my-1 bg-sidebar-border" />
      {filteredSections.map((section) => {
        if (section.items.length === 0) return null;
        const hasActiveItem = section.items.some((item) => location.pathname === getItemPathBase(item.path));
        const isOpen = openSections[section.id] ?? false;

        return (
          <div key={section.id} className="py-0.5">
            <SectionHeader
              section={section}
              isOpen={isOpen}
              onToggle={() => toggleSection(section.id)}
              collapsed={sidebarCollapsed}
              hasActiveItem={hasActiveItem}
            />
            <div
              className={cn(
                'overflow-hidden transition-all duration-200 ease-in-out',
                isOpen ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'
              )}
              role="group"
              aria-label={section.label}
            >
              <div className="mt-0.5 space-y-0.5">
                {section.items.map((item) => (
                  <MenuItemLink
                    key={item.path}
                    item={item}
                    isActive={(() => {
                      const itemBase = getItemPathBase(item.path);
                      if (location.pathname !== itemBase) return false;
                      
                      // Check for required search params if they exist in item.path
                      if (item.path.includes('?')) {
                        const requiredParams = new URLSearchParams(item.path.split('?')[1]);
                        const currentParams = new URLSearchParams(location.search);
                        for (const [key, value] of requiredParams.entries()) {
                          if (currentParams.get(key) !== value) return false;
                        }
                      }
                      return true;
                    })()}
                    collapsed={sidebarCollapsed}
                    onNavigate={navigateCallback}
                    isLocked={!!item.featureRequired && !planFeatures.includes(item.featureRequired)}
                    sectionId={section.id}
                  />
                ))}
                {section.id === 'crm' && (
                  <>
                    {!sidebarCollapsed && <Separator className="mx-4 my-2 opacity-30" />}
                    <MenuItemLink
                      item={{ label: 'Configurações CRM', icon: Settings, path: '/crm-settings' }}
                      isActive={location.pathname === '/crm-settings'}
                      collapsed={sidebarCollapsed}
                      onNavigate={navigateCallback}
                      isSecondary
                      sectionId="crm"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );

  // Mobile sidebar
  if (isMobile) {
    return (
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="relative flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/dashboard" onClick={onClose}>
            <Logo variant="red" size="md" showText />
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <span className="absolute bottom-0 left-0 h-[2px] w-16 bg-primary" aria-hidden="true" />
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="space-y-1 p-2" aria-label="Menu principal">
            {renderSections(false, onClose)}
          </nav>
        </ScrollArea>
      </aside>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="relative flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link to="/dashboard">
            <Logo variant="red" size="md" showText />
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="mx-auto">
            <LogoIcon variant="red" size="md" />
          </Link>
        )}
        <span
          className={cn(
            'absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-300',
            collapsed ? 'w-10' : 'w-16'
          )}
          aria-hidden="true"
        />
      </div>

      <ScrollArea className="h-[calc(100vh-4rem-3rem)]">
        <nav className="space-y-1 p-2" aria-label="Menu principal">
          {renderSections(collapsed)}
        </nav>
      </ScrollArea>

      <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-2 bg-sidebar">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Recolher</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
