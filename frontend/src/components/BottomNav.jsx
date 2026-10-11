import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';

const requesterItems = [
  { to:'/app',         icon:'📦', label:'Mine',  end:true },
  { to:'/app/new',     icon:'＋', label:'Post'         },
  { to:'/app/map',     icon:'🗺', label:'Radar'        },
  { to:'/app/spending',icon:'📊', label:'Stats'        },
  { to:'/app/profile', icon:'👤', label:'Me'           },
];
const carrierItems = [
  { to:'/app',          icon:'⚡', label:'Feed',  end:true },
  { to:'/app/carrying', icon:'🛵', label:'Carry'        },
  { to:'/app/map',      icon:'🗺', label:'Radar'        },
  { to:'/app/earnings', icon:'💰', label:'Earn'         },
  { to:'/app/profile',  icon:'👤', label:'Me'           },
];

export default function BottomNav() {
  const { activeRole } = useAuthStore();
  const items = activeRole === 'carrier' ? carrierItems : requesterItems;
  return (
    <>
      <style>{`@media(min-width:768px){.cc-bottom-nav{display:none!important;}}`}</style>
      <nav className="cc-bottom-nav" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:'rgba(10, 22, 40, 0.92)', backdropFilter:'blur(16px)', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', paddingBottom:'env(safe-area-inset-bottom, 4px)' }}>
        {items.map(({ to, icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            style={({ isActive }) => ({ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 2px', gap:'2px', fontSize:'10px', fontWeight:600, textDecoration:'none', color: isActive ? '#a78bfa' : '#64748b', transition:'color 0.15s' })}>
            <span style={{ fontSize:'18px', lineHeight:1 }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
