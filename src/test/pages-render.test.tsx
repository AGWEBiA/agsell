import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mocking necessary modules and hooks for isolated testing
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));
vi.mock('@/components/permissions/FeatureRequiredPage', () => ({
  FeatureRequiredPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/search/GlobalSearch', () => ({
  GlobalSearch: () => <div>Global Search</div>,
}));
vi.mock('@/components/security/RuntimeProtection', () => ({
  RuntimeProtection: () => <div>Runtime Protection</div>,
}));
vi.mock('@/components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: '1' }, loading: false, isAdmin: false }) }));
vi.mock('@/contexts/OrganizationContext', () => ({ useOrganization: () => ({ currentOrganization: { id: 'org-1' }, organizations: [] }) }));
vi.mock('@/contexts/PermissionsContext', () => ({ usePermissions: () => ({ hasPermission: () => true, hasFeature: () => true }) }));
vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => ({ theme: 'light', setTheme: vi.fn() }) }));
vi.mock('@/contexts/AdminViewContext', () => ({ useAdminView: () => ({ isAdminView: false }) }));
vi.mock('@/hooks/useSubscriptionStatus', () => ({ useSubscriptionStatus: () => ({ isBlocked: false, isLoading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }), data: [], error: null }), data: [], error: null }), insert: vi.fn(), upsert: vi.fn() }),
    auth: { getUser: vi.fn(), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }) },
    channel: () => ({ on: () => ({ subscribe: vi.fn() }), subscribe: vi.fn() }),
    functions: { invoke: vi.fn() },
  },
}));
vi.mock('@/hooks/useContacts', () => ({ useContacts: () => ({ data: [], isLoading: false }) }));
vi.mock('@/hooks/useAutomations', () => ({ useAutomations: () => ({ automations: [], isLoading: false, createAutomation: { mutateAsync: vi.fn() }, updateAutomation: { mutateAsync: vi.fn() }, deleteAutomation: { mutateAsync: vi.fn() } }) }));
vi.mock('@/hooks/useLandingPages', () => ({ useLandingPages: () => ({ data: [], isLoading: false }), useCreateLandingPage: () => ({ mutateAsync: vi.fn(), isPending: false }), useUpdateLandingPage: () => ({ mutateAsync: vi.fn(), isPending: false }), useDeleteLandingPage: () => ({ mutateAsync: vi.fn() }) }));
vi.mock('@/hooks/useContactPreferences', () => ({ useContactPreferences: () => ({ preferences: [], isLoading: false, toggleOptOut: { mutateAsync: vi.fn() }, bulkOptOut: { mutateAsync: vi.fn() } }) }));
vi.mock('@/hooks/useFlowNodeAnalytics', () => ({ useFlowNodeAnalytics: () => ({ data: [], isLoading: false }) }));
vi.mock('@/hooks/useForms', () => ({ useForms: () => ({ forms: [], isLoading: false }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn(), useSearchParams: () => [new URLSearchParams(), vi.fn()], useParams: () => ({}) };
});
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />, XAxis: () => <div />, YAxis: () => <div />,
  CartesianGrid: () => <div />, Tooltip: () => <div />,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div />, Cell: () => <div />, LabelList: () => <div />,
  FunnelChart: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div />, AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div />, Legend: () => <div />,
}));

const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
function P({ children }: any) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}

describe('ChatbotBuilder', () => {
  it('renders', async () => {
    const C = (await import('@/pages/ChatbotBuilder')).default;
    render(<P><C /></P>);
    expect(screen.getByText('Chatbot Builder')).toBeInTheDocument();
  });
});

describe('FunnelPlanner', () => {
  it('renders', async () => {
    const C = (await import('@/pages/FunnelPlanner')).default;
    render(<P><C /></P>);
    expect(screen.getByText('Planejador de Funil')).toBeInTheDocument();
  });
});

describe('FunnelBI', () => {
  it('renders', async () => {
    const C = (await import('@/pages/FunnelBI')).default;
    render(<P><C /></P>);
    expect(screen.getByText('BI do Funil')).toBeInTheDocument();
  });
});

describe('AutomationMetrics', () => {
  it('renders', async () => {
    const C = (await import('@/pages/AutomationMetrics')).default;
    render(<P><C /></P>);
    expect(screen.getByText(/Métricas de Automação/i)).toBeInTheDocument();
  });
});

describe('LandingPages', () => {
  it('renders', async () => {
    const C = (await import('@/pages/LandingPages')).default;
    render(<P><C /></P>);
    expect(screen.getByText('Landing Pages')).toBeInTheDocument();
  });
});

describe('ContactPreferences', () => {
  it('renders with channels', async () => {
    const C = (await import('@/pages/ContactPreferences')).default;
    render(<P><C /></P>);
    expect(screen.getByText(/Preferências de Contato/i)).toBeInTheDocument();
  });
});

describe('FlowBuilder', () => {
  it('renders', async () => {
    const C = (await import('@/pages/FlowBuilder')).default;
    render(<P><C /></P>);
    expect(screen.getByText('Meus Fluxos')).toBeInTheDocument();
  });
});
