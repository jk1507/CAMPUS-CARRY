import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useRequestStore from '../store/requestStore.js';
import RequestCard from './RequestCard.jsx';
import RequestDetailModal from './RequestDetailModal.jsx';

export default function Carrying() {
  const { carrying, fetchCarrying } = useRequestStore();
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchCarrying(); }, []);

  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'white' }}>My Deliveries</h1>
        <p style={{ color:'#64748b', fontSize:'13px', marginTop:'2px' }}>{carrying.length} active</p>
      </div>

      {carrying.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', padding:'80px 0', color:'#475569' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px' }}>🛵</div>
          <p style={{ color:'white', fontWeight:600 }}>No active deliveries</p>
          <p style={{ fontSize:'13px', marginTop:'4px' }}>Accept requests from the feed to start earning</p>
        </motion.div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {carrying.map((req, i) => (
            <motion.div key={req.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}>
              <RequestCard request={req} onView={setSelected} />
              <button onClick={() => setSelected(req)}
                style={{ width:'100%', marginTop:'6px', padding:'8px', background:'rgba(15,23,42,0.6)', border:'1px solid #1e293b', borderRadius:'10px', color:'#a78bfa', fontSize:'12px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'border-color 0.15s' }}
                onMouseEnter={e => e.target.style.borderColor='rgba(124,58,237,0.3)'}
                onMouseLeave={e => e.target.style.borderColor='#1e293b'}>
                💬 Chat · 📍 Location · Update Status →
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && <RequestDetailModal request={selected} onClose={() => setSelected(null)} onRefresh={fetchCarrying} />}
      </AnimatePresence>
    </div>
  );
}
