import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { cn } from '@/lib/utils';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAdminView } from '@/contexts/AdminViewContext';
import { Eye } from 'lucide-react';

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { currentOrganization } = useOrganization();
  const { progress, isLoading } = useOnboarding();
  const { isUserMode, toggleViewMode, simulatedPlan, exitSimulation } = useAdminView();

  useEffect(() => {
    if (currentOrganization && !isLoading) {
      const shouldShow = !progress?.completed_at;
      setShowOnboarding(shouldShow);
    }
  }, [currentOrganization, progress, isLoading]);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <AppHeader sidebarCollapsed={sidebarCollapsed} />
      
      {/* User Mode Banner */}
      {isUserMode && (
        <div
          className={cn(
            'fixed top-16 right-0 z-20 flex items-center justify-center gap-2 bg-amber-500 text-white text-sm py-1.5 px-4 transition-all duration-300',
            sidebarCollapsed ? 'left-16' : 'left-64'
          )}
        >
          <Eye className="h-4 w-4" />
          <span>
            Você está visualizando como <strong>usuário comum</strong>
            {simulatedPlan && (
              <> no plano <strong>{simulatedPlan.name}</strong></>
            )}
            .
          </span>
          <button
            onClick={exitSimulation}
            className="ml-2 underline font-medium hover:opacity-80"
          >
            Voltar para Admin
          </button>
        </div>
      )}

      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'pl-16' : 'pl-64',
          isUserMode ? 'pt-[calc(4rem+2rem)]' : 'pt-16'
        )}
      >
        <div className="p-6">
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
