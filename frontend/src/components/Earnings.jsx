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

export default function Earnings() {
  const [data, setData] = useState(null);

  useEffect(() => { client.get('/dashboard/carrier').then(r => setData(r.data.data)).catch(() => {}); }, []);

  if (!data) return <div style={{ textAlign:'center', padding:'80px 0', color:'#475569', fontSize:'32px' }}>⟳</div>;

  const breakdown = (data.monthlyBreakdown || []).map(m => ({
    ...m, label: MONTHS[parseInt(m.month?.split('-')[1]) - 1] || m.month,
  }));
  const avg = Number(data.avgRating || 0).toFixed(1);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div>
        <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'white' }}>Earnings Dashboard</h1>
        <p style={{ color:'#64748b', fontSize:'13px', marginTop:'2px' }}>Your delivery stats and income</p>
      </div>

      {/* Rating */}
      <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'20px', display:'flex', alignItems:'center', gap:'16px' }}>
        <div style={{ fontFamily:'Syne, sans-serif', fontWeight:900, fontSize:'48px', color:'#facc15' }}>{avg}</div>
        <div>
          <div style={{ display:'flex', gap:'2px', marginBottom:'4px' }}>
            {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:'18px', color:s<=Math.round(Number(avg))?'#facc15':'#1e293b' }}>★</span>)}
          </div>
          <p style={{ color:'white', fontSize:'14px', fontWeight:600 }}>Average Rating</p>
          <p style={{ color:'#475569', fontSize:'12px' }}>Based on all deliveries</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        <StatCard label="Today"      value={`₹${data.daily?.earned    || 0}`} sub={`${data.daily?.deliveries    || 0} deliveries`} color="#34d399" delay={0}    />
        <StatCard label="This Week"  value={`₹${data.weekly?.earned   || 0}`} sub={`${data.weekly?.deliveries   || 0} deliveries`} color="#a78bfa" delay={0.05} />
        <StatCard label="This Month" value={`₹${data.monthly?.earned  || 0}`} sub={`${data.monthly?.deliveries  || 0} deliveries`} color="#60a5fa" delay={0.1}  />
        <StatCard label="This Year"  value={`₹${data.yearly?.earned   || 0}`} sub={`${data.yearly?.deliveries   || 0} deliveries`} color="#facc15" delay={0.15} />
      </div>

      {breakdown.length > 0 ? (<>
        <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'20px' }}>
          <p style={{ color:'#475569', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>Monthly Earnings (₹)</p>
          <BarChart data={breakdown} valueKey="earned"    labelKey="label" color="#a78bfa" prefix="₹" />
        </div>
        <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'20px' }}>
          <p style={{ color:'#475569', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>Monthly Deliveries</p>
          <BarChart data={breakdown} valueKey="deliveries" labelKey="label" color="#34d399" />
        </div>
      </>) : (
        <div style={{ textAlign:'center', padding:'48px 0', color:'#475569' }}>
          <div style={{ fontSize:'40px', marginBottom:'12px' }}>📦</div>
          <p style={{ fontSize:'14px' }}>No deliveries yet. Accept requests from the feed to start earning!</p>
        </div>
      )}
    </div>
  );
}
