// Cena 6: AI Agents
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { AGShell } from './AGShell';

const messages = [
  { from: 'user', text: 'Olá, vi o produto no Instagram. Como funciona?', delay: 10 },
  { from: 'ai', text: 'Olá! Sou a Sofia, assistente da AG Sell. 👋 Nossa plataforma reúne CRM, automação e atendimento omnichannel. Quer agendar uma demo?', delay: 30 },
  { from: 'user', text: 'Quero! Pode ser amanhã?', delay: 60 },
  { from: 'ai', text: 'Perfeito! Tenho horários disponíveis às 10h, 14h e 16h. Qual prefere?', delay: 80 },
  { from: 'user', text: '14h está ótimo', delay: 110 },
  { from: 'ai', text: '✅ Agendado! Acabei de criar seu cadastro no CRM e enviar o convite por email. Anderson irá te atender amanhã às 14h.', delay: 130 },
];

export const SceneAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AGShell active="ai" title="Agente IA — Sofia" badge="● Online 24/7">
        <div style={{ display: 'flex', gap: 20, height: '100%' }}>
          {/* Chat */}
          <div style={{ flex: 1.5, backgroundColor: '#0c0c0e', border: '1px solid #27272a', borderRadius: 12, padding: 20, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((m, i) => {
                const mOp = interpolate(frame, [m.delay, m.delay + 12], [0, 1], { extrapolateRight: 'clamp' });
                const mY = interpolate(spring({ frame: frame - m.delay, fps, config: { damping: 18 } }), [0, 1], [15, 0]);
                const isUser = m.from === 'user';
                return (
                  <div key={i} style={{ opacity: mOp, transform: `translateY(${mY}px)`, display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '78%',
                      padding: '10px 14px',
                      backgroundColor: isUser ? '#E63329' : '#18181b',
                      border: isUser ? 'none' : '1px solid #27272a',
                      borderRadius: 12,
                      borderTopRightRadius: isUser ? 4 : 12,
                      borderTopLeftRadius: isUser ? 12 : 4,
                      fontSize: 13, lineHeight: 1.4, color: '#fff',
                    }}>
                      {!isUser && <div style={{ fontSize: 10, color: '#E63329', fontWeight: 700, marginBottom: 4 }}>SOFIA · IA</div>}
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Stats */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Conversas hoje', value: '247', color: '#E63329', delay: 20 },
              { label: 'Taxa de resposta', value: '< 2s', color: '#22c55e', delay: 35 },
              { label: 'Leads qualificados', value: '89', color: '#3b82f6', delay: 50 },
              { label: 'Demos agendadas', value: '34', color: '#f59e0b', delay: 65 },
            ].map((s, i) => {
              const sOp = interpolate(frame, [s.delay, s.delay + 18], [0, 1], { extrapolateRight: 'clamp' });
              const sX = interpolate(spring({ frame: frame - s.delay, fps, config: { damping: 16 } }), [0, 1], [30, 0]);
              return (
                <div key={i} style={{
                  opacity: sOp, transform: `translateX(${sX}px)`,
                  padding: 18, backgroundColor: '#0c0c0e', border: '1px solid #27272a',
                  borderLeft: `3px solid ${s.color}`, borderRadius: 12,
                }}>
                  <div style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: s.color, letterSpacing: -1 }}>{s.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AGShell>
    </AbsoluteFill>
  );
};
