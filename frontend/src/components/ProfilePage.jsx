import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore.js';
import client from '../api/client.js';
import toast from 'react-hot-toast';

const inp = { width:'100%', background:'#1e293b', border:'1px solid #334155', borderRadius:'12px', padding:'10px 16px', color:'#f1f5f9', fontSize:'14px', outline:'none', fontFamily:'inherit' };

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [feedback, setFeedback]         = useState([]);
  const [form, setForm]                 = useState({ name:'', bio:'', campus:'' });
  const [saving, setSaving]             = useState(false);
  const [uploadingAvatar, setUploading] = useState(false);
  const [avatarPreview, setPreview]     = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { fetchMe(); }, []);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', bio: user.bio || '', campus: user.campus || '' });
      setPreview(user.avatar_url || null);
      if (user.id) client.get(`/feedback/user/${user.id}`).then(r => setFeedback(r.data.data)).catch(() => {});
    }
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    try { await client.patch('/users/me', form); toast.success('Profile updated ✓'); fetchMe(); }
    catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleAvatar = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB');
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        await client.patch('/users/me', { avatar_url: ev.target.result });
        setPreview(ev.target.result); fetchMe(); toast.success('Photo updated! 🎉');
      } catch { toast.error('Failed to upload photo'); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const avg = user?.rating ? Number(user.rating).toFixed(1) : null;

  return (
    <div style={{ maxWidth:'520px', margin:'0 auto' }}>
      <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'white', marginBottom:'24px' }}>Profile</h1>

      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'20px', padding:'24px', marginBottom:'20px' }}>

        {/* Avatar */}
        <div style={{ display:'flex', alignItems:'center', gap:'20px', marginBottom:'24px' }}>
          <div style={{ position:'relative', cursor:'pointer', flexShrink:0 }} onClick={() => fileRef.current?.click()}>
            <div style={{ width:'76px', height:'76px', borderRadius:'20px', background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {avatarPreview ? <img src={avatarPreview} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
                : <span style={{ fontSize:'28px', fontWeight:700, color:'#a78bfa', fontFamily:'Syne, sans-serif' }}>{user?.name?.[0]?.toUpperCase()}</span>}
            </div>
            <div style={{ position:'absolute', inset:0, borderRadius:'20px', background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}>
              <span style={{ color:'white', fontSize:'12px', fontWeight:600 }}>{uploadingAvatar?'...':'📷'}</span>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }} onChange={handleAvatar} />
          </div>
          <div>
            <p style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'20px', color:'white' }}>{user?.name}</p>
            <p style={{ fontSize:'13px', color:'#64748b', textTransform:'capitalize', marginTop:'2px' }}>{user?.role} · {user?.campus}</p>
            {avg && (
              <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'6px' }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:'13px', color:s<=Math.round(Number(avg))?'#facc15':'#1e293b' }}>★</span>)}
                <span style={{ fontSize:'12px', color:'#64748b', marginLeft:'4px' }}>{avg}</span>
              </div>
            )}
            <p style={{ fontSize:'11px', color:'#334155', marginTop:'4px' }}>Click photo to change</p>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {[{label:'Full Name',key:'name',placeholder:'Your name'},{label:'Campus',key:'campus',placeholder:'e.g. GITAM University'},{label:'Bio',key:'bio',placeholder:'Tell others about yourself...'}].map(({ label, key, placeholder }) => (
            <div key={key}>
              <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>{label}</p>
              <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={inp}
                onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='#334155'} />
            </div>
          ))}
          <button onClick={handleSave} disabled={saving}
            style={{ width:'100%', padding:'12px', borderRadius:'12px', background:'#7c3aed', color:'white', fontSize:'14px', fontWeight:600, cursor:saving?'not-allowed':'pointer', opacity:saving?0.6:1, border:'none', fontFamily:'inherit', boxShadow:'0 0 16px rgba(124,58,237,0.3)', marginTop:'4px' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>

      {feedback.length > 0 && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.15 }}>
          <h2 style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'18px', color:'white', marginBottom:'14px' }}>Reviews <span style={{ color:'#475569', fontWeight:400, fontSize:'14px' }}>({feedback.length})</span></h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {feedback.map(f => (
              <div key={f.id} style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'14px', padding:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(124,58,237,0.15)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                      {f.avatar_url ? <img src={f.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
                        : <span style={{ fontSize:'11px', color:'#a78bfa', fontWeight:700 }}>{f.from_name?.[0]}</span>}
                    </div>
                    <span style={{ fontSize:'13px', fontWeight:600, color:'white' }}>{f.from_name}</span>
                  </div>
                  <div style={{ display:'flex', gap:'2px' }}>{[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:'13px', color:s<=f.rating?'#facc15':'#1e293b' }}>★</span>)}</div>
                </div>
                {f.comment && <p style={{ fontSize:'13px', color:'#64748b' }}>{f.comment}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
