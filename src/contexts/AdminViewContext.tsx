import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Plan } from '@/hooks/usePlans';

interface AdminViewContextType {
  isUserMode: boolean;
  toggleViewMode: () => void;
  simulatedPlan: Plan | null;
  setSimulatedPlan: (plan: Plan | null) => void;
  exitSimulation: () => void;
}

const AdminViewContext = createContext<AdminViewContextType>({
  isUserMode: false,
  toggleViewMode: () => {},
  simulatedPlan: null,
  setSimulatedPlan: () => {},
  exitSimulation: () => {},
});

export function AdminViewProvider({ children }: { children: React.ReactNode }) {
  const [isUserMode, setIsUserMode] = useState(false);
  const [simulatedPlan, setSimulatedPlan] = useState<Plan | null>(null);

  const toggleViewMode = useCallback(() => {
    setIsUserMode(prev => {
      if (prev) {
        // Exiting user mode, clear simulated plan
        setSimulatedPlan(null);
      }
      return !prev;
    });
  }, []);

  const exitSimulation = useCallback(() => {
    setIsUserMode(false);
    setSimulatedPlan(null);
  }, []);

  return (
    <AdminViewContext.Provider value={{ isUserMode, toggleViewMode, simulatedPlan, setSimulatedPlan, exitSimulation }}>
      {children}
    </AdminViewContext.Provider>
  );
}

export function useAdminView() {
  return useContext(AdminViewContext);
}
