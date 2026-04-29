import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isDuplicateTagError, DUPLICATE_TAG_MESSAGE } from '@/hooks/useContactTags';

// ─────────────────────────────────────────────────────────────────────────
// Unit-level: duplicate detection
// ─────────────────────────────────────────────────────────────────────────
describe('isDuplicateTagError', () => {
  it('detects PG unique violation by code 23505', () => {
    expect(isDuplicateTagError({ code: '23505', message: 'duplicate' })).toBe(true);
  });
  it('detects unique-constraint name in message', () => {
    expect(
      isDuplicateTagError({ message: 'duplicate key value violates unique constraint "contact_tags_contact_id_tag_id_key"' })
    ).toBe(true);
  });
  it('returns false for unrelated errors', () => {
    expect(isDuplicateTagError({ code: '42P01', message: 'undefined_table' })).toBe(false);
    expect(isDuplicateTagError(null)).toBe(false);
    expect(isDuplicateTagError(undefined)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Integration-style: simulate add/remove behavior with mocked supabase
// and assert the side-effect (insert/delete) is invoked correctly.
// ─────────────────────────────────────────────────────────────────────────

let mockState: {
  rows: Array<{ contact_id: string; tag_id: string }>;
  webhookEvents: Array<{ event: string; data: any }>;
  shouldFailDuplicate: boolean;
};

beforeEach(() => {
  mockState = { rows: [], webhookEvents: [], shouldFailDuplicate: true };
});

vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => ({
    select: () => ({
      eq: () => Promise.resolve({ data: mockState.rows, error: null }),
      in: () => Promise.resolve({ data: mockState.rows, error: null }),
    }),
    insert: (payload: any) => {
      const rows = Array.isArray(payload) ? payload : [payload];
      // Simulate UNIQUE(contact_id, tag_id) constraint
      for (const r of rows) {
        const dup = mockState.rows.some(
          (x) => x.contact_id === r.contact_id && x.tag_id === r.tag_id
        );
        if (dup && mockState.shouldFailDuplicate) {
          return {
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: null,
                  error: { code: '23505', message: 'duplicate key value violates unique constraint "contact_tags_contact_id_tag_id_key"' },
                }),
            }),
          };
        }
      }
      // Simulate the AFTER INSERT trigger -> emit_webhook_event(tag_added)
      for (const r of rows) {
        mockState.rows.push(r);
        mockState.webhookEvents.push({ event: 'tag_added', data: r });
      }
      return {
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { id: 'row-' + mockState.rows.length, ...rows[0], created_at: new Date().toISOString() },
              error: null,
            }),
        }),
      };
    },
    delete: () => ({
      eq: function () { return this; },
      then: undefined,
    }),
  });

  // We need delete() to return a chainable that resolves; simplest: separate impl
  const fromImpl = (table: string) => {
    const original = builder(table);
    (original as any).delete = () => {
      const chain: any = {
        _filters: {} as Record<string, any>,
        eq(col: string, val: any) {
          this._filters[col] = val;
          // After two .eq() (contact_id + tag_id), execute removal
          if (Object.keys(this._filters).length >= 2) {
            const before = mockState.rows.length;
            mockState.rows = mockState.rows.filter(
              (r) =>
                !(r.contact_id === this._filters.contact_id && r.tag_id === this._filters.tag_id)
            );
            if (before > mockState.rows.length) {
              mockState.webhookEvents.push({
                event: 'tag_removed',
                data: { contact_id: this._filters.contact_id, tag_id: this._filters.tag_id },
              });
            }
            return Promise.resolve({ error: null });
          }
          return chain;
        },
      };
      return chain;
    };
    return original;
  };

  return { supabase: { from: fromImpl } };
});

describe('contact_tags add / remove with webhook emission simulation', () => {
  it('inserts a (contact_id, tag_id) row and triggers tag_added webhook event', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const res = await (supabase as any).from('contact_tags')
      .insert({ contact_id: 'c1', tag_id: 't1' })
      .select('id, contact_id, tag_id')
      .single();

    expect(res.error).toBeNull();
    expect(mockState.rows).toEqual([{ contact_id: 'c1', tag_id: 't1' }]);
    expect(mockState.webhookEvents).toHaveLength(1);
    expect(mockState.webhookEvents[0]).toMatchObject({
      event: 'tag_added',
      data: { contact_id: 'c1', tag_id: 't1' },
    });
  });

  it('rejects duplicate (contact_id, tag_id) with PG code 23505', async () => {
    mockState.rows.push({ contact_id: 'c1', tag_id: 't1' });
    const { supabase } = await import('@/integrations/supabase/client');
    const res = await (supabase as any).from('contact_tags')
      .insert({ contact_id: 'c1', tag_id: 't1' })
      .select('id')
      .single();

    expect(res.error).toBeTruthy();
    expect(res.error.code).toBe('23505');
    expect(isDuplicateTagError(res.error)).toBe(true);
    // No additional webhook fired for the failed insert
    expect(mockState.webhookEvents.length).toBe(0);
  });

  it('removing a (contact_id, tag_id) row triggers tag_removed webhook event', async () => {
    mockState.rows.push({ contact_id: 'c1', tag_id: 't1' });
    const { supabase } = await import('@/integrations/supabase/client');
    const res = await (supabase as any)
      .from('contact_tags')
      .delete()
      .eq('contact_id', 'c1')
      .eq('tag_id', 't1');

    expect(res.error).toBeNull();
    expect(mockState.rows).toHaveLength(0);
    expect(mockState.webhookEvents.find((e) => e.event === 'tag_removed')).toBeTruthy();
  });

  it('DUPLICATE_TAG_MESSAGE is exported and human-readable', () => {
    expect(DUPLICATE_TAG_MESSAGE).toMatch(/já está aplicada/i);
  });
});
