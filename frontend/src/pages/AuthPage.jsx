import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

const inp = { width:'100%', background:'#1e293b', border:'1px solid #334155', borderRadius:'12px', padding:'12px 16px', color:'#f1f5f9', fontSize:'14px', outline:'none', fontFamily:'inherit' };

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();
  const [mode, setMode] = useState('login');
  const [chosenRole, setChosenRole] = useState('requester');
  const [form, setForm] = useState({ name:'', email:'', password:'', campus:'', phone:'' });
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (mode === 'register' && chosenRole === 'carrier' && !form.phone) return toast.error('Phone required for carriers');
    const result = mode === 'login'
      ? await login(form.email, form.password, chosenRole)
      : await register({ ...form, role: chosenRole });
    if (result.success) { toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!'); navigate('/app'); }
    else toast.error(result.error);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#020817', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'DM Sans, sans-serif', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%,rgba(139,92,246,0.08) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(99,102,241,0.06) 0%,transparent 50%)', pointerEvents:'none' }} />
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} style={{ position:'relative', width:'100%', maxWidth:'420px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🛵</div>
            <span style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'22px', color:'white' }}>CampusCarry</span>
          </div>
          <p style={{ color:'#64748b', fontSize:'14px' }}>{mode === 'login' ? 'Sign in to continue' : 'Create your account'}</p>
        </div>

        <div style={{ background:'rgba(15,23,42,0.9)', border:'1px solid #1e293b', borderRadius:'20px', padding:'32px' }}>
          {/* Mode toggle */}
          <div style={{ display:'flex', borderRadius:'12px', overflow:'hidden', border:'1px solid #1e293b', marginBottom:'24px' }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'10px', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit', background:mode===m?'#7c3aed':'transparent', color:mode===m?'white':'#64748b', transition:'all 0.15s', textTransform:'capitalize' }}>{m==='login'?'Sign In':'Register'}</button>
            ))}
          </div>

          {/* Role selector */}
          <div style={{ marginBottom:'20px' }}>
            <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'8px' }}>I want to</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {[{role:'requester',icon:'📦',label:'Request',desc:'Post items to deliver'},{role:'carrier',icon:'🛵',label:'Carry & Earn',desc:'Deliver & earn money'}].map(r => (
                <button key={r.role} type="button" onClick={() => setChosenRole(r.role)} style={{ padding:'12px', borderRadius:'12px', border:`1px solid ${chosenRole===r.role?'#7c3aed':'#334155'}`, background:chosenRole===r.role?'rgba(124,58,237,0.1)':'transparent', textAlign:'left', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                  <div style={{ fontSize:'20px', marginBottom:'4px' }}>{r.icon}</div>
                  <div style={{ fontSize:'12px', fontWeight:600, color:'white' }}>{r.label}</div>
                  <div style={{ fontSize:'11px', color:'#475569', marginTop:'2px' }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div key="reg" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ display:'flex', flexDirection:'column', gap:'14px', overflow:'hidden' }}>
                  <div>
                    <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>Full Name</p>
                    <input style={inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Your name" required onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#334155'} />
                  </div>
                  <div>
                    <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>Campus</p>
                    <input style={inp} value={form.campus} onChange={e=>set('campus',e.target.value)} placeholder="e.g. GITAM University" required onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#334155'} />
                  </div>
                  {chosenRole === 'carrier' && (
                    <div>
                      <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>Phone Number *</p>
                      <input style={inp} type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="e.g. 9876543210" onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#334155'} />
                      <p style={{ color:'#334155', fontSize:'11px', marginTop:'4px' }}>Only for admin/support. Never shown to others.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div>
              <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>Email</p>
              <input style={inp} type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@campus.edu" required onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#334155'} />
            </div>
            <div>
              <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>Password</p>
              <input style={inp} type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="••••••••" required onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#334155'} />
            </div>
            <button type="submit" disabled={isLoading} style={{ width:'100%', padding:'14px', borderRadius:'12px', background:'#7c3aed', color:'white', border:'none', fontWeight:600, fontSize:'14px', cursor:isLoading?'not-allowed':'pointer', opacity:isLoading?0.6:1, fontFamily:'inherit', boxShadow:'0 0 20px rgba(124,58,237,0.3)', marginTop:'4px' }}>
              {isLoading ? 'Loading...' : mode==='login' ? `Sign In as ${chosenRole}` : 'Create Account'}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', color:'#475569', fontSize:'13px', marginTop:'16px' }}>
          <button onClick={() => navigate('/')} style={{ color:'#475569', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'13px' }}>← Back to home</button>
        </p>
      </motion.div>
    </div>
  );
}
