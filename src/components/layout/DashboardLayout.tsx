import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { cn } from '@/lib/utils';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAdminView } from '@/contexts/AdminViewContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Eye, AlertTriangle } from 'lucide-react';

export function DashboardLayout() {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { currentOrganization } = useOrganization();
  const { progress, isLoading } = useOnboarding();
  const { isUserMode, toggleViewMode, simulatedPlan, exitSimulation } = useAdminView();
  const { isPastDue } = useSubscriptionStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentOrganization && !isLoading) {
      const shouldShow = !progress?.completed_at;
      setShowOnboarding(shouldShow);
    }
  }, [currentOrganization, progress, isLoading]);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile backdrop */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <AppSidebar
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileSidebarOpen}
        isMobile={isMobile}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <AppHeader
        sidebarCollapsed={sidebarCollapsed}
        onMenuToggle={handleSidebarToggle}
        isMobile={isMobile}
      />
      
      {/* User Mode Banner */}
      {isUserMode && (
        <div
          className={cn(
            'fixed top-16 right-0 z-20 flex items-center justify-center gap-2 bg-amber-500 text-white text-sm py-1.5 px-4 transition-all duration-300',
            isMobile ? 'left-0' : sidebarCollapsed ? 'left-16' : 'left-64'
          )}
        >
          <Eye className="h-4 w-4" />
          <span className="text-xs sm:text-sm">
            Visualizando como <strong>usuário</strong>
            {simulatedPlan && !isMobile && (
              <> no plano <strong>{simulatedPlan.name}</strong></>
            )}
          </span>
          <button
            onClick={exitSimulation}
            className="ml-2 underline font-medium hover:opacity-80 text-xs sm:text-sm"
          >
            Voltar
          </button>
        </div>
      )}

      {/* Past Due Subscription Banner */}
      {isPastDue && !isUserMode && (
        <div
          className={cn(
            'fixed top-16 right-0 z-20 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground text-sm py-2 px-4 transition-all duration-300',
            isMobile ? 'left-0' : sidebarCollapsed ? 'left-16' : 'left-64'
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs sm:text-sm">
            <strong>Pagamento atrasado!</strong> Sua assinatura não foi renovada. Atualize sua forma de pagamento para evitar o bloqueio.
          </span>
          <button
            onClick={() => navigate('/plans')}
            className="ml-2 underline font-medium hover:opacity-80 text-xs sm:text-sm"
          >
            Renovar
          </button>
        </div>
      )}

      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          isMobile ? 'pl-0' : sidebarCollapsed ? 'pl-16' : 'pl-64',
          isUserMode || isPastDue ? 'pt-[calc(4rem+2rem)]' : 'pt-16'
        )}
      >
        <div className="p-3 sm:p-6">
          <Outlet />
        </div>
      </main>

      <OnboardingWizard 
        open={showOnboarding} 
        onComplete={() => setShowOnboarding(false)} 
      />
    </div>
  );
}
