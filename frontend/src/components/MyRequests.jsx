import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useRequestStore from '../store/requestStore.js';
import RequestCard from './RequestCard.jsx';
import RequestDetailModal from './RequestDetailModal.jsx';

export default function MyRequests() {
  const { myRequests, fetchMine } = useRequestStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchMine(); }, []);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'white' }}>My Requests</h1>
          <p style={{ color:'#64748b', fontSize:'13px', marginTop:'2px' }}>{myRequests.length} total</p>
        </div>
        <button onClick={() => navigate('/app/new')} style={{ padding:'8px 16px', borderRadius:'10px', background:'#7c3aed', color:'white', border:'none', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 16px rgba(124,58,237,0.3)' }}>+ New</button>
      </div>

      {myRequests.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', padding:'80px 0', color:'#475569' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px' }}>📦</div>
          <p style={{ color:'white', fontWeight:600 }}>No requests yet</p>
          <button onClick={() => navigate('/app/new')} style={{ marginTop:'16px', padding:'10px 24px', borderRadius:'10px', background:'#7c3aed', color:'white', border:'none', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Post First Request</button>
        </motion.div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {myRequests.map((req, i) => (
            <motion.div key={req.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}>
              <RequestCard request={req} onView={setSelected} />
              {req.carrier_name && req.status !== 'cancelled' && (
                <div style={{ margin:'4px 4px 0', padding:'10px 16px', background:'rgba(15,23,42,0.6)', border:'1px solid #1e293b', borderRadius:'10px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'12px', color:'#60a5fa', fontWeight:600 }}>🛵 {req.carrier_name}</span>
                  {req.carrier_rating && <span style={{ fontSize:'11px', color:'#facc15' }}>★ {Number(req.carrier_rating).toFixed(1)}</span>}
                  <button onClick={() => setSelected(req)} style={{ marginLeft:'auto', fontSize:'12px', color:'#a78bfa', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>View Details →</button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && <RequestDetailModal request={selected} onClose={() => setSelected(null)} onRefresh={fetchMine} />}
      </AnimatePresence>
    </div>
  );
}
