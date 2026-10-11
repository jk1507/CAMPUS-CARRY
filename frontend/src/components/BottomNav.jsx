import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';

const requesterItems = [
  { to:'/app',         icon:'📦', label:'Mine',  end:true },
  { to:'/app/new',     icon:'＋', label:'Post'         },
  { to:'/app/spending',icon:'📊', label:'Stats'        },
  { to:'/app/help',    icon:'🆘', label:'Help'         },
  { to:'/app/profile', icon:'👤', label:'Me'           },
];
const carrierItems = [
  { to:'/app',          icon:'⚡', label:'Feed',  end:true },
  { to:'/app/carrying', icon:'🛵', label:'Carry'        },
  { to:'/app/earnings', icon:'💰', label:'Earn'         },
  { to:'/app/help',     icon:'🆘', label:'Help'         },
  { to:'/app/profile',  icon:'👤', label:'Me'           },
];

export default function BottomNav() {
  const { activeRole } = useAuthStore();
  const items = activeRole === 'carrier' ? carrierItems : requesterItems;
  return (
    <>
      <style>{`@media(min-width:768px){.cc-bottom-nav{display:none!important;}}`}</style>
      <nav className="cc-bottom-nav" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:'#0a1628', borderTop:'1px solid #1e293b', display:'flex' }}>
        {items.map(({ to, icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            style={({ isActive }) => ({ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 4px', gap:'2px', fontSize:'10px', fontWeight:500, textDecoration:'none', color: isActive ? '#a78bfa' : to==='/app/help' ? 'rgba(239,68,68,0.6)' : '#475569', fontFamily:'DM Sans, sans-serif', transition:'color 0.15s' })}>
            <span style={{ fontSize:'20px', lineHeight:1 }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
