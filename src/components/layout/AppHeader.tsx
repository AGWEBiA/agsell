import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAdminView } from '@/contexts/AdminViewContext';
import { usePlans, Plan } from '@/hooks/usePlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Search, Sun, Moon, User, Settings, LogOut, HelpCircle,
  Eye, Shield, Crown, Menu, Inbox, Users, Kanban,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { AgencyAccountSelector } from '@/components/agency/AgencyAccountSelector';
import { OrganizationSwitcher } from '@/components/organization/OrganizationSwitcher';
import { cn } from '@/lib/utils';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMenuToggle?: () => void;
  isMobile?: boolean;
}

export function AppHeader({ sidebarCollapsed, onMenuToggle, isMobile }: HeaderProps) {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isUserMode, toggleViewMode, simulatedPlan, setSimulatedPlan } = useAdminView();
  const { plans } = usePlans();
  const navigate = useNavigate();
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const userInitials = userName.slice(0, 2).toUpperCase();

  const handleSimulatePlan = (plan: Plan) => {
    setSimulatedPlan(plan);
    if (!isUserMode) toggleViewMode();
    setShowPlanPicker(false);
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-3 sm:px-6 transition-all duration-300',
          isMobile ? 'left-0' : sidebarCollapsed ? 'left-16' : 'left-64'
        )}
      >
        {/* Left section */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onMenuToggle} className="shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {/* Search - hidden on mobile, visible on sm+ */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar... (Ctrl+K)"
              className="w-48 pl-9 lg:w-80"
            />
          </div>
          {/* Mobile search icon */}
          {isMobile && (
            <Button variant="ghost" size="icon" className="shrink-0">
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Quick access icons - desktop only */}
        {!isMobile && (
          <div className="hidden md:flex items-center gap-0.5">
            {[
              { icon: Inbox, path: '/inbox', label: 'Inbox' },
              { icon: Users, path: '/contacts', label: 'Contatos' },
              { icon: Kanban, path: '/pipeline', label: 'Pipeline' },
            ].map(({ icon: Icon, path, label }) => (
              <Tooltip key={path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => navigate(path)}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Organization switcher - hidden on mobile */}
          <div className="hidden md:block">
            <OrganizationSwitcher />
          </div>

          {/* Agency selector - hidden on mobile */}
          <div className="hidden md:block">
            <AgencyAccountSelector />
          </div>

          {/* Admin buttons - hidden on mobile */}
          {isAdmin && !isMobile && (
            <>
              <Button
                variant="outline" size="sm"
                onClick={() => setShowPlanPicker(true)}
                className="gap-2 text-xs"
              >
                <Crown className="h-4 w-4" />
                <span className="hidden lg:inline">Simular Plano</span>
              </Button>
              <Button
                variant={isUserMode ? 'default' : 'outline'} size="sm"
                onClick={toggleViewMode}
                className="gap-2 text-xs"
              >
                {isUserMode ? (
                  <>
                    <Eye className="h-4 w-4" />
                    <span className="hidden lg:inline">Visão Usuário</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span className="hidden lg:inline">Visão Admin</span>
                  </>
                )}
              </Button>
            </>
          )}

          {/* Theme */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Help - hidden on mobile */}
          {!isMobile && (
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt={userName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="mr-2 h-4 w-4" /> Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Plan Picker Dialog */}
      <Dialog open={showPlanPicker} onOpenChange={setShowPlanPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Simular Plano
            </DialogTitle>
            <DialogDescription>
              Selecione um plano para visualizar o sistema como um usuário desse plano.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-4">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handleSimulatePlan(plan)}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-accent text-left',
                  simulatedPlan?.id === plan.id ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {plan.max_contacts === -1 ? '∞' : plan.max_contacts} contatos
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {plan.max_users === -1 ? '∞' : plan.max_users} usuários
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {plan.max_emails_per_month === -1 ? '∞' : plan.max_emails_per_month} emails/mês
                    </Badge>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-bold text-lg">
                    {plan.price_monthly === 0 ? 'Grátis' : `R$ ${plan.price_monthly}`}
                  </p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>
              </button>
            ))}
            {simulatedPlan && (
              <Button
                variant="outline"
                onClick={() => { setSimulatedPlan(null); setShowPlanPicker(false); }}
                className="mt-2"
              >
                Remover Simulação
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
