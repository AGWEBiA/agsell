// Cena 4: Inbox Omnichannel
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { AGShell } from './AGShell';

const channels = [
  { icon: '💬', name: 'WhatsApp', count: 12, color: '#22c55e' },
  { icon: '◎', name: 'Instagram', count: 8, color: '#E63329' },
  { icon: '✉', name: 'Email', count: 23, color: '#3b82f6' },
  { icon: '✆', name: 'Telefone', count: 4, color: '#f59e0b' },
];

const conversations = [
  { ch: '💬', color: '#22c55e', name: 'Maria Silva', msg: 'Olá! Vi o produto e gostaria de saber mais...', time: '2m', unread: 3 },
  { ch: '◎', color: '#E63329', name: 'João Pereira', msg: 'Vocês fazem entrega para SP?', time: '5m', unread: 1 },
  { ch: '✉', color: '#3b82f6', name: 'Carlos Costa', msg: 'Re: Proposta comercial AG-2847', time: '12m', unread: 0 },
  { ch: '💬', color: '#22c55e', name: 'Ana Oliveira', msg: 'Quero fechar! Como faço o pagamento?', time: '18m', unread: 2 },
  { ch: '◎', color: '#E63329', name: 'Lucas Mendes', msg: '👋 Tudo bem? Tenho uma dúvida', time: '25m', unread: 1 },
];

export const SceneInbox: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AGShell active="inbox" title="Inbox Omnichannel" badge="● 47 ativas">
        <div style={{ display: 'flex', gap: 20, height: '100%' }}>
          {/* Channels filter */}
          <div style={{ width: 240 }}>
            <div style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 12 }}>Canais</div>
            {channels.map((c, i) => {
              const delay = i * 6;
              const cOp = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: 'clamp' });
              const cX = interpolate(spring({ frame: frame - delay, fps, config: { damping: 18 } }), [0, 1], [-30, 0]);
              return (
                <div key={i} style={{
                  opacity: cOp, transform: `translateX(${cX}px)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', backgroundColor: '#18181b', border: '1px solid #27272a',
                  borderRadius: 10, marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${c.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{c.icon}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{c.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: c.color, fontWeight: 700, padding: '2px 8px', backgroundColor: `${c.color}15`, borderRadius: 999 }}>{c.count}</span>
                </div>
              );
            })}
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, backgroundColor: '#0c0c0e', border: '1px solid #27272a', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Conversas em fila</span>
              <span style={{ fontSize: 11, color: '#22c55e' }}>● Tempo real</span>
            </div>
            {conversations.map((conv, i) => {
              const delay = 30 + i * 10;
              const cOp = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateRight: 'clamp' });
              const cY = interpolate(spring({ frame: frame - delay, fps, config: { damping: 16 } }), [0, 1], [20, 0]);
              return (
                <div key={i} style={{
                  opacity: cOp, transform: `translateY(${cY}px)`,
                  padding: '14px 18px', borderBottom: i < conversations.length - 1 ? '1px solid #1f1f23' : 'none',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${conv.color}, #71717a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{conv.name[0]}</div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#0c0c0e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{conv.ch}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{conv.name}</span>
                      <span style={{ fontSize: 11, color: '#71717a' }}>{conv.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.msg}</div>
                  </div>
                  {conv.unread > 0 && (
                    <div style={{ minWidth: 22, height: 22, borderRadius: '50%', backgroundColor: '#E63329', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{conv.unread}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </AGShell>
    </AbsoluteFill>
  );
};
