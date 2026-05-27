// OrdersPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../utils/AppContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const fmtDate = d => d ? d.split('-').reverse().join('.') : '';
const fmt = n => (n||0).toLocaleString();

function Badge({ children, color }) {
  const s = { green: { background:'#e8f5f0',color:'#0e9f6e'}, red:{background:'#fde8e8',color:'#e02424'}, amber:{background:'#fef3c7',color:'#e3a008'}, blue:{background:'#e8f0fe',color:'#1a56db'}, purple:{background:'#f0ebff',color:'#7e3af2'} };
  return <span style={{...s[color]||s.blue, padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,display:'inline-block'}}>{children}</span>;
}

export default function OrdersPage() {
  const { t, can } = useApp();
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    api.get('/orders' + (filter !== 'all' ? `?status=${filter}` : '')).then(r => setOrders(r.data)).catch(() => {});
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const selectOrder = async (o) => {
    setSelected(o);
    const r = await api.get(`/orders/${o.id}`);
    setItems(r.data.items || []);
  };

  const updateItemQty = async (item, qty) => {
    await api.put(`/orders/${selected.id}/items/${item.id}`, { qty_produced: qty });
    toast.success('Saqlandi');
    selectOrder(selected);
    load();
  };

  const filtered = orders.filter(o => !search || o.order_number.includes(search) || o.customer.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>📋 {t('orders')}</div>

      {/* Search & filter */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('search')+'...'} style={{ flex:1,minWidth:160,padding:'8px 12px',borderRadius:8,border:'1px solid var(--color-border-tertiary)',fontSize:13,background:'var(--color-background-primary)',color:'var(--color-text-primary)' }} />
        {['all','active','in_progress','completed'].map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:'6px 12px',borderRadius:8,border:'1px solid var(--color-border-tertiary)',background:filter===f?'#1a56db':'var(--color-background-primary)',color:filter===f?'#fff':'var(--color-text-secondary)',cursor:'pointer',fontSize:12 }}>
            {f==='all'?t('all'):f==='active'?t('active'):f==='in_progress'?t('inProgress'):t('completed')}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div style={{ background:'var(--color-background-primary)',border:'1px solid var(--color-border-tertiary)',borderRadius:12,overflow:'hidden',marginBottom:16 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
            <thead><tr style={{ background:'var(--color-background-secondary)' }}>
              {['#','Xaridor','Tur','Miqdor','Og\'irlik','Yetkazish','Holat',''].map(h=><th key={h} style={{textAlign:'left',padding:'10px 12px',color:'var(--color-text-secondary)',fontWeight:500,whiteSpace:'nowrap'}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(o => {
                const daysLeft = o.delivery_date ? Math.ceil((new Date(o.delivery_date) - new Date()) / 86400000) : null;
                return (
                  <tr key={o.id} style={{ borderTop:'1px solid var(--color-border-tertiary)', cursor:'pointer' }} onClick={()=>selectOrder(o)}>
                    <td style={{padding:'10px 12px',fontWeight:700}}>#{o.order_number}</td>
                    <td style={{padding:'10px 12px'}}>{o.customer}</td>
                    <td style={{padding:'10px 12px'}}><Badge color={o.order_type==='export'?'purple':'blue'}>{o.order_type==='export'?'🌍 Export':'🏙 Shahar'}</Badge></td>
                    <td style={{padding:'10px 12px'}}>{fmt(o.total_qty)}</td>
                    <td style={{padding:'10px 12px'}}>{fmt(o.total_weight)} kg</td>
                    <td style={{padding:'10px 12px',color:daysLeft<=1?'#e02424':daysLeft<=3?'#e3a008':'inherit',fontWeight:daysLeft<=3?600:400}}>{fmtDate(o.delivery_date)}{daysLeft!==null&&<span style={{fontSize:11,marginLeft:4}}>({daysLeft}k)</span>}</td>
                    <td style={{padding:'10px 12px'}}><Badge color={o.status==='completed'?'green':o.status==='in_progress'?'amber':'blue'}>{o.status}</Badge></td>
                    <td style={{padding:'10px 12px',color:'#1a56db',fontSize:12}}>Ko'rish →</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail */}
      {selected && (
        <div style={{ background:'var(--color-background-primary)',border:'1px solid var(--color-border-tertiary)',borderRadius:12,padding:16 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8 }}>
            <div style={{ fontWeight:700,fontSize:15 }}>Buyurtma #{selected.order_number} — {selected.customer}</div>
            <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--color-text-secondary)'}}>✕</button>
          </div>
          <div style={{ display:'flex',gap:16,marginBottom:12,flexWrap:'wrap',fontSize:13,color:'var(--color-text-secondary)' }}>
            <span>📅 {fmtDate(selected.delivery_date)}</span>
            <span>📦 {fmt(selected.total_qty)} dona</span>
            <span>⚖️ {fmt(selected.total_weight)} kg</span>
            <Badge color={selected.order_type==='export'?'purple':'blue'}>{selected.order_type}</Badge>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
              <thead><tr style={{background:'var(--color-background-secondary)'}}>{['Mahsulot','Kerak','Tayyor','Qoldi','%','Holat'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',color:'var(--color-text-secondary)',fontWeight:500}}>{h}</th>)}</tr></thead>
              <tbody>
                {items.map(it=>{
                  const pct2 = it.qty_requested > 0 ? Math.round((it.qty_produced/it.qty_requested)*100) : 0;
                  const left = it.qty_requested - it.qty_produced;
                  return (
                    <tr key={it.id} style={{borderTop:'1px solid var(--color-border-tertiary)'}}>
                      <td style={{padding:'8px 10px'}}>{it.product_name}</td>
                      <td style={{padding:'8px 10px'}}>{fmt(it.qty_requested)}</td>
                      <td style={{padding:'8px 10px'}}>{can('edit')?<input type="number" defaultValue={it.qty_produced} style={{width:70,padding:'3px 6px',borderRadius:6,border:'1px solid var(--color-border-tertiary)',fontSize:12}} onBlur={e=>updateItemQty(it,parseFloat(e.target.value)||0)} />:fmt(it.qty_produced)}</td>
                      <td style={{padding:'8px 10px',color:left>0?'#e02424':'#0e9f6e',fontWeight:600}}>{fmt(left)}</td>
                      <td style={{padding:'8px 10px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:50,height:5,background:'var(--color-background-secondary)',borderRadius:3,overflow:'hidden'}}>
                            <div style={{width:`${Math.min(pct2,100)}%`,height:'100%',background:pct2>=100?'#0e9f6e':pct2>=50?'#e3a008':'#e02424'}} />
                          </div>
                          <span style={{fontSize:11}}>{pct2}%</span>
                        </div>
                      </td>
                      <td style={{padding:'8px 10px'}}><Badge color={pct2>=100?'green':pct2>0?'amber':'red'}>{pct2>=100?'✅ Tayyor':pct2>0?'🔄 Jarayonda':'⏳ Boshlanmagan'}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
