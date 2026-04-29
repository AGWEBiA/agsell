import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Replica a lógica de progressão de status do whatsapp-webhook (messages.upsert).
 *
 * Regras:
 * - Ranking: pending=0, sent=1, delivered=2, read=3, failed=-1
 * - Só atualiza se newStatus tiver rank MAIOR que o atual (não pode "voltar")
 * - Aceita strings (PENDING, SERVER_ACK, DELIVERY_ACK, READ) e códigos numéricos (0-5)
 * - failed é terminal e pode ser definido a qualquer momento (rank -1 é tratado à parte)
 */

type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

const RANK: Record<DeliveryStatus, number> = {
  failed: -1,
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

function mapEvolutionStatus(raw: string | number | undefined | null): DeliveryStatus | null {
  if (raw === null || raw === undefined) return null;
  const s = typeof raw === 'string' ? raw.toUpperCase() : raw;

  if (s === 'PENDING' || s === 0 || s === 1) return 'pending';
  if (s === 'SERVER_ACK' || s === 'SENT' || s === 2) return 'sent';
  if (s === 'DELIVERY_ACK' || s === 'DELIVERED' || s === 3) return 'delivered';
  if (s === 'READ' || s === 'PLAYED' || s === 4 || s === 5) return 'read';
  if (s === 'ERROR' || s === 'FAILED') return 'failed';

  return null;
}

function applyStatusUpdate(current: DeliveryStatus, incoming: DeliveryStatus | null): DeliveryStatus {
  if (incoming === null) return current;
  // failed é terminal — pode sobrescrever qualquer estado não-final
  if (incoming === 'failed') return 'failed';
  if (current === 'failed') return 'failed'; // não desfaz failed
  // só faz upgrade
  return RANK[incoming] > RANK[current] ? incoming : current;
}

interface UpsertEvent {
  fromMe: boolean;
  status?: string | number;
  externalId: string;
}

/** Simula o processamento sequencial de eventos messages.upsert para uma mensagem outbound. */
function simulateMessageLifecycle(events: UpsertEvent[], initial: DeliveryStatus = 'pending'): DeliveryStatus {
  let status: DeliveryStatus = initial;
  for (const ev of events) {
    if (!ev.fromMe) continue; // ignorar eventos de mensagens recebidas
    const mapped = mapEvolutionStatus(ev.status);
    status = applyStatusUpdate(status, mapped);
  }
  return status;
}

describe('WhatsApp delivery_status — mapeamento Evolution → interno', () => {
  it('mapeia strings conhecidas', () => {
    expect(mapEvolutionStatus('PENDING')).toBe('pending');
    expect(mapEvolutionStatus('SERVER_ACK')).toBe('sent');
    expect(mapEvolutionStatus('DELIVERY_ACK')).toBe('delivered');
    expect(mapEvolutionStatus('READ')).toBe('read');
    expect(mapEvolutionStatus('PLAYED')).toBe('read');
    expect(mapEvolutionStatus('ERROR')).toBe('failed');
  });

  it('mapeia códigos numéricos', () => {
    expect(mapEvolutionStatus(0)).toBe('pending');
    expect(mapEvolutionStatus(1)).toBe('pending');
    expect(mapEvolutionStatus(2)).toBe('sent');
    expect(mapEvolutionStatus(3)).toBe('delivered');
    expect(mapEvolutionStatus(4)).toBe('read');
    expect(mapEvolutionStatus(5)).toBe('read');
  });

  it('é case-insensitive', () => {
    expect(mapEvolutionStatus('server_ack')).toBe('sent');
    expect(mapEvolutionStatus('delivery_ack')).toBe('delivered');
    expect(mapEvolutionStatus('read')).toBe('read');
  });

  it('retorna null para valores desconhecidos', () => {
    expect(mapEvolutionStatus('FOO')).toBeNull();
    expect(mapEvolutionStatus(null)).toBeNull();
    expect(mapEvolutionStatus(undefined)).toBeNull();
  });
});

describe('WhatsApp delivery_status — progressão pending → sent → delivered → read', () => {
  it('progride completo na ordem natural', () => {
    const final = simulateMessageLifecycle([
      { fromMe: true, status: 'PENDING', externalId: 'm1' },
      { fromMe: true, status: 'SERVER_ACK', externalId: 'm1' },
      { fromMe: true, status: 'DELIVERY_ACK', externalId: 'm1' },
      { fromMe: true, status: 'READ', externalId: 'm1' },
    ]);
    expect(final).toBe('read');
  });

  it('passa por sent quando recebe apenas SERVER_ACK', () => {
    expect(simulateMessageLifecycle([{ fromMe: true, status: 'SERVER_ACK', externalId: 'm' }])).toBe('sent');
  });

  it('chega em delivered após SERVER_ACK + DELIVERY_ACK', () => {
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 'SERVER_ACK', externalId: 'm' },
        { fromMe: true, status: 'DELIVERY_ACK', externalId: 'm' },
      ]),
    ).toBe('delivered');
  });

  it('progride com códigos numéricos (2 → 3 → 4)', () => {
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 2, externalId: 'm' },
        { fromMe: true, status: 3, externalId: 'm' },
        { fromMe: true, status: 4, externalId: 'm' },
      ]),
    ).toBe('read');
  });
});

