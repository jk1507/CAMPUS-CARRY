import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import client from '../api/client.js';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ label, value, sub, color, delay = 0 }) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'20px' }}>
      <p style={{ color:'#475569', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>{label}</p>
      <p style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'28px', color }}>{value}</p>
      {sub && <p style={{ color:'#334155', fontSize:'12px', marginTop:'4px' }}>{sub}</p>}
    </motion.div>
  );
}

function BarChart({ data, valueKey, labelKey, color, prefix = '' }) {
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', height:'120px', paddingTop:'8px' }}>
      {data.map((d, i) => {
        const h = Math.max(4, ((Number(d[valueKey]) || 0) / max) * 100);
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }} title={`${d[labelKey]}: ${prefix}${d[valueKey]}`}>
            <motion.div initial={{ height:0 }} animate={{ height:`${h}%` }} transition={{ delay:i*0.04, duration:0.5 }}
              style={{ width:'100%', borderRadius:'4px 4px 0 0', background:color, opacity:0.85, minHeight:'4px' }} />
            <span style={{ fontSize:'9px', color:'#334155' }}>{d[labelKey]?.slice(0,3)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function RequesterDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { client.get('/dashboard/requester').then(r => setData(r.data.data)).catch(() => {}); }, []);

  if (!data) return <div style={{ textAlign:'center', padding:'80px 0', color:'#475569', fontSize:'32px' }}>⟳</div>;

  const statusMap = {};
  (data.byStatus || []).forEach(s => { statusMap[s.status] = s.count; });
  const breakdown = (data.monthlyBreakdown || []).map(m => ({ ...m, label: MONTHS[parseInt(m.month?.split('-')[1]) - 1] || m.month }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div>
        <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'white' }}>Spending Dashboard</h1>
        <p style={{ color:'#64748b', fontSize:'13px', marginTop:'2px' }}>Track your delivery requests and spending</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        <StatCard label="This Week"  value={data.weekly?.count  || 0} sub={`₹${data.weekly?.spent  || 0} spent`} color="#60a5fa" delay={0}    />
        <StatCard label="This Month" value={data.monthly?.count || 0} sub={`₹${data.monthly?.spent || 0} spent`} color="#a78bfa" delay={0.05} />
        <StatCard label="This Year"  value={data.yearly?.count  || 0} sub={`₹${data.yearly?.spent  || 0} spent`} color="#34d399" delay={0.1}  />
        <StatCard label="Total Paid" value={`₹${data.yearly?.spent || 0}`} sub="last 12 months"               color="#facc15" delay={0.15} />
      </div>

      <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'20px' }}>
        <p style={{ color:'#475569', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'14px' }}>By Status</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
          {[{label:'Open',color:'#34d399',key:'open'},{label:'Delivered',color:'#a78bfa',key:'delivered'},{label:'Cancelled',color:'#f87171',key:'cancelled'}].map(s => (
            <div key={s.key} style={{ textAlign:'center' }}>
              <p style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:s.color }}>{statusMap[s.key] || 0}</p>
              <p style={{ color:'#475569', fontSize:'12px', marginTop:'2px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {breakdown.length > 0 ? (<>
        <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'20px' }}>
          <p style={{ color:'#475569', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>Monthly Spending (₹)</p>
          <BarChart data={breakdown} valueKey="spent"    labelKey="label" color="#a78bfa" prefix="₹" />
        </div>
        <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'20px' }}>
          <p style={{ color:'#475569', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>Monthly Requests</p>
          <BarChart data={breakdown} valueKey="requests" labelKey="label" color="#60a5fa" />
        </div>
      </>) : (
        <div style={{ textAlign:'center', padding:'48px 0', color:'#475569' }}>
          <div style={{ fontSize:'40px', marginBottom:'12px' }}>📦</div>
          <p style={{ fontSize:'14px' }}>No requests yet. Post your first delivery!</p>
        </div>
      )}
    </div>
  );
}
