import React, { useEffect, useState } from 'react';
import { useApp } from '../utils/AppContext';
import api from '../utils/api';

const fmt = n => (n || 0).toLocaleString();
const fmtDate = d => d ? d.split('-').reverse().join('.') : '';

function MetricCard({ label, value, sub, color }) {
  const colors = { blue: '#1a56db', green: '#0e9f6e', red: '#e02424', amber: '#e3a008' };
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: colors[color] || colors.blue }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Badge({ children, color }) {
  const s = {
    green: { background: '#e8f5f0', color: '#0e9f6e' },
    red: { background: '#fde8e8', color: '#e02424' },
    amber: { background: '#fef3c7', color: '#e3a008' },
    blue: { background: '#e8f0fe', color: '#1a56db' },
    purple: { background: '#f0ebff', color: '#7e3af2' },
  };
  return <span style={{ ...s[color]||s.blue, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, display: 'inline-block' }}>{children}</span>;
}

export default function DashboardPage() {
  const { t } = useApp();
  const [data, setData] = useState(null);
  const [shift, setShift] = useState('day');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    api.get(`/dashboard?date=${today}`).then(r => setData(r.data)).catch(() => {});
  }, [today]);

  const p = data?.todayProd;
  const pct = p?.planned > 0 ? Math.round((p.actual / p.planned) * 100) : 0;
  const brakPct = p?.actual > 0 ? ((p.brak / p.actual) * 100).toFixed(1) : 0;
  const stopHours = data?.todayStops?.total_min ? Math.floor(data.todayStops.total_min / 60) + 's ' + (data.todayStops.total_min % 60) + 'd' : '0';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['day','night'].map(s => (
            <button key={s} onClick={() => setShift(s)} style={{
              padding: '5px 12px', borderRadius: 8, border: '1px solid var(--color-border-tertiary)',
              background: shift === s ? '#1a56db' : 'var(--color-background-primary)',
              color: shift === s ? '#fff' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 500
            }}>{s === 'day' ? '☀️ ' + t('dayShift') : '🌙 ' + t('nightShift')}</button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {data?.urgentOrders?.filter(o => o.days_left <= 1).map(o => (
        <div key={o.id} style={{ padding: '10px 14px', borderRadius: 8, background: '#fde8e8', border: '1px solid #e02424', color: '#e02424', fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          🚨 <strong>Buyurtma #{o.order_number}</strong> — {o.customer} — <strong>{o.days_left === 0 ? 'BUGUN!' : 'Ertaga!'}</strong> ({fmtDate(o.delivery_date)})
        </div>
      ))}
      {data?.urgentOrders?.filter(o => o.days_left > 1 && o.days_left <= 3).map(o => (
        <div key={o.id} style={{ padding: '10px 14px', borderRadius: 8, background: '#fef3c7', border: '1px solid #e3a008', color: '#e3a008', fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ Buyurtma <strong>#{o.order_number}</strong> ({o.customer}) — {o.days_left} kun qoldi ({fmtDate(o.delivery_date)})
        </div>
      ))}
      {data?.recentStops?.length > 0 && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fde8e8', border: '1px solid #e02424', color: '#e02424', fontSize: 13, marginBottom: 8 }}>
          🔴 {data.recentStops.length} ta liniya bugun to'xtadi — jami {data.todayStops?.total_min || 0} daqiqa
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        <MetricCard label={t('todayProduced')} value={`${fmt(p?.actual)} dona`} sub={`${t('plan')}: ${fmt(p?.planned)} | ${pct}%`} color={pct >= 90 ? 'green' : pct >= 70 ? 'amber' : 'red'} />
        <MetricCard label={t('brak')} value={`${fmt(p?.brak)} dona`} sub={`${brakPct}% — maqsad: <2%`} color={brakPct < 2 ? 'green' : brakPct < 4 ? 'amber' : 'red'} />
        <MetricCard label={t('activeLines')} value={`${data?.linesSummary?.running || 0} / ${data?.linesSummary?.total || 50}`} sub={`${data?.linesSummary?.stopped || 0} to'xtagan`} color={data?.linesSummary?.stopped > 5 ? 'red' : 'green'} />
        <MetricCard label={t('stopTime')} value={stopTime(data?.todayStops?.total_min)} sub={`${data?.todayStops?.cnt || 0} ta uzilish`} color={data?.todayStops?.total_min > 120 ? 'red' : 'amber'} />
        <MetricCard label={t('activeOrders')} value={`${data?.ordersSummary?.active || 0} ta`} sub={`${data?.urgentOrders?.length || 0} ta shoshilinch`} color="blue" />
        <MetricCard label={t('todayDeliveries')} value={`${data?.todayDeliveries?.length || 0} ta`} sub={`Export: ${data?.todayDeliveries?.filter(o=>o.order_type==='export').length||0}, Shahar: ${data?.todayDeliveries?.filter(o=>o.order_type!=='export').length||0}`} color="green" />
      </div>

      {/* Plan progress */}
      <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px', marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>📊 {t('plan')} bajarilishi (bugun)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ flex: 1, height: 10, background: 'var(--color-background-secondary)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: pct >= 90 ? '#0e9f6e' : pct >= 70 ? '#e3a008' : '#e02424', borderRadius: 5, transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: pct >= 90 ? '#0e9f6e' : pct >= 70 ? '#e3a008' : '#e02424' }}>{pct}%</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {fmt(p?.actual)} / {fmt(p?.planned)} dona | Brak: {fmt(p?.brak)} ({brakPct}%)
        </div>
      </div>

      {/* Urgent orders table */}
      {data?.urgentOrders?.length > 0 && (
        <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🔔 {t('urgentOrders')}</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr>{['#','Xaridor','Tur','Yetkazish','Qoldi','Holat'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
              <tbody>
                {data.urgentOrders.map(o => (
                  <tr key={o.id}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border-tertiary)', fontWeight: 600 }}>#{o.order_number}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border-tertiary)' }}>{o.customer}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                      <Badge color={o.order_type === 'export' ? 'purple' : 'blue'}>{o.order_type === 'export' ? '🌍 Export' : '🏙 Shahar'}</Badge>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border-tertiary)', color: o.days_left <= 1 ? '#e02424' : o.days_left <= 3 ? '#e3a008' : '#0e9f6e', fontWeight: 600 }}>{fmtDate(o.delivery_date)}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                      <Badge color={o.days_left === 0 ? 'red' : o.days_left <= 1 ? 'red' : o.days_left <= 3 ? 'amber' : 'green'}>{o.days_left === 0 ? 'Bugun!' : `${o.days_left} kun`}</Badge>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                      <Badge color={o.status === 'completed' ? 'green' : o.status === 'in_progress' ? 'amber' : 'blue'}>{o.status === 'completed' ? '✅' : o.status === 'in_progress' ? '🔄' : '🔵'} {o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent stops */}
      {data?.recentStops?.length > 0 && (
        <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>⚠️ {t('todayStops')}</div>
          {data.recentStops.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < data.recentStops.length - 1 ? '1px solid var(--color-border-tertiary)' : 'none', fontSize: 13, flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>{s.line_name}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{s.stop_time}</span>
              <span>{s.reason_preset || s.reason_custom}</span>
              <Badge color="red">{s.duration_min} daqiqa</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function stopTime(min) {
  if (!min) return '0';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}s ${m}d` : `${m}d`;
}
