import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
      range: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

// Mock contexts
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'test@test.com' }, loading: false }),
}));

vi.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => ({ currentOrganization: { id: 'org-1', name: 'Test Org' } }),
}));

describe('Hook utilities', () => {
  it('should validate required fields', () => {
    const validateRequired = (body: Record<string, unknown>, fields: string[]): string | null => {
      const missing = fields.filter(f => !body[f]);
      return missing.length > 0 ? `Missing: ${missing.join(', ')}` : null;
    };

    expect(validateRequired({ name: 'test', email: '' }, ['name', 'email'])).toBe('Missing: email');
    expect(validateRequired({ name: 'test', email: 'a@b.com' }, ['name', 'email'])).toBeNull();
  });

  it('should handle pagination calculation', () => {
    const calcPages = (total: number, pageSize: number) => Math.ceil(total / pageSize);
    
    expect(calcPages(100, 20)).toBe(5);
    expect(calcPages(0, 20)).toBe(0);
    expect(calcPages(21, 20)).toBe(2);
  });

  it('should format campaign stats correctly', () => {
    const calcDeliveryRate = (sent: number, delivered: number) => 
      sent > 0 ? Math.round((delivered / sent) * 100) : 0;

    expect(calcDeliveryRate(100, 95)).toBe(95);
    expect(calcDeliveryRate(0, 0)).toBe(0);
    expect(calcDeliveryRate(50, 50)).toBe(100);
  });

  it('should validate email format', () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('a@b.c')).toBe(true);
    expect(isValidEmail('')).toBe(false);
  });

  it('should normalize Brazilian phone numbers', () => {
    const normalizeBRPhone = (phone: string): string => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith('55')) {
        return '55' + digits;
      }
      return digits;
    };

    expect(normalizeBRPhone('(11) 99999-9999')).toBe('5511999999999');
    expect(normalizeBRPhone('5511999999999')).toBe('5511999999999');
    expect(normalizeBRPhone('11999999999')).toBe('5511999999999');
  });

  it('should encode/decode campaign sharing codes', () => {
    const campaign = { v: 1, name: 'Test', trigger_type: 'tag_added', actions: [{ id: '1', type: 'send_email' }] };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(campaign))));
    const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    
    expect(decoded.name).toBe('Test');
    expect(decoded.trigger_type).toBe('tag_added');
    expect(decoded.actions).toHaveLength(1);
  });
});

describe('Automation template validation', () => {
  it('should have valid action types in all templates', async () => {
    const { automationTemplates } = await import('@/components/automations/AutomationTemplates');
    const validActionTypes = [
      'send_email', 'send_whatsapp', 'send_sms', 'add_tag', 'remove_tag',
      'update_score', 'create_task', 'send_notification', 'wait',
      'move_deal_stage', 'update_contact', 'webhook', 'condition',
      'assign_agent', 'create_deal', 'send_instagram_dm', 'set_custom_field',
      'subscribe_sequence', 'unsubscribe_sequence', 'http_request',
      'ab_split', 'transfer_human', 'goto_flow', 'send_poll',
    ];

    automationTemplates.forEach(template => {
      expect(template.name).toBeTruthy();
      expect(template.trigger_type).toBeTruthy();
      template.actions.forEach(action => {
        expect(validActionTypes).toContain(action.type);
        expect(action.id).toBeTruthy();
      });
    });
  });

  it('should have unique template IDs', async () => {
    const { automationTemplates } = await import('@/components/automations/AutomationTemplates');
    const ids = automationTemplates.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
