import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Pricing from '@/pages/Pricing';
import { VendasPlansBox } from '@/components/vendas/VendasPlansBox';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

const mockPlans = [
  {
    id: '1',
    name: 'Active Plan Test',
    slug: 'active',
    is_active: true,
    price_monthly: 100,
    price_yearly: 1000,
    features: ['feature1'],
  },
  {
    id: '2',
    name: 'Inactive Plan Test',
    slug: 'inactive',
    is_active: false,
    price_monthly: 200,
    price_yearly: 2000,
    features: ['feature2'],
  },
];

describe('Active Plans Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'plans_public') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockPlans, error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });
  });

  it('should only show active plans on the Pricing page', async () => {
    render(
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>
    );

    // Check if active plan is visible after loading
    expect(await screen.findByText('Active Plan Test')).toBeInTheDocument();

    // Check if inactive plan is NOT visible
    expect(screen.queryByText('Inactive Plan Test')).not.toBeInTheDocument();
  });

  it('should only show active plans in VendasPlansBox', async () => {
    render(
      <MemoryRouter>
        <VendasPlansBox />
      </MemoryRouter>
    );

    // Check if active plan is visible after loading
    expect(await screen.findByText('Active Plan Test')).toBeInTheDocument();

    // Check if inactive plan is NOT visible
    expect(screen.queryByText('Inactive Plan Test')).not.toBeInTheDocument();
  });
});

