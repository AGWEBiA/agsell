import React from 'react';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import type { AppModule, AppAction } from '@/hooks/usePermissions';

interface PermissionGateProps {
  module: AppModule;
  action: AppAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ module, action, children, fallback = null }: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermissionsContext();

  if (isLoading) {
    return null;
  }

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Wrapper for multiple permissions (ANY match)
interface PermissionGateAnyProps {
  permissions: Array<{ module: AppModule; action: AppAction }>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGateAny({ permissions, children, fallback = null }: PermissionGateAnyProps) {
  const { hasPermission, isLoading } = usePermissionsContext();

  if (isLoading) {
    return null;
  }

  const hasAny = permissions.some(p => hasPermission(p.module, p.action));

  if (!hasAny) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Wrapper for multiple permissions (ALL required)
interface PermissionGateAllProps {
  permissions: Array<{ module: AppModule; action: AppAction }>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGateAll({ permissions, children, fallback = null }: PermissionGateAllProps) {
  const { hasPermission, isLoading } = usePermissionsContext();

  if (isLoading) {
    return null;
  }

  const hasAll = permissions.every(p => hasPermission(p.module, p.action));

  if (!hasAll) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
