import { describe, it, expect } from 'vitest';
import { actionOptions, nodeCategories, triggerOptions, conditionOptions } from '@/components/flow-builder/flowNodeTypes';

describe('Flow Node Types', () => {
  it('has all core node types defined', () => {
    const ids = actionOptions.map(n => n.id);
    expect(ids).toContain('send_whatsapp');
    expect(ids).toContain('send_email_marketing');
    expect(ids).toContain('send_sms');
    expect(ids).toContain('timer');
    expect(ids).toContain('conditional');
    expect(ids).toContain('add_tag');
    expect(ids).toContain('voice_torpedo');
    expect(ids).toContain('parallel_channels');
    expect(ids).toContain('note');
    expect(ids).toContain('link_split');
    expect(ids).toContain('edit_whatsapp_group');
    expect(ids).toContain('sequence_lead');
    expect(ids).toContain('sequence_transaction');
    expect(ids).toContain('sequence_rewarming');
    expect(ids).toContain('sequence_optin');
  });

  it('each node has id, label, icon', () => {
    for (const node of actionOptions) {
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('label');
      expect(node).toHaveProperty('icon');
    }
  });

  it('nodeCategories cover all expected groups', () => {
    const labels = nodeCategories.map(c => c.label);
    expect(labels).toContain('WhatsApp');
    expect(labels).toContain('Instagram');
    expect(labels).toContain('E-mail');
    expect(labels).toContain('Avançado');
    expect(labels).toContain('SMS / Voz');
    expect(labels).toContain('Tags');
  });

  it('triggerOptions has whatsapp and instagram triggers', () => {
    const ids = triggerOptions.map(t => t.id);
    expect(ids).toContain('whatsapp_received');
    expect(ids).toContain('instagram_comment');
    expect(ids).toContain('contact_created');
    expect(ids).toContain('form_submitted');
    expect(ids).toContain('page_visited');
    expect(ids).toContain('site_event');
  });

  it('conditionOptions are defined', () => {
    expect(conditionOptions.length).toBeGreaterThan(0);
  });

  it('voice_torpedo node exists', () => {
    const node = actionOptions.find(n => n.id === 'voice_torpedo');
    expect(node).toBeDefined();
    expect(node!.label).toMatch(/Torpedo|Voz/i);
  });

  it('parallel_channels (fishbone) node exists', () => {
    expect(actionOptions.find(n => n.id === 'parallel_channels')).toBeDefined();
  });

  it('link_split node exists', () => {
    expect(actionOptions.find(n => n.id === 'link_split')).toBeDefined();
  });

  it('note node exists', () => {
    expect(actionOptions.find(n => n.id === 'note')).toBeDefined();
  });
});
