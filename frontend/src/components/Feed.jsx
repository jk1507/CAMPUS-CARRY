import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useRequestStore from '../store/requestStore.js';
import useAuthStore from '../store/authStore.js';
import RequestCard from './RequestCard.jsx';
import RequestDetailModal from './RequestDetailModal.jsx';
import toast from 'react-hot-toast';

export default function Feed() {
  const { feed, fetchFeed, acceptRequest, isLoading } = useRequestStore();
  const { user, activeRole } = useAuthStore();
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchFeed(user?.campus); }, [user?.campus]);

  const handleAccept = async id => {
    const r = await acceptRequest(id);
    r.success ? toast.success('Request accepted! 🛵') : toast.error(r.error);
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'white' }}>Live Feed</h1>
          <p style={{ color:'#64748b', fontSize:'13px', marginTop:'2px' }}>{user?.campus} · {feed.length} open</p>
        </div>
        <button onClick={() => fetchFeed(user?.campus)} style={{ fontSize:'12px', color:'#64748b', background:'rgba(30,41,59,0.8)', border:'1px solid #334155', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', fontFamily:'inherit' }}>↻ Refresh</button>
      </div>

      {isLoading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {[1,2,3].map(i => <div key={i} style={{ background:'rgba(15,23,42,0.6)', border:'1px solid #1e293b', borderRadius:'16px', height:'130px', animation:'pulse 1.5s infinite' }} />)}
        </div>
      ) : feed.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', padding:'80px 0', color:'#475569' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px' }}>📭</div>
          <p style={{ color:'white', fontWeight:600 }}>No open requests right now</p>
          <p style={{ fontSize:'13px', marginTop:'4px' }}>Check back soon!</p>
        </motion.div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {feed.map((req, i) => (
            <motion.div key={req.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}>
              <RequestCard request={req} showAccept={activeRole === 'carrier'} onAccept={handleAccept} onView={setSelected} />
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && <RequestDetailModal request={selected} onClose={() => setSelected(null)} onRefresh={() => fetchFeed(user?.campus)} />}
      </AnimatePresence>
    </div>
  );
}
