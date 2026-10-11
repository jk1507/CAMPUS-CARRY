import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const orbs = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: 150 + Math.random() * 220, dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25,
      hue: [260,240,270,220,250,280][i],
    }));
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * 1920, y: Math.random() * 1080,
      r: Math.random() * 1.2 + 0.3, dx: (Math.random() - 0.5) * 0.15, dy: -0.15 - Math.random() * 0.2, alpha: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      orbs.forEach(o => {
        o.x += o.dx; o.y += o.dy;
        if (o.x < -o.r) o.x = canvas.width + o.r; if (o.x > canvas.width + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = canvas.height + o.r; if (o.y > canvas.height + o.r) o.y = -o.r;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `hsla(${o.hue},75%,55%,0.1)`); g.addColorStop(1, `hsla(${o.hue},75%,55%,0)`);
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      });
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.alpha})`; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const features = [
    { icon: '📦', title: 'Post a Request', desc: 'Describe what you need and set a reward. Takes 30 seconds.' },
    { icon: '🛵', title: 'Carrier Accepts', desc: 'A nearby student picks it up and heads your way.' },
    { icon: '📍', title: 'Track Live', desc: 'Watch the carrier move in real time on the map.' },
    { icon: '⭐', title: 'Rate & Done', desc: 'Pay the carrier, leave a rating. That\'s it.' },
  ];

  const S = {
    page: { minHeight: '100vh', background: '#020817', overflow: 'hidden', position: 'relative', fontFamily: 'DM Sans, sans-serif' },
    grid: { position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025, backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '60px 60px' },
    nav: { position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '24px 40px', maxWidth: '1200px', margin: '0 auto' },
    hero: { position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '90vh', padding: '0 24px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' },
  };

  return (
    <div style={S.page}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.9 }} />
      <div style={S.grid} />

      <nav style={S.nav}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => navigate('/auth')} style={{ padding: '8px 16px', fontSize: '14px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Sign In</button>
          <button onClick={() => navigate('/auth')} style={{ padding: '10px 20px', borderRadius: '50px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}>Get Started</button>
        </div>
      </nav>

      <div style={S.hero}>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'6px 16px', borderRadius:'50px', border:'1px solid rgba(124,58,237,0.3)', background:'rgba(124,58,237,0.05)', color:'#a78bfa', fontSize:'11px', fontFamily:'monospace', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'36px' }}>
          <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#a78bfa' }} /> Student-powered campus delivery
        </motion.div>

        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }} style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'24px' }}>
          <div style={{ width:'80px', height:'80px', borderRadius:'24px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'42px', marginBottom:'20px', boxShadow:'0 0 60px rgba(124,58,237,0.5)' }}>🛵</div>
          <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:900, fontSize:'clamp(52px,10vw,100px)', color:'white', lineHeight:0.9, letterSpacing:'-0.04em', marginBottom:'0' }}>
            Campus<span style={{ backgroundImage:'linear-gradient(135deg,#a78bfa 0%,#818cf8 50%,#60a5fa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Carry</span>
          </h1>
        </motion.div>

        <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} style={{ fontSize:'clamp(18px,3vw,26px)', color:'#94a3b8', fontWeight:400, marginBottom:'12px', fontStyle:'italic' }}>
          Forgot something? We've got it.
        </motion.p>
        <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }} style={{ fontSize:'15px', color:'#475569', maxWidth:'480px', lineHeight:1.7, marginBottom:'48px' }}>
          Connect with fellow students to send and receive anything across campus — fast, trusted, and rewarding.
        </motion.p>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }} style={{ display:'flex', gap:'16px', flexWrap:'wrap', justifyContent:'center', marginBottom:'72px' }}>
          <button onClick={() => navigate('/auth')} style={{ padding:'16px 36px', borderRadius:'16px', fontSize:'16px', fontWeight:700, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 40px rgba(124,58,237,0.45)' }}>Request a Delivery →</button>
          <button onClick={() => navigate('/auth')} style={{ padding:'16px 36px', borderRadius:'16px', fontSize:'16px', fontWeight:700, background:'rgba(30,41,59,0.8)', color:'white', border:'1px solid #334155', cursor:'pointer', fontFamily:'inherit' }}>Earn as Carrier 🛵</button>
        </motion.div>

        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.75 }} style={{ display:'flex', gap:'60px', flexWrap:'wrap', justifyContent:'center' }}>
          {[['2 min','Avg pickup'],['₹50–500','Per delivery'],['100%','Campus verified']].map(([v,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'Syne, sans-serif', fontWeight:900, fontSize:'32px', color:'white' }}>{v}</div>
              <div style={{ fontSize:'12px', color:'#475569', marginTop:'4px', fontWeight:500 }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <div style={{ position:'relative', zIndex:10, maxWidth:'1000px', margin:'0 auto', padding:'0 24px 100px' }}>
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <p style={{ color:'#7c3aed', fontFamily:'monospace', fontSize:'11px', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'12px' }}>How it works</p>
          <h2 style={{ fontFamily:'Syne, sans-serif', fontWeight:900, fontSize:'36px', color:'white' }}>Simple as 1, 2, 3, 4</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'16px' }}>
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
              style={{ background:'rgba(15,23,42,0.7)', border:'1px solid #1e293b', borderRadius:'20px', padding:'24px', textAlign:'center' }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>{f.icon}</div>
              <p style={{ color:'white', fontWeight:600, fontSize:'14px', marginBottom:'6px' }}>{f.title}</p>
              <p style={{ color:'#475569', fontSize:'12px', lineHeight:1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
