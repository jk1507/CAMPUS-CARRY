import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Feed from '../components/Feed.jsx';
import MyRequests from '../components/MyRequests.jsx';
import Carrying from '../components/Carrying.jsx';
import RequestWizard from '../components/RequestWizard.jsx';
import ProfilePage from '../components/ProfilePage.jsx';
import Earnings from '../components/Earnings.jsx';
import RequesterDashboard from '../components/RequesterDashboard.jsx';
import HelpPage from '../components/HelpPage.jsx';
import WithdrawalPage from '../components/WithdrawalPage.jsx';
import CampusMap3D from '../components/map/CampusMap3D.jsx';
import RequestDetailModal from '../components/RequestDetailModal.jsx';
import useAuthStore from '../store/authStore.js';
import useRequestStore from '../store/requestStore.js';
import { getSocket } from '../socket/socket.js';
import client from '../api/client.js';
import toast from 'react-hot-toast';
import useFCM from '../hooks/useFCM.jsx';

function RoleBanner() {
  const { user, activeRole, switchRole } = useAuthStore();
  const navigate = useNavigate();
  const other = activeRole === 'carrier' ? 'requester' : 'carrier';
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px', background:'#0a1628', borderBottom:'1px solid #1e293b', fontSize:'12px', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ padding:'2px 10px', borderRadius:'50px', fontWeight:700, textTransform:'capitalize', background:activeRole==='carrier'?'rgba(59,130,246,0.1)':'rgba(124,58,237,0.1)', color:activeRole==='carrier'?'#60a5fa':'#a78bfa', border:`1px solid ${activeRole==='carrier'?'rgba(59,130,246,0.2)':'rgba(124,58,237,0.2)'}` }}>{activeRole} mode</span>
        <span style={{ color:'#475569' }}>{user?.name}</span>
      </div>
      <button onClick={() => { switchRole(other); navigate('/app'); }} style={{ color:'#64748b', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'12px', fontWeight:500 }}>Switch to {other} →</button>
    </div>
  );
}

export default function AppShell() {
  const { user, fetchMe, activeRole } = useAuthStore();
  const { prependToFeed, removeFromFeed, updateMyRequest } = useRequestStore();
  const [focusedRequest, setFocusedRequest] = useState(null);
  const [focusedAutoTab, setFocusedAutoTab] = useState('details');
  const { isReady: fcmReady } = useFCM({
    onNotification: (notif) => {
      toast(`${notif.title}: ${notif.body}`, { duration: 5000 });
    },
  });

  useEffect(() => {
    fetchMe();
    const socket = getSocket();
    if (user?.campus) socket.emit('join:campus', user.campus);

    socket.on('request:new', req => {
      if (activeRole === 'carrier') { prependToFeed(req); toast(`📦 New: ${req.title}`, { duration: 3000 }); }
    });

    socket.on('request:removeFromFeed', ({ requestId }) => removeFromFeed(requestId));

    socket.on('request:accepted', async ({ requestId, carrierName }) => {
      updateMyRequest(requestId, { status: 'accepted' });
      try {
        const res = await client.get(`/requests/${requestId}`);
        toast.success(`🛵 ${carrierName} accepted your request!`, { duration: 5000 });
        setFocusedAutoTab('details');
        setFocusedRequest(res.data.data);
      } catch { toast.success(`🛵 ${carrierName} accepted!`); }
    });

    socket.on('chat:notify', ({ fromName, message }) => {
      toast(`💬 ${fromName}: ${message.slice(0, 40)}`, { duration: 4000 });
    });

    socket.on('request:statusUpdate', async ({ status, requestId }) => {
      if (status === 'delivered' && activeRole === 'requester') {
        try {
          const res = await client.get(`/requests/${requestId}`);
          setFocusedAutoTab('feedback');
          setFocusedRequest(res.data.data);
          toast('⭐ Delivery complete! Please rate your carrier.', { duration: 5000 });
        } catch {}
      }
    });

    return () => {
      socket.off('request:new'); socket.off('request:removeFromFeed');
      socket.off('request:accepted'); socket.off('chat:notify'); socket.off('request:statusUpdate');
    };
  }, [user?.campus, activeRole]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#020817', fontFamily:'DM Sans, sans-serif', overflow:'hidden' }}>
      <RoleBanner />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar />
        <main style={{ flex:1, overflowY:'auto', paddingBottom:'80px' }}>
          <div style={{ maxWidth:'720px', margin:'0 auto', padding:'24px 20px' }}>
            <Routes>
              <Route path="/"         element={activeRole === 'carrier' ? <Feed /> : <MyRequests />} />
              <Route path="/feed"     element={<Feed />} />
              <Route path="/mine"     element={<MyRequests />} />
              <Route path="/carrying" element={<Carrying />} />
              <Route path="/new"      element={<RequestWizard />} />
              <Route path="/map"      element={<CampusMap3D />} />
              <Route path="/profile"  element={<ProfilePage />} />
              <Route path="/earnings"     element={<Earnings />} />
              <Route path="/withdraw"    element={<WithdrawalPage />} />
              <Route path="/spending"    element={<RequesterDashboard />} />
              <Route path="/help"     element={<HelpPage />} />
            </Routes>
          </div>
        </main>
        <BottomNav />
      </div>
      <AnimatePresence>
        {focusedRequest && (
          <RequestDetailModal
            request={focusedRequest}
            onClose={() => { setFocusedRequest(null); setFocusedAutoTab('details'); }}
            onRefresh={() => {}}
            autoTab={focusedAutoTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
