import React, { useState } from 'react';
import { useApp } from '../utils/AppContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, t, lang, changeLang } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success(t('success'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--color-background-secondary)', padding: 16
    }}>
      <div style={{
        background: 'var(--color-background-primary)', borderRadius: 16,
        padding: 32, width: '100%', maxWidth: 380,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid var(--color-border-tertiary)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏭</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Ishlab chiqarish tizimi</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 6 }}>Production Management System</p>
        </div>

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
          {['uz','ru','en'].map(l => (
            <button key={l} onClick={() => changeLang(l)} style={{
              padding: '4px 12px', borderRadius: 8, border: '1px solid var(--color-border-tertiary)',
              background: lang === l ? '#1a56db' : 'transparent',
              color: lang === l ? '#fff' : 'var(--color-text-primary)',
              cursor: 'pointer', fontWeight: 600, fontSize: 12
            }}>{l.toUpperCase()}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>{t('username')}</label>
            <input value={username} onChange={e => setUsername(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border-tertiary)', fontSize: 14, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', boxSizing: 'border-box' }}
              placeholder="admin" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>{t('password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border-tertiary)', fontSize: 14, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', boxSizing: 'border-box' }}
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '12px', borderRadius: 8, border: 'none',
            background: '#1a56db', color: '#fff', fontWeight: 600, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4
          }}>
            {loading ? t('loading') : t('login')}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: 12, background: 'var(--color-background-secondary)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <b>Demo kirish:</b><br/>
          admin / admin123<br/>
          tahrilovchi / editor123<br/>
          kuzatuvchi / viewer123
        </div>
      </div>
    </div>
  );
}
