import React, { useEffect, useState } from 'react';
import { useApp } from '../utils/AppContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ─── Shared ───────────────────────────────────────────────
const Input = (props) => <input {...props} style={{ padding:'8px 10px',borderRadius:8,border:'1px solid var(--color-border-tertiary)',fontSize:13,background:'var(--color-background-primary)',color:'var(--color-text-primary)',width:'100%',boxSizing:'border-box',...props.style }} />;
const Select = ({children,...p}) => <select {...p} style={{ padding:'8px 10px',borderRadius:8,border:'1px solid var(--color-border-tertiary)',fontSize:13,background:'var(--color-background-primary)',color:'var(--color-text-primary)',width:'100%',...p.style }}>{children}</select>;
const Btn = ({children,variant='default',...p}) => <button {...p} style={{ padding:'8px 16px',borderRadius:8,border:'1px solid var(--color-border-tertiary)',background:variant==='primary'?'#1a56db':variant==='success'?'#0e9f6e':'var(--color-background-primary)',color:variant==='default'?'var(--color-text-primary)':'#fff',cursor:'pointer',fontSize:13,fontWeight:500,display:'inline-flex',alignItems:'center',gap:6,...p.style }}>{children}</button>;
const Card = ({title,children,icon}) => (
  <div style={{ background:'var(--color-background-primary)',border:'1px solid var(--color-border-tertiary)',borderRadius:12,padding:16,marginBottom:12 }}>
    {title && <div style={{ fontWeight:600,fontSize:14,marginBottom:12 }}>{icon} {title}</div>}
    {children}
  </div>
);
const today = () => new Date().toISOString().split('T')[0];

