import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useRequestStore from '../store/requestStore.js';
import toast from 'react-hot-toast';

const steps = ['Details', 'Locations', 'Reward'];

const inp = {
  width: '100%', background: '#1e293b', border: '1px solid #334155',
  borderRadius: '12px', padding: '12px 16px', color: '#f1f5f9',
  fontSize: '14px', outline: 'none', fontFamily: 'inherit',
};

function Field({ label, value, onChange, placeholder, type = 'text', textarea }) {
  return (
    <div>
      <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>{label}</p>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            style={{ ...inp, resize:'none' }}
            onFocus={e => e.target.style.borderColor='#7c3aed'}
            onBlur={e  => e.target.style.borderColor='#334155'} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={inp}
            onFocus={e => e.target.style.borderColor='#7c3aed'}
            onBlur={e  => e.target.style.borderColor='#334155'} />}
    </div>
  );
}

export default function RequestWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ title:'', description:'', pickup_location:'', dropoff_location:'', reward:'', weight_kg:'', deadline:'' });
  const { createRequest } = useRequestStore();
  const navigate = useNavigate();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.pickup_location || !form.dropoff_location || !form.reward)
      return toast.error('Please fill in all required fields');
    const result = await createRequest({
      title: form.title, description: form.description || undefined,
      pickup_location: form.pickup_location, dropoff_location: form.dropoff_location,
      reward: Number(form.reward),
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      deadline: form.deadline || undefined,
    });
    if (result.success) { toast.success('Request posted! 🚀'); navigate('/app/mine'); }
    else toast.error(result.error);
  };

  return (
    <div style={{ maxWidth:'520px', margin:'0 auto' }}>
      <div style={{ marginBottom:'32px' }}>
        <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'white' }}>New Request</h1>
        <p style={{ color:'#64748b', fontSize:'13px', marginTop:'4px' }}>Tell carriers what you need delivered</p>
      </div>

      {/* Step indicators */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'28px' }}>
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, background:i < step ? '#7c3aed' : 'transparent', border:i < step ? '2px solid #7c3aed' : i === step ? '2px solid #7c3aed' : '2px solid #334155', color: i < step ? 'white' : i === step ? '#a78bfa' : '#475569' }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize:'13px', fontWeight:500, color: i <= step ? '#a78bfa' : '#475569' }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex:1, height:'1px', background: i < step ? '#7c3aed' : '#1e293b' }} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}
          style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
          {step === 0 && (<>
            <Field label="Title *"      value={form.title}       onChange={v => set('title',v)}       placeholder="What needs to be delivered?" />
            <Field label="Description"  value={form.description} onChange={v => set('description',v)} placeholder="Extra details for the carrier..." textarea />
            <Field label="Weight (kg)"  value={form.weight_kg}   onChange={v => set('weight_kg',v)}   placeholder="e.g. 0.5" type="number" />
          </>)}
          {step === 1 && (<>
            <Field label="Pickup Location *"  value={form.pickup_location}  onChange={v => set('pickup_location',v)}  placeholder="e.g. Main Gate, Canteen Block A" />
            <Field label="Dropoff Location *" value={form.dropoff_location} onChange={v => set('dropoff_location',v)} placeholder="e.g. Hostel Block C, Room 204" />
            <Field label="Deadline (optional)" value={form.deadline}        onChange={v => set('deadline',v)}         type="datetime-local" />
          </>)}
          {step === 2 && (<>
            <Field label="Reward (₹) *" value={form.reward} onChange={v => set('reward',v)} placeholder="How much are you offering?" type="number" />
            <div style={{ background:'rgba(124,58,237,0.05)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'12px', padding:'16px' }}>
              <p style={{ color:'#64748b', fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'10px' }}>Summary</p>
              <p style={{ color:'white', fontWeight:600 }}>{form.title || '—'}</p>
              {form.description && <p style={{ color:'#64748b', fontSize:'12px', marginTop:'4px' }}>{form.description}</p>}
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'10px', fontSize:'12px', color:'#64748b' }}>
                <span>📍 {form.pickup_location || '—'}</span><span>→</span><span>🏁 {form.dropoff_location || '—'}</span>
              </div>
              <p style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'#a78bfa', marginTop:'10px' }}>₹{form.reward || '0'}</p>
            </div>
          </>)}
        </motion.div>
      </AnimatePresence>

      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'20px', gap:'12px' }}>
        <button onClick={() => setStep(s => s-1)} disabled={step===0}
          style={{ padding:'10px 20px', borderRadius:'12px', background:'rgba(30,41,59,0.8)', border:'1px solid #334155', color:step===0?'#334155':'#94a3b8', fontSize:'14px', fontWeight:500, cursor:step===0?'not-allowed':'pointer', fontFamily:'inherit' }}>
          ← Back
        </button>
        {step < steps.length - 1
          ? <button onClick={() => setStep(s => s+1)} style={{ padding:'10px 24px', borderRadius:'12px', background:'#7c3aed', border:'none', color:'white', fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 20px rgba(124,58,237,0.3)' }}>Next →</button>
          : <button onClick={handleSubmit}            style={{ padding:'10px 24px', borderRadius:'12px', background:'#7c3aed', border:'none', color:'white', fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 20px rgba(124,58,237,0.35)' }}>Post Request 🚀</button>}
      </div>
    </div>
  );
}
