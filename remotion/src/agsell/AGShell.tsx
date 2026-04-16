// Mockup component que reproduz o layout AG Sell (sidebar vermelha, header escuro, main escuro)
import React from 'react';

export const AGShell: React.FC<{
  active: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
}> = ({ active, title, badge, children }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '◧' },
    { id: 'crm', label: 'CRM', icon: '◉' },
    { id: 'inbox', label: 'Inbox', icon: '✉' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'instagram', label: 'Instagram', icon: '◎' },
    { id: 'email', label: 'Email Marketing', icon: '✦' },
    { id: 'flow', label: 'Flow Builder', icon: '⚙' },
    { id: 'ai', label: 'Agentes IA', icon: '✱' },
    { id: 'analytics', label: 'Analytics', icon: '◔' },
    { id: 'settings', label: 'Configurações', icon: '⚙' },
  ];

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#09090b', color: '#fafafa', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* SIDEBAR */}
      <div style={{ width: 260, backgroundColor: '#0a0a0a', borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #27272a' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #E63329, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18 }}>AG</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>AG Sell</div>
            <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1 }}>Sales Platform</div>
          </div>
        </div>
        <div style={{ padding: '12px 8px', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = item.id === active;
            return (
              <div
                key={item.id}
                style={{
                  padding: '10px 14px',
                  margin: '2px 4px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : '#a1a1aa',
                  background: isActive ? 'linear-gradient(90deg, rgba(230,51,41,0.18), rgba(230,51,41,0.05))' : 'transparent',
                  borderLeft: isActive ? '2px solid #E63329' : '2px solid transparent',
                }}
              >
                <span style={{ fontSize: 14, color: isActive ? '#E63329' : '#71717a' }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </div>
        <div style={{ padding: 16, borderTop: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #E63329, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>AG</div>
          <div style={{ fontSize: 11 }}>
            <div style={{ fontWeight: 600 }}>Anderson G.</div>
            <div style={{ color: '#71717a' }}>Admin</div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ height: 60, borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', backgroundColor: '#09090b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.4 }}>{title}</h1>
            {badge && (
              <span style={{ padding: '3px 10px', backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                {badge}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 320, height: 36, backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#71717a' }}>
              <span>⌕</span> Buscar contatos, conversas, automações...
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#18181b', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              ◉<div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, backgroundColor: '#E63329', borderRadius: '50%' }} />
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: 32, overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  );
};