describe('WhatsApp delivery_status — proteção contra downgrade', () => {
  it('NÃO faz downgrade de read para delivered (evento atrasado)', () => {
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 'SERVER_ACK', externalId: 'm' },
        { fromMe: true, status: 'READ', externalId: 'm' },
        { fromMe: true, status: 'DELIVERY_ACK', externalId: 'm' }, // atrasado
      ]),
    ).toBe('read');
  });

  it('NÃO faz downgrade de delivered para sent', () => {
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 'DELIVERY_ACK', externalId: 'm' },
        { fromMe: true, status: 'SERVER_ACK', externalId: 'm' }, // atrasado
      ]),
    ).toBe('delivered');
  });

  it('NÃO faz downgrade de sent para pending', () => {
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 'SERVER_ACK', externalId: 'm' },
        { fromMe: true, status: 'PENDING', externalId: 'm' },
      ]),
    ).toBe('sent');
  });

  it('aceita ordem fora de sequência mas mantém o maior', () => {
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 'READ', externalId: 'm' },
        { fromMe: true, status: 'SERVER_ACK', externalId: 'm' },
        { fromMe: true, status: 'DELIVERY_ACK', externalId: 'm' },
      ]),
    ).toBe('read');
  });
});

describe('WhatsApp delivery_status — eventos de mensagens recebidas (fromMe=false)', () => {
  it('ignora eventos de inbound — não altera status outbound', () => {
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 'SERVER_ACK', externalId: 'out' },
        { fromMe: false, status: 'PENDING', externalId: 'in' }, // não deve afetar
        { fromMe: false, status: 'READ', externalId: 'in' }, // não deve afetar
      ]),
    ).toBe('sent');
  });
});

describe('WhatsApp delivery_status — falhas', () => {
  it('marca como failed via ERROR', () => {
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 'SERVER_ACK', externalId: 'm' },
        { fromMe: true, status: 'ERROR', externalId: 'm' },
      ]),
    ).toBe('failed');
  });

  it('failed é terminal — não volta para read', () => {
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 'ERROR', externalId: 'm' },
        { fromMe: true, status: 'READ', externalId: 'm' },
      ]),
    ).toBe('failed');
  });

  it('failed pode sobrescrever delivered (entrega rejeitada depois)', () => {
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 'DELIVERY_ACK', externalId: 'm' },
        { fromMe: true, status: 'FAILED', externalId: 'm' },
      ]),
    ).toBe('failed');
  });
});

describe('WhatsApp delivery_status — cenários reais (Evolution API)', () => {
  it('cenário real: SERVER_ACK piggyback em messages.upsert (bug original)', () => {
    // O bug era: messages.upsert chegava com status SERVER_ACK e era ignorado
    // Agora o handler processa o status mesmo em upsert.
    const events: UpsertEvent[] = [
      { fromMe: true, status: 'PENDING', externalId: 'BAE5' }, // criação
      { fromMe: true, status: 'SERVER_ACK', externalId: 'BAE5' }, // upsert com ack piggyback
      { fromMe: true, status: 'DELIVERY_ACK', externalId: 'BAE5' },
      { fromMe: true, status: 'READ', externalId: 'BAE5' },
    ];
    expect(simulateMessageLifecycle(events)).toBe('read');
  });

  it('cenário real: leitura imediata sem delivered intermediário', () => {
    // Algumas vezes o WhatsApp pula DELIVERY_ACK e vai direto pra READ
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 'SERVER_ACK', externalId: 'm' },
        { fromMe: true, status: 'READ', externalId: 'm' },
      ]),
    ).toBe('read');
  });

  it('cenário real: múltiplos SERVER_ACK duplicados não causam regressão', () => {
    expect(
      simulateMessageLifecycle([
        { fromMe: true, status: 'SERVER_ACK', externalId: 'm' },
        { fromMe: true, status: 'SERVER_ACK', externalId: 'm' },
        { fromMe: true, status: 'SERVER_ACK', externalId: 'm' },
      ]),
    ).toBe('sent');
  });
});

describe('WhatsApp delivery_status — auditoria de transições válidas', () => {
  const validTransitions: Array<[DeliveryStatus, DeliveryStatus, boolean]> = [
    ['pending', 'sent', true],
    ['pending', 'delivered', true],
    ['pending', 'read', true],
    ['pending', 'failed', true],
    ['sent', 'delivered', true],
    ['sent', 'read', true],
    ['sent', 'failed', true],
    ['delivered', 'read', true],
    ['delivered', 'failed', true],
    // downgrades inválidos
    ['sent', 'pending', false],
    ['delivered', 'sent', false],
    ['delivered', 'pending', false],
    ['read', 'delivered', false],
    ['read', 'sent', false],
    ['read', 'pending', false],
    // failed terminal
    ['failed', 'read', false],
    ['failed', 'delivered', false],
    ['failed', 'sent', false],
  ];

  validTransitions.forEach(([from, to, shouldChange]) => {
    it(`${from} → ${to} ${shouldChange ? 'deve aplicar' : 'NÃO deve aplicar'}`, () => {
      const result = applyStatusUpdate(from, to);
      if (shouldChange) {
        expect(result).toBe(to);
      } else {
        expect(result).toBe(from);
      }
    });
  });
});
