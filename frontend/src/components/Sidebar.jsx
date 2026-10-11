import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore.js';
import { disconnectSocket } from '../socket/socket.js';

const requesterLinks = [
  { to:'/app',         label:'My Requests',        icon:'📦', end:true },
  { to:'/app/new',     label:'New Request',         icon:'＋' },
  { to:'/app/spending',label:'Spending Dashboard',  icon:'📊' },
  { to:'/app/map',     label:'3D Map',              icon:'🗺' },
  { to:'/app/profile', label:'Profile',             icon:'👤' },
  { to:'/app/help',    label:'Help & Report',       icon:'🆘' },
];
const carrierLinks = [
  { to:'/app',          label:'Live Feed',     icon:'⚡', end:true },
  { to:'/app/carrying', label:'My Deliveries', icon:'🛵' },
  { to:'/app/earnings',  label:'Earnings',     icon:'💰' },
  { to:'/app/withdraw', label:'Withdraw',       icon:'💸' },
  { to:'/app/map',      label:'3D Map',        icon:'🗺' },
  { to:'/app/profile',  label:'Profile',       icon:'👤' },
  { to:'/app/help',     label:'Help & Report', icon:'🆘' },
];

export default function Sidebar() {
  const { user, activeRole, logout } = useAuthStore();
  const navigate = useNavigate();
  const links = activeRole === 'carrier' ? carrierLinks : requesterLinks;
  const handleLogout = () => { disconnectSocket(); logout(); navigate('/'); };

  return (
    <>
      <style>{`@media(min-width:768px){.cc-sidebar{display:flex!important;}}`}</style>
      <motion.aside initial={{ x:-40, opacity:0 }} animate={{ x:0, opacity:1 }}
        className="cc-sidebar"
        style={{ display:'none', width:'220px', flexShrink:0, background:'#0a1628', borderRight:'1px solid #1e293b', padding:'20px 12px', flexDirection:'column', height:'100%', overflowY:'auto' }}>

        <div style={{ marginBottom:'20px', paddingLeft:'4px' }}>
          <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'50px', fontWeight:700, textTransform:'capitalize', background:activeRole==='carrier'?'rgba(59,130,246,0.1)':'rgba(124,58,237,0.1)', color:activeRole==='carrier'?'#60a5fa':'#a78bfa', border:`1px solid ${activeRole==='carrier'?'rgba(59,130,246,0.25)':'rgba(124,58,237,0.25)'}` }}>
            {activeRole === 'carrier' ? '🛵' : '📦'} {activeRole}
          </span>
        </div>

        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:'2px' }}>
          {links.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px',
                fontSize:'13px', fontWeight:500, textDecoration:'none', transition:'all 0.15s',
                background: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
                color: isActive ? '#a78bfa' : to==='/app/help' ? 'rgba(239,68,68,0.7)' : '#475569',
                border: isActive ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
              })}>
              <span style={{ fontSize:'15px', width:'20px', textAlign:'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop:'1px solid #1e293b', paddingTop:'16px', marginTop:'8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'0 4px', marginBottom:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'10px', flexShrink:0, background:'rgba(124,58,237,0.15)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {user?.avatar_url ? <img src={user.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
                : <span style={{ color:'#a78bfa', fontWeight:700, fontSize:'13px' }}>{user?.name?.[0]}</span>}
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ color:'white', fontSize:'13px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</p>
              <p style={{ color:'#334155', fontSize:'11px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.campus}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:'10px', fontSize:'13px', color:'#475569', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}
            onMouseEnter={e => { e.target.style.color='#f87171'; e.target.style.background='rgba(239,68,68,0.05)'; }}
            onMouseLeave={e => { e.target.style.color='#475569'; e.target.style.background='none'; }}>
            Sign out →
          </button>
        </div>
      </motion.aside>
    </>
  );
}
