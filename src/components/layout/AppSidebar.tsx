import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Tags,
  CheckSquare,
  Inbox,
  Mail,
  MessageSquare,
  Zap,
  BarChart3,
  Target,
  FileText,
  Link as LinkIcon,
  Settings,
  Bot,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Contatos', icon: Users, path: '/contacts' },
  { label: 'Empresas', icon: Building2, path: '/companies' },
  { label: 'Pipeline', icon: Kanban, path: '/pipeline' },
  { label: 'Tags', icon: Tags, path: '/tags' },
  { label: 'Tarefas', icon: CheckSquare, path: '/tasks' },
  { divider: true },
  { label: 'SAC', icon: Inbox, path: '/inbox' },
  { label: 'E-mail', icon: Mail, path: '/email' },
  { label: 'WhatsApp', icon: MessageSquare, path: '/whatsapp' },
  { divider: true },
  { label: 'Automações', icon: Zap, path: '/automations' },
  { label: 'Lead Scoring', icon: Target, path: '/lead-scoring' },
  { label: 'Formulários', icon: FileText, path: '/forms' },
  { divider: true },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Gamificação', icon: Trophy, path: '/gamification' },
  { label: 'Integrações', icon: LinkIcon, path: '/integrations' },
  { label: 'Assistente IA', icon: Bot, path: '/ai-assistant' },
  { divider: true },
  { label: 'Organização', icon: Building2, path: '/organization' },
  { label: 'Configurações', icon: Settings, path: '/settings' },
];

export function AppSidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">AG</span>
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">AG Sell</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">AG</span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <nav className="space-y-1 p-2">
          {menuItems.map((item, index) => {
            if ('divider' in item) {
              return <div key={index} className="my-2 border-t border-sidebar-border" />;
            }

            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            const linkContent = (
              <Link
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.path}>{linkContent}</div>;
          })}
        </nav>
      </ScrollArea>

      {/* Toggle Button */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center"
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
