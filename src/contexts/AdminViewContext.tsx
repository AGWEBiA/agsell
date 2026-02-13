import React, { createContext, useContext, useState, useCallback } from 'react';

interface AdminViewContextType {
  isUserMode: boolean;
  toggleViewMode: () => void;
}

const AdminViewContext = createContext<AdminViewContextType>({
  isUserMode: false,
  toggleViewMode: () => {},
});

export function AdminViewProvider({ children }: { children: React.ReactNode }) {
  const [isUserMode, setIsUserMode] = useState(false);

  const toggleViewMode = useCallback(() => {
    setIsUserMode(prev => !prev);
  }, []);

  return (
    <AdminViewContext.Provider value={{ isUserMode, toggleViewMode }}>
      {children}
    </AdminViewContext.Provider>
  );
}

export function useAdminView() {
  return useContext(AdminViewContext);
}
