import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowExpired?: boolean;
}

export function ProtectedRoute({ children, allowExpired = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const { isBlocked, isLoading: subLoading } = useSubscriptionStatus();

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isBlocked && !allowExpired && !isAdmin) {
    return <Navigate to="/subscription-expired" replace />;
  }

  return <>{children}</>;
}