// ─── PRODUCTION PAGE ──────────────────────────────────────
export function ProductionPage() {
  const { t, can } = useApp();
  const [shift, setShift] = useState('day');
  const [lines, setLines] = useState([]);
  const [stops, setStops] = useState([]);
  const [log, setLog] = useState({ log_date: today(), shift:'day', line_id:'', product_name:'', planned_qty:'', actual_qty:'', brak_qty:'', unit:'dona', notes:'' });
  const [stop, setStop] = useState({ stop_date:today(), shift:'day', line_id:'', line_name:'', stop_time:'', duration_min:'', reason_preset:'', reason_custom:'', reason_category:'other' });

  useEffect(() => {
    api.get('/lines').then(r => setLines(r.data)).catch(()=>{});
    api.get(`/production/stops?date=${today()}`).then(r => setStops(r.data)).catch(()=>{});
  }, []);

  const saveLog = async () => {
    try { await api.post('/production/logs', {...log, shift}); toast.success(t('success')); setLog(l=>({...l,product_name:'',planned_qty:'',actual_qty:'',brak_qty:'',notes:''})); }
    catch(e) { toast.error(e.response?.data?.error || t('error')); }
  };

  const saveStop = async () => {
    const lineObj = lines.find(l=>l.id==stop.line_id);
    try {
      await api.post('/production/stops', {...stop, shift, line_name: lineObj?.name||''});
      toast.success(t('success'));
      api.get(`/production/stops?date=${today()}`).then(r=>setStops(r.data));
      setStop(s=>({...s,stop_time:'',duration_min:'',reason_preset:'',reason_custom:''}));
    } catch(e) { toast.error(t('error')); }
  };

  const reasons = ['Xom ashyo yetishmasligi','Elektr uzilishi','Mexanik nosozlik','Rejalashtirilgan texnik xizmat','Xodim yetishmasligi','Buyurtma yo\'qligi','Boshqa sabab'];

  return (
    <div>
      <div style={{ fontWeight:700,fontSize:17,marginBottom:14 }}>🏭 {t('production')}</div>
      <div style={{ display:'flex',gap:6,marginBottom:14 }}>
        {[['day','☀️ '+t('dayShift')],['night','🌙 '+t('nightShift')]].map(([v,l])=>(
          <button key={v} onClick={()=>setShift(v)} style={{ padding:'6px 14px',borderRadius:8,border:'1px solid var(--color-border-tertiary)',background:shift===v?'#1a56db':'var(--color-background-primary)',color:shift===v?'#fff':'var(--color-text-secondary)',cursor:'pointer',fontSize:13 }}>{l}</button>
        ))}
      </div>

      {can('edit') && <>
        <Card title={t('enterProduction')} icon="📝">
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:10 }}>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('date')}</label><Input type="date" value={log.log_date} onChange={e=>setLog(l=>({...l,log_date:e.target.value}))} /></div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('line')}</label>
              <Select value={log.line_id} onChange={e=>setLog(l=>({...l,line_id:e.target.value}))}>
                <option value="">Tanlang</option>
                {lines.map(ln=><option key={ln.id} value={ln.id}>{ln.name}</option>)}
              </Select>
            </div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('product')}</label><Input value={log.product_name} onChange={e=>setLog(l=>({...l,product_name:e.target.value}))} placeholder="Mahsulot nomi" /></div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('planned')}</label><Input type="number" value={log.planned_qty} onChange={e=>setLog(l=>({...l,planned_qty:e.target.value}))} placeholder="0" /></div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('actual')}</label><Input type="number" value={log.actual_qty} onChange={e=>setLog(l=>({...l,actual_qty:e.target.value}))} placeholder="0" /></div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('brak')}</label><Input type="number" value={log.brak_qty} onChange={e=>setLog(l=>({...l,brak_qty:e.target.value}))} placeholder="0" /></div>
          </div>
          <Btn variant="primary" onClick={saveLog}>💾 {t('save')}</Btn>
        </Card>

        <Card title={t('lineStop')} icon="🛑">
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:10 }}>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('line')}</label>
              <Select value={stop.line_id} onChange={e=>setStop(s=>({...s,line_id:e.target.value}))}>
                <option value="">Tanlang</option>
                {lines.map(ln=><option key={ln.id} value={ln.id}>{ln.name}</option>)}
              </Select>
            </div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('stopTime_field')}</label><Input type="time" value={stop.stop_time} onChange={e=>setStop(s=>({...s,stop_time:e.target.value}))} /></div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('duration')}</label><Input type="number" value={stop.duration_min} onChange={e=>setStop(s=>({...s,duration_min:e.target.value}))} placeholder="0" /></div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('reason')}</label>
              <Select value={stop.reason_preset} onChange={e=>setStop(s=>({...s,reason_preset:e.target.value}))}>
                <option value="">Tanlang</option>
                {reasons.map(r=><option key={r} value={r}>{r}</option>)}
              </Select>
            </div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('customReason')}</label><Input value={stop.reason_custom} onChange={e=>setStop(s=>({...s,reason_custom:e.target.value}))} placeholder="Ixtiyoriy..." /></div>
          </div>
          <Btn variant="primary" onClick={saveStop}>💾 {t('save')}</Btn>
        </Card>
      </>}

      <Card title={t('todayStops')} icon="📋">
        {stops.length === 0 ? <div style={{color:'var(--color-text-secondary)',fontSize:13}}>Bugun uzilish yo'q</div> :
        <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr>{['Liniya','Vaqt','Davomiylik','Sabab','Smena'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',color:'var(--color-text-secondary)',fontWeight:500,borderBottom:'1px solid var(--color-border-tertiary)'}}>{h}</th>)}</tr></thead>
          <tbody>{stops.map((s,i)=><tr key={i} style={{borderTop:'1px solid var(--color-border-tertiary)'}}>
            <td style={{padding:'8px 10px',fontWeight:600}}>{s.line_name}</td>
            <td style={{padding:'8px 10px'}}>{s.stop_time}</td>
            <td style={{padding:'8px 10px'}}><span style={{background:'#fde8e8',color:'#e02424',padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600}}>{s.duration_min} min</span></td>
            <td style={{padding:'8px 10px'}}>{s.reason_preset || s.reason_custom}</td>
            <td style={{padding:'8px 10px'}}><span style={{background:'#e8f0fe',color:'#1a56db',padding:'2px 8px',borderRadius:12,fontSize:11}}>{s.shift==='day'?'Kunduzgi':'Tungi'}</span></td>
          </tr>)}</tbody>
        </table></div>}
      </Card>
    </div>
  );
}

