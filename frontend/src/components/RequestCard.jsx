import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const statusColor = {
  open:        { color:'#34d399', bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.2)'  },
  accepted:    { color:'#60a5fa', bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.2)'  },
  in_progress: { color:'#facc15', bg:'rgba(250,204,21,0.1)',  border:'rgba(250,204,21,0.2)'  },
  delivered:   { color:'#a78bfa', bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.2)' },
  cancelled:   { color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.2)' },
};

export default function RequestCard({ request, onAccept, onView, showAccept = false }) {
  const sc = statusColor[request.status] || statusColor.open;
  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} whileHover={{ y:-1 }} transition={{ duration:0.15 }}
      onClick={() => onView?.(request)}
      style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'20px', cursor:'pointer', transition:'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor='#334155'}
      onMouseLeave={e => e.currentTarget.style.borderColor='#1e293b'}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', flexWrap:'wrap' }}>
            <span style={{ fontSize:'11px', padding:'2px 10px', borderRadius:'50px', fontWeight:600, textTransform:'capitalize', color:sc.color, background:sc.bg, border:`1px solid ${sc.border}` }}>{request.status?.replace('_',' ')}</span>
            <span style={{ fontSize:'11px', color:'#475569' }}>{request.created_at ? formatDistanceToNow(new Date(request.created_at), { addSuffix:true }) : ''}</span>
          </div>
          <h3 style={{ fontWeight:600, color:'white', fontSize:'15px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{request.title}</h3>
          {request.description && <p style={{ fontSize:'13px', color:'#475569', marginTop:'4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{request.description}</p>}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'10px', fontSize:'12px', color:'#475569' }}>
            <span>📍 {request.pickup_location}</span>
            <span style={{ color:'#334155' }}>→</span>
            <span>🏁 {request.dropoff_location}</span>
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'22px', color:'#a78bfa' }}>₹{request.reward}</div>
          {request.weight_kg && <div style={{ fontSize:'11px', color:'#475569', marginTop:'2px' }}>{request.weight_kg}kg</div>}
        </div>
      </div>

      {(request.requester_name || showAccept) && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'14px', paddingTop:'14px', borderTop:'1px solid #1e293b' }}>
          {request.requester_name && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'24px', height:'24px', borderRadius:'8px', background:'rgba(124,58,237,0.15)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {request.avatar_url ? <img src={request.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
                  : <span style={{ fontSize:'10px', color:'#a78bfa', fontWeight:700 }}>{request.requester_name?.[0]}</span>}
              </div>
              <span style={{ fontSize:'12px', color:'#64748b' }}>{request.requester_name}</span>
              {request.requester_rating && <span style={{ fontSize:'11px', color:'#facc15' }}>★ {Number(request.requester_rating).toFixed(1)}</span>}
            </div>
          )}
          {showAccept && request.status === 'open' && (
            <button onClick={e => { e.stopPropagation(); onAccept?.(request.id); }}
              style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:'8px', background:'#7c3aed', color:'white', border:'none', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 12px rgba(124,58,237,0.3)' }}>
              Accept
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
