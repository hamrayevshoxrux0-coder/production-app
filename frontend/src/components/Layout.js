import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../utils/AppContext';

const navItems = (t) => [
  { to: '/', label: t('dashboard'), icon: '📊', end: true },
  { to: '/orders', label: t('orders'), icon: '📋' },
  { to: '/production', label: t('production'), icon: '🏭' },
  { to: '/lines', label: t('lines'), icon: '⚙️' },
  { to: '/reports', label: t('reports'), icon: '📈' },
  { to: '/import', label: t('import'), icon: '📥' },
  { to: '/settings', label: t('settings'), icon: '⚙️' },
];

export default function Layout() {
  const { user, logout, lang, changeLang, t } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-background-secondary)' }}>

      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: 'var(--color-background-primary)',
        borderBottom: '1px solid var(--color-border-tertiary)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}>☰</button>
          <span style={{ fontWeight: 600, fontSize: 15 }}>🏭 {t('production')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['uz','ru','en'].map(l => (
            <button key={l} onClick={() => changeLang(l)} style={{
              padding: '3px 8px', borderRadius: 6, border: '1px solid var(--color-border-tertiary)',
              background: lang === l ? 'var(--color-background-secondary)' : 'transparent',
              cursor: 'pointer', fontWeight: lang === l ? 600 : 400, fontSize: 12,
              color: 'var(--color-text-primary)'
            }}>{l.toUpperCase()}</button>
          ))}
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '3px 8px', background: 'var(--color-background-secondary)', borderRadius: 6 }}>
            {user?.username} ({user?.role})
          </span>
          <button onClick={handleLogout} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border-tertiary)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {t('logout')}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar */}
        <nav style={{
          width: menuOpen ? 220 : 0, overflow: 'hidden', transition: 'width 0.2s',
          background: 'var(--color-background-primary)', borderRight: '1px solid var(--color-border-tertiary)',
          position: 'fixed', top: 53, bottom: 0, zIndex: 99, display: 'flex', flexDirection: 'column'
        }}>
          {navItems(t).map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 18px', textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap',
                color: isActive ? '#1a56db' : 'var(--color-text-primary)',
                background: isActive ? '#e8f0fe' : 'transparent',
                borderLeft: isActive ? '3px solid #1a56db' : '3px solid transparent',
              })}>
              <span>{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Overlay */}
        {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(0,0,0,0.3)' }} />}

        {/* Main content */}
        <main style={{ flex: 1, padding: '16px', maxWidth: '100%', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>

      {/* Bottom nav for mobile */}
      <nav style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '8px 0', background: 'var(--color-background-primary)',
        borderTop: '1px solid var(--color-border-tertiary)', position: 'sticky', bottom: 0, zIndex: 100
      }}>
        {navItems(t).slice(0, 6).map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            textDecoration: 'none', fontSize: 10, color: isActive ? '#1a56db' : 'var(--color-text-secondary)',
            padding: '4px 8px', borderRadius: 6,
            background: isActive ? '#e8f0fe' : 'transparent'
          })}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