// ─── LINES PAGE ───────────────────────────────────────────
export function LinesPage() {
  const { t, can } = useApp();
  const [lines, setLines] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => { api.get('/lines').then(r=>setLines(r.data)).catch(()=>{}); }, []);

  const setStatus = async (id, status) => {
    await api.put(`/lines/${id}/status`, { status });
    setLines(ls => ls.map(l => l.id === id ? {...l, status} : l));
    toast.success(t('success'));
  };

  const colors = { running:{bg:'#e8f5f0',border:'#0e9f6e',text:'#0e9f6e'}, stopped:{bg:'#fde8e8',border:'#e02424',text:'#e02424'}, idle:{bg:'#fef3c7',border:'#e3a008',text:'#e3a008'} };

  return (
    <div>
      <div style={{ fontWeight:700,fontSize:17,marginBottom:8 }}>⚙️ {t('lines')} (50)</div>
      <div style={{ display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',fontSize:12 }}>
        {Object.entries(colors).map(([k,v])=>(
          <span key={k} style={{padding:'3px 10px',borderRadius:12,background:v.bg,color:v.text,border:`1px solid ${v.border}`,fontWeight:600}}>
            ● {k==='running'?t('running'):k==='stopped'?t('stopped'):t('idle')} ({lines.filter(l=>l.status===k).length})
          </span>
        ))}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))',gap:6,marginBottom:16 }}>
        {lines.map(l => {
          const c = colors[l.status] || colors.idle;
          return (
            <div key={l.id} onClick={()=>setSelected(l)} style={{ background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:'10px 8px',textAlign:'center',cursor:'pointer' }}>
              <div style={{ fontSize:12,fontWeight:700,color:c.text }}>{l.name}</div>
              <div style={{ fontSize:10,color:c.text,marginTop:2 }}>{l.status==='running'?'✓ Faol':l.status==='stopped'?'✗ To\'xtagan':'— Ishlamayapti'}</div>
            </div>
          );
        })}
      </div>
      {selected && (
        <Card title={`${selected.name} — tafsilot`} icon="🔍">
          <div style={{ display:'flex',gap:8,marginBottom:12,flexWrap:'wrap' }}>
            {can('edit') && <>
              <Btn variant="success" onClick={()=>setStatus(selected.id,'running')}>✅ Ishga tushirish</Btn>
              <Btn onClick={()=>setStatus(selected.id,'stopped')} style={{background:'#fde8e8',color:'#e02424',border:'1px solid #e02424'}}>🛑 To'xtatish</Btn>
              <Btn onClick={()=>setStatus(selected.id,'idle')} style={{background:'#fef3c7',color:'#e3a008',border:'1px solid #e3a008'}}>⏸ Ishlamayapti</Btn>
            </>}
            <Btn onClick={()=>setSelected(null)}>✕ Yopish</Btn>
          </div>
          <div style={{fontSize:13,color:'var(--color-text-secondary)'}}>Oxirgi yangilanish: {selected.last_updated?.replace('T',' ').slice(0,16)}</div>
        </Card>
      )}
    </div>
  );
}

