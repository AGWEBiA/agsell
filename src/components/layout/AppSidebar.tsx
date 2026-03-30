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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { Logo, LogoIcon } from '@/components/ui/Logo';
import { useAdminView } from '@/contexts/AdminViewContext';
import { usePlans } from '@/hooks/usePlans';

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

const menuSections: MenuSection[] = [
  {
    id: 'daily',
    label: 'Dia a Dia',
    icon: Home,
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Tarefas', icon: CheckSquare, path: '/tasks' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Users,
    items: [
      { label: 'Contatos', icon: Users, path: '/contacts' },
      { label: 'Empresas', icon: Building2, path: '/companies' },
      { label: 'Pipeline', icon: Kanban, path: '/pipeline' },
      { label: 'Win Probability', icon: Brain, path: '/win-probability' },
      { label: 'Sales Routing', icon: Route, path: '/sales-routing' },
      { label: 'Tags', icon: Tags, path: '/tags' },
      { label: 'Preferências', icon: ShieldCheck, path: '/contact-preferences' },
    ],
  },
  {
    id: 'attendance',
    label: 'Atendimento',
    icon: Inbox,
    items: [
      { label: 'Inbox Central', icon: Inbox, path: '/inbox' },
    ],
  },
  {
    id: 'automations',
    label: 'Automações',
    icon: Workflow,
    items: [
      { label: 'Individuais', icon: Smartphone, path: '/flow-builder?channel=whatsapp', featureRequired: 'automacoes' },
      { label: 'Grupos', icon: Users, path: '/flow-builder?channel=groups', featureRequired: 'automacoes' },
      { label: 'Chatbot / Agente IA', icon: Bot, path: '/chatbot-builder', featureRequired: 'automacoes' },
      { label: 'E-mail', icon: Mail, path: '/flow-builder?channel=email', featureRequired: 'automacoes' },
      { label: 'Instagram', icon: Instagram, path: '/flow-builder?channel=instagram', featureRequired: 'automacoes' },
      { label: 'Telegram', icon: Send, path: '/flow-builder?channel=telegram', featureRequired: 'automacoes' },
      { label: 'Campanhas WhatsApp', icon: Megaphone, path: '/whatsapp-campaigns', featureRequired: 'whatsapp' },
      { label: 'Mensagens Grupos', icon: MessageSquare, path: '/whatsapp-group-messages', featureRequired: 'whatsapp' },
    ],
  },
  {
    id: 'growth',
    label: 'Crescimento',
    icon: Rocket,
    items: [
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
    ],
  },
  {
    id: 'intelligence',
    label: 'Inteligência',
    icon: Brain,
    items: [
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
      { label: 'Webhooks', icon: Webhook, path: '/webhooks' },
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
      { label: 'Suporte AG Sell', icon: Headphones, path: '/support-center' },
      { label: 'Central de Ajuda', icon: HelpCircle, path: '/help-center' },
      { label: 'Guia do Sistema', icon: BookOpen, path: '/system-guide' },
      { label: 'Migração de Dados', icon: ArrowRightLeft, path: '/migration' },
    ],
  },
];

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
                ? 'text-sidebar-primary-foreground bg-sidebar-primary/10'
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
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
        hasActiveItem
          ? 'text-sidebar-primary'
          : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/80'
      )}
      aria-expanded={isOpen}
      aria-label={`${isOpen ? 'Recolher' : 'Expandir'} seção ${section.label}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
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
  item, isActive, collapsed, onNavigate, isLocked,
}: {
  item: MenuItem; isActive: boolean; collapsed: boolean; onNavigate?: () => void; isLocked?: boolean;
}) {
  const Icon = item.icon;

  const linkContent = (
    <Link
      to={isLocked ? '/plans' : item.path}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        collapsed ? 'justify-center' : 'ml-2',
        isLocked
          ? 'text-sidebar-foreground/40 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent/50'
          : isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
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

export function AppSidebar({ collapsed, onToggle, mobileOpen, isMobile, onClose }: SidebarProps) {
  const location = useLocation();
  const { currentPlan } = usePlans();
  const planFeatures = currentPlan?.features ?? [];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuSections.forEach((section) => {
      const hasActive = section.items.some((item) => {
        const itemPath = item.path.split('?')[0];
        return location.pathname === itemPath;
      });
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

  // On mobile, sidebar is an overlay drawer
  if (isMobile) {
    return (
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/dashboard" onClick={onClose}>
            <Logo variant="red" size="md" showText />
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="space-y-1 p-2" aria-label="Menu principal">
            {filteredSections.map((section) => {
              if (section.items.length === 0) return null;
              const hasActiveItem = section.items.some((item) => location.pathname === item.path.split('?')[0]);
              const isOpen = openSections[section.id] ?? false;

              return (
                <div key={section.id} className="py-0.5">
                  <SectionHeader
                    section={section}
                    isOpen={isOpen}
                    onToggle={() => toggleSection(section.id)}
                    collapsed={false}
                    hasActiveItem={hasActiveItem}
                  />
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200 ease-in-out',
                      isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                    )}
                    role="group"
                    aria-label={section.label}
                  >
                    <div className="mt-0.5 space-y-0.5">
                      {section.items.map((item) => (
                        <MenuItemLink
                          key={item.path}
                          item={item}
                          isActive={location.pathname === item.path.split('?')[0] && location.search === (item.path.includes('?') ? '?' + item.path.split('?')[1] : '')}
                          collapsed={false}
                          onNavigate={onClose}
                          isLocked={!!item.featureRequired && !planFeatures.includes(item.featureRequired)}
                        />
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

  // Desktop sidebar
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
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
      </div>

      <ScrollArea className="h-[calc(100vh-4rem-3rem)]">
        <nav className="space-y-1 p-2" aria-label="Menu principal">
          {filteredSections.map((section) => {
            if (section.items.length === 0) return null;
            const hasActiveItem = section.items.some((item) => location.pathname === item.path.split('?')[0]);
            const isOpen = openSections[section.id] ?? false;

            return (
              <div key={section.id} className="py-0.5">
                <SectionHeader
                  section={section}
                  isOpen={isOpen}
                  onToggle={() => toggleSection(section.id)}
                  collapsed={collapsed}
                  hasActiveItem={hasActiveItem}
                />
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200 ease-in-out',
                    isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                  role="group"
                  aria-label={section.label}
                >
                  <div className="mt-0.5 space-y-0.5">
                    {section.items.map((item) => (
                      <MenuItemLink
                        key={item.path}
                        item={item}
                        isActive={location.pathname === item.path.split('?')[0] && location.search === (item.path.includes('?') ? '?' + item.path.split('?')[1] : '')}
                        collapsed={collapsed}
                        isLocked={!!item.featureRequired && !planFeatures.includes(item.featureRequired)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Recolher</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