// ─── REPORTS PAGE ─────────────────────────────────────────
export function ReportsPage() {
  const { t } = useApp();
  const [type, setType] = useState('monthly');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [date, setDate] = useState(today());
  const [data, setData] = useState(null);

  const load = async () => {
    try {
      const r = type==='daily' ? await api.get(`/reports/daily?date=${date}`) :
                type==='monthly' ? await api.get(`/reports/monthly?month=${month}`) :
                await api.get(`/reports/yearly?year=${year}`);
      setData(r.data);
    } catch(e) { toast.error(t('error')); }
  };

  const fmt = n => (n||0).toLocaleString();

  return (
    <div>
      <div style={{ fontWeight:700,fontSize:17,marginBottom:14 }}>📈 {t('reports')}</div>
      <Card title={t('filter')} icon="🔍">
        <div style={{ display:'flex',gap:8,marginBottom:12,flexWrap:'wrap' }}>
          {['daily','monthly','yearly'].map(tp=>(
            <button key={tp} onClick={()=>setType(tp)} style={{ padding:'6px 14px',borderRadius:8,border:'1px solid var(--color-border-tertiary)',background:type===tp?'#1a56db':'var(--color-background-primary)',color:type===tp?'#fff':'var(--color-text-secondary)',cursor:'pointer',fontSize:13 }}>
              {tp==='daily'?t('daily'):tp==='monthly'?t('monthly'):t('yearly')}
            </button>
          ))}
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'flex-end',flexWrap:'wrap' }}>
          {type==='daily' && <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('date')}</label><Input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:160}} /></div>}
          {type==='monthly' && <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('month')}</label><Input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{width:160}} /></div>}
          {type==='yearly' && <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>{t('year')}</label><Select value={year} onChange={e=>setYear(e.target.value)} style={{width:120}}>{[2026,2025,2024].map(y=><option key={y}>{y}</option>)}</Select></div>}
          <Btn variant="primary" onClick={load}>🔍 Ko'rish</Btn>
        </div>
      </Card>

      {data && type==='monthly' && <>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:12 }}>
          {[
            {l:'Jami ishlab chiqarildi',v:fmt(data.totals?.actual)+' dona',c:'#1a56db'},
            {l:'Jami reja',v:fmt(data.totals?.planned)+' dona',c:'#0e9f6e'},
            {l:'Jami brak',v:fmt(data.totals?.brak)+' dona',c:'#e02424'},
          ].map(m=>(
            <div key={m.l} style={{background:'var(--color-background-primary)',border:'1px solid var(--color-border-tertiary)',borderRadius:12,padding:'14px 16px'}}>
              <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:4}}>{m.l}</div>
              <div style={{fontSize:20,fontWeight:700,color:m.c}}>{m.v}</div>
            </div>
          ))}
        </div>
        <Card title="Mahsulot bo'yicha" icon="📦">
          <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr>{['Mahsulot','Reja','Haqiqiy','Brak','%'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',color:'var(--color-text-secondary)',fontWeight:500,borderBottom:'1px solid var(--color-border-tertiary)'}}>{h}</th>)}</tr></thead>
            <tbody>{(data.byProduct||[]).map((p,i)=>{
              const pct=p.planned>0?Math.round(p.actual/p.planned*100):0;
              return <tr key={i} style={{borderTop:'1px solid var(--color-border-tertiary)'}}>
                <td style={{padding:'8px 10px'}}>{p.product_name}</td>
                <td style={{padding:'8px 10px'}}>{fmt(p.planned)}</td>
                <td style={{padding:'8px 10px',fontWeight:600}}>{fmt(p.actual)}</td>
                <td style={{padding:'8px 10px',color:'#e02424'}}>{fmt(p.brak)}</td>
                <td style={{padding:'8px 10px'}}><span style={{background:pct>=90?'#e8f5f0':pct>=70?'#fef3c7':'#fde8e8',color:pct>=90?'#0e9f6e':pct>=70?'#e3a008':'#e02424',padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600}}>{pct}%</span></td>
              </tr>;
            })}</tbody>
          </table></div>
        </Card>
      </>}
      {data && type==='daily' && (
        <Card title={`${date} — kunlik hisobot`} icon="📅">
          <div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:13,marginBottom:12}}>
            <span>✅ Ishlab chiqarildi: <strong>{fmt(data.totals?.actual)}</strong></span>
            <span>🎯 Reja: <strong>{fmt(data.totals?.planned)}</strong></span>
            <span>❌ Brak: <strong>{fmt(data.totals?.brak)}</strong></span>
            <span>🛑 Uzilishlar: <strong>{data.stopTotals?.cnt||0} ta ({data.stopTotals?.total_min||0} min)</strong></span>
          </div>
          <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr>{['Mahsulot','Liniya','Smena','Reja','Haqiqiy','Brak'].map(h=><th key={h} style={{textAlign:'left',padding:'7px 10px',color:'var(--color-text-secondary)',fontWeight:500,borderBottom:'1px solid var(--color-border-tertiary)'}}>{h}</th>)}</tr></thead>
            <tbody>{(data.production||[]).map((p,i)=><tr key={i} style={{borderTop:'1px solid var(--color-border-tertiary)'}}>
              <td style={{padding:'7px 10px'}}>{p.product_name}</td><td style={{padding:'7px 10px'}}>{p.line_name}</td>
              <td style={{padding:'7px 10px'}}>{p.shift==='day'?'Kunduzgi':'Tungi'}</td>
              <td style={{padding:'7px 10px'}}>{fmt(p.planned)}</td><td style={{padding:'7px 10px',fontWeight:600}}>{fmt(p.actual)}</td>
              <td style={{padding:'7px 10px',color:'#e02424'}}>{fmt(p.brak)}</td>
            </tr>)}</tbody>
          </table></div>
        </Card>
      )}
    </div>
  );
}

// ─── IMPORT PAGE ──────────────────────────────────────────
export function ImportPage() {
  const { t } = useApp();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => { api.get('/import/history').then(r=>setHistory(r.data)).catch(()=>{}); }, []);

  const upload = async () => {
    if (!file) return toast.error('Fayl tanlang');
    setLoading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await api.post('/import/orders', fd, { headers:{'Content-Type':'multipart/form-data'} });
      setPreview(r.data);
      toast.success(`${r.data.count} ta buyurtma topildi`);
    } catch(e) { toast.error(e.response?.data?.error || t('error')); }
    finally { setLoading(false); }
  };

  const confirm = async () => {
    try {
      const r = await api.post('/import/orders/confirm', { orders: preview.preview, skip_existing: true });
      toast.success(`${r.data.saved} ta saqlandi, ${r.data.skipped} ta o'tkazib yuborildi`);
      setPreview(null); setFile(null);
      api.get('/import/history').then(r=>setHistory(r.data));
    } catch(e) { toast.error(t('error')); }
  };

  return (
    <div>
      <div style={{ fontWeight:700,fontSize:17,marginBottom:14 }}>📥 {t('import')}</div>
      <Card title="Excel fayl yuklash" icon="📊">
        <div style={{ border:'2px dashed var(--color-border-tertiary)',borderRadius:12,padding:24,textAlign:'center',marginBottom:12,cursor:'pointer',background:'var(--color-background-secondary)' }}
          onClick={()=>document.getElementById('file-input').click()}
          onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='#1a56db'}}
          onDrop={e=>{e.preventDefault();setFile(e.dataTransfer.files[0]);e.currentTarget.style.borderColor=''}}>
          <div style={{fontSize:36,marginBottom:8}}>📊</div>
          <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{file ? file.name : 'Excel fayl tanlang yoki bu yerga tashlang'}</div>
          <div style={{fontSize:12,color:'var(--color-text-secondary)'}}>Заказ_XXXX.xlsx yoki Retpen_uchun_zakazlar.xlsx</div>
          <input id="file-input" type="file" accept=".xlsx,.xls" style={{display:'none'}} onChange={e=>setFile(e.target.files[0])} />
        </div>
        {file && <Btn variant="primary" onClick={upload} style={{marginRight:8}}>{loading?'Yuklanmoqda...':'🔍 Tekshirish va yuklash'}</Btn>}
      </Card>

      {preview && (
        <Card title="Ko'rib chiqish" icon="👁">
          <div style={{padding:'10px 14px',borderRadius:8,background:'#e8f5f0',border:'1px solid #0e9f6e',color:'#0e9f6e',fontSize:13,marginBottom:12}}>
            ✅ {preview.count} ta buyurtma topildi — tasdiqlang
          </div>
          {preview.preview.map((o,i)=>(
            <div key={i} style={{padding:'8px 12px',background:'var(--color-background-secondary)',borderRadius:8,marginBottom:6,fontSize:13}}>
              <strong>#{o.order_number}</strong> — {o.customer} | {o.items?.length||0} ta mahsulot | {o.total_qty} dona
            </div>
          ))}
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <Btn variant="success" onClick={confirm}>✅ Tasdiqlash va saqlash</Btn>
            <Btn onClick={()=>setPreview(null)}>✕ Bekor qilish</Btn>
          </div>
        </Card>
      )}

      <Card title="So'nggi importlar" icon="🕒">
        {history.length===0 ? <div style={{color:'var(--color-text-secondary)',fontSize:13}}>Hali import qilinmagan</div> :
        <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr>{['Sana','Buyurtma #','Xaridor'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',color:'var(--color-text-secondary)',fontWeight:500,borderBottom:'1px solid var(--color-border-tertiary)'}}>{h}</th>)}</tr></thead>
          <tbody>{history.map((h,i)=><tr key={i} style={{borderTop:'1px solid var(--color-border-tertiary)'}}>
            <td style={{padding:'8px 10px'}}>{h.created_at?.slice(0,10)}</td>
            <td style={{padding:'8px 10px',fontWeight:600}}>#{h.order_number}</td>
            <td style={{padding:'8px 10px'}}>{h.customer}</td>
          </tr>)}</tbody>
        </table></div>}
      </Card>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────
export function SettingsPage() {
  const { t, user, can } = useApp();
  const [chatId, setChatId] = useState('');
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username:'',password:'',role:'viewer',department:'' });

  useEffect(() => {
    if (can('create')) api.get('/auth/users').then(r=>setUsers(r.data)).catch(()=>{});
    api.get('/auth/me').then(r=>{ if(r.data.telegram_chat_id) setChatId(r.data.telegram_chat_id); });
  }, [can]);

  const saveTelegram = async () => {
    await api.put('/auth/telegram', { chat_id: chatId });
    toast.success('Telegram saqlandi');
  };
  const testTelegram = async () => {
    try { await api.post('/telegram/test'); toast.success('Test xabar yuborildi!'); }
    catch(e) { toast.error(e.response?.data?.error || 'Xato'); }
  };
  const addUser = async () => {
    try { await api.post('/auth/users', newUser); toast.success('Foydalanuvchi qo\'shildi'); setNewUser({username:'',password:'',role:'viewer',department:''}); api.get('/auth/users').then(r=>setUsers(r.data)); }
    catch(e) { toast.error(e.response?.data?.error || t('error')); }
  };
  const deleteUser = async (id) => {
    await api.delete(`/auth/users/${id}`); toast.success('O\'chirildi');
    setUsers(us=>us.filter(u=>u.id!==id));
  };

  return (
    <div>
      <div style={{ fontWeight:700,fontSize:17,marginBottom:14 }}>⚙️ {t('settings')}</div>

      <Card title="📱 Telegram sozlamalari" icon="">
        <p style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:12}}>
          1. Telegramda <strong>@zavodproduction_bot</strong> ga yozing<br/>
          2. <code>/start</code> yuboring va Chat ID ni oling<br/>
          3. Shu yerga kiriting
        </p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Input value={chatId} onChange={e=>setChatId(e.target.value)} placeholder="1234567890" style={{maxWidth:200}} />
          <Btn variant="primary" onClick={saveTelegram}>💾 Saqlash</Btn>
          {chatId && <Btn onClick={testTelegram}>📤 Test yuborish</Btn>}
        </div>
        <div style={{marginTop:12,padding:'10px 14px',background:'var(--color-background-secondary)',borderRadius:8,fontSize:12,color:'var(--color-text-secondary)'}}>
          <strong>Xabarlar vaqti:</strong> 06:00 (2 kun), 08:00 (3 kun), 18:00 (kunlik hisobot), darhol (liniya to'xtaganda)
        </div>
      </Card>

      {can('create') && (
        <Card title="👥 Foydalanuvchilar" icon="">
          <div style={{overflowX:'auto',marginBottom:12}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr>{['Username','Rol','Bo\'lim',''].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',color:'var(--color-text-secondary)',fontWeight:500,borderBottom:'1px solid var(--color-border-tertiary)'}}>{h}</th>)}</tr></thead>
            <tbody>{users.map(u=><tr key={u.id} style={{borderTop:'1px solid var(--color-border-tertiary)'}}>
              <td style={{padding:'8px 10px',fontWeight:600}}>{u.username}</td>
              <td style={{padding:'8px 10px'}}><span style={{background:u.role==='admin'?'#f0ebff':u.role==='editor'?'#e8f0fe':'#e8f5f0',color:u.role==='admin'?'#7e3af2':u.role==='editor'?'#1a56db':'#0e9f6e',padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600}}>{u.role}</span></td>
              <td style={{padding:'8px 10px'}}>{u.department}</td>
              <td style={{padding:'8px 10px'}}>{u.id!==user?.id&&<button onClick={()=>deleteUser(u.id)} style={{background:'#fde8e8',color:'#e02424',border:'1px solid #e02424',borderRadius:6,padding:'3px 8px',cursor:'pointer',fontSize:11}}>O'chirish</button>}</td>
            </tr>)}</tbody>
          </table></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:8}}>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>Username</label><Input value={newUser.username} onChange={e=>setNewUser(u=>({...u,username:e.target.value}))} /></div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>Parol</label><Input type="password" value={newUser.password} onChange={e=>setNewUser(u=>({...u,password:e.target.value}))} /></div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>Rol</label><Select value={newUser.role} onChange={e=>setNewUser(u=>({...u,role:e.target.value}))}><option value="viewer">Kuzatuvchi</option><option value="editor">Tahrilovchi</option><option value="admin">Admin</option></Select></div>
            <div><label style={{fontSize:12,color:'var(--color-text-secondary)'}}>Bo'lim</label><Input value={newUser.department} onChange={e=>setNewUser(u=>({...u,department:e.target.value}))} /></div>
          </div>
          <Btn variant="primary" onClick={addUser} style={{marginTop:10}}>➕ Qo'shish</Btn>
        </Card>
      )}
    </div>
  );
}
