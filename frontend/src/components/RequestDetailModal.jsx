import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '../store/authStore.js';
import useRequestStore from '../store/requestStore.js';
import { getSocket } from '../socket/socket.js';
import LiveMap from './LiveMap.jsx';
import client from '../api/client.js';
import toast from 'react-hot-toast';

const STATUS_STEPS = [
  { key:'accepted',    icon:'✓',  label:'Carrier Found',  desc:'A carrier accepted your request' },
  { key:'in_progress', icon:'📦', label:'Item Picked Up', desc:'Carrier has the item, heading your way' },
  { key:'delivered',   icon:'🏁', label:'Delivered',      desc:'Delivery complete!' },
];

const sc = {
  open:        { color:'#34d399', bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.2)'  },
  accepted:    { color:'#60a5fa', bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.2)'  },
  in_progress: { color:'#facc15', bg:'rgba(250,204,21,0.1)',  border:'rgba(250,204,21,0.2)'  },
  delivered:   { color:'#a78bfa', bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.2)' },
  cancelled:   { color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.2)' },
};

function StarRating({ value, onChange }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display:'flex', gap:'4px' }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onMouseEnter={() => setHov(s)} onMouseLeave={() => setHov(0)} onClick={() => onChange(s)}
          style={{ fontSize:'32px', background:'none', border:'none', cursor:'pointer', color: s<=(hov||value)?'#facc15':'#1e293b', transition:'all 0.1s', transform: s<=(hov||value)?'scale(1.1)':'scale(1)' }}>★</button>
      ))}
    </div>
  );
}

const card = { background:'rgba(30,41,59,0.5)', border:'1px solid #1e293b', borderRadius:'12px', padding:'16px' };
const inp  = { width:'100%', background:'#1e293b', border:'1px solid #334155', borderRadius:'12px', padding:'10px 16px', color:'#f1f5f9', fontSize:'14px', outline:'none', fontFamily:'inherit' };

export default function RequestDetailModal({ request: init, onClose, onRefresh, autoTab }) {
  const { user, activeRole } = useAuthStore();
  const { cancelRequest, updateStatus, acceptRequest } = useRequestStore();
  const [request, setRequest]       = useState(init);
  const [tab, setTab]               = useState(autoTab || 'details');
  const [messages, setMessages]     = useState([]);
  const [msgInput, setMsgInput]     = useState('');
  const [carrierLoc, setCarrierLoc] = useState(null);
  const [requesterLoc, setRequesterLoc] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState('');
  const [submittingFb, setSubmittingFb] = useState(false);
  const [sharingLoc, setSharingLoc] = useState(false);
  const [unread, setUnread]         = useState(0);
  const chatEndRef = useRef(null);
  const locInterval = useRef(null);

  const isRequester = user?.id === request.requester_id;
  const isCarrier   = user?.id === request.carrier_id;
  const isInvolved  = isRequester || isCarrier;
  const canChat     = isInvolved && ['accepted','in_progress','delivered'].includes(request.status);
  const showLocation= isInvolved && ['accepted','in_progress'].includes(request.status);
  const showFeedback= isInvolved && request.status === 'delivered';

  const refreshReq = async () => {
    try { const r = await client.get(`/requests/${request.id}`); setRequest(r.data.data); return r.data.data; } catch { return null; }
  };

  const getMyLoc = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => setRequesterLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }), () => {});
  };

  useEffect(() => {
    refreshReq();
    if (canChat) client.get(`/chat/${request.id}`).then(r => setMessages(r.data.data.map(m => ({ fromId: m.from_user_id, fromName: m.from_name, message: m.message, timestamp: m.created_at })))).catch(() => {});
    if (request.status === 'delivered') client.get(`/feedback/check/${request.id}`).then(r => setFeedbackGiven(r.data.data.given)).catch(() => {});
    if (isRequester && showLocation) getMyLoc();
  }, [request.id]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join:request', request.id);

    socket.on('message:receive', msg => {
      if (msg.fromId === user?.id) return; // sender already added locally
      setMessages(prev => [...prev, msg]);
      if (tab !== 'chat') { setUnread(c => c+1); toast(`💬 ${msg.fromName}: ${msg.message.slice(0,50)}`, { duration:4000, position:'top-right' }); }
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 60);
    });

    socket.on('location:update', data => setCarrierLoc({ lat:data.lat, lng:data.lng, name:data.name, ts:data.timestamp }));

    socket.on('request:statusUpdate', async ({ status }) => {
      setRequest(r => ({ ...r, status }));
      onRefresh?.();
      if (status === 'in_progress') toast('📦 Carrier picked up the item!', { duration:5000, position:'top-right' });
      if (status === 'delivered') {
        toast('🏁 Delivered! Please rate your experience.', { duration:5000, position:'top-right' });
        setTimeout(() => setTab('feedback'), 800);
        onRefresh?.();
      }
    });

    return () => {
      socket.emit('leave:request', request.id);
      socket.off('message:receive'); socket.off('location:update'); socket.off('request:statusUpdate');
      stopLoc();
    };
  }, [request.id, tab]);

  useEffect(() => {
    if (tab === 'chat') { setUnread(0); setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 100); }
    if (tab === 'location' && isRequester) getMyLoc();
  }, [tab]);

  const sendMsg = async () => {
    if (!msgInput.trim()) return;
    const msg = { fromId: user.id, fromName: user.name, message: msgInput.trim(), timestamp: new Date().toISOString() };
    try { await client.post('/chat', { request_id: request.id, message: msgInput.trim() }); } catch {}
    getSocket().emit('message:send', { requestId: request.id, message: msgInput.trim() });
    setMessages(prev => [...prev, msg]);
    setMsgInput('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 60);
  };

  const startLoc = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setSharingLoc(true); toast.success('📍 Sharing live location...');
    const send = () => navigator.geolocation.getCurrentPosition(pos => {
      getSocket().emit('location:send', { lat: pos.coords.latitude, lng: pos.coords.longitude, requestId: request.id });
      client.post('/location/update', { lat: pos.coords.latitude, lng: pos.coords.longitude, request_id: request.id }).catch(() => {});
    }, () => {});
    send();
    locInterval.current = setInterval(send, 5000);
  };
  const stopLoc = () => { setSharingLoc(false); if (locInterval.current) { clearInterval(locInterval.current); locInterval.current = null; } };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this request?')) return;
    const r = await cancelRequest(request.id);
    if (r.success) { toast.success('Cancelled'); onClose(); onRefresh?.(); } else toast.error(r.error);
  };

  const handleStatus = async status => {
    const r = await updateStatus(request.id, status);
    if (r.success) { setRequest(p => ({ ...p, status })); onRefresh?.(); if (status === 'delivered') setTimeout(() => setTab('feedback'), 800); }
    else toast.error(r.error);
  };

  const handleAccept = async () => {
    const r = await acceptRequest(request.id);
    if (r.success) {
      toast.success('Request accepted! 🛵');
      const f = await refreshReq(); if (f) setRequest(f);
      onRefresh?.();
      setTimeout(() => { setTab('location'); toast('📍 Please share your live location!', { duration:5000, position:'top-right' }); }, 500);
    } else toast.error(r.error);
  };

  const handleFeedback = async () => {
    if (!rating) return toast.error('Please select a rating');
    setSubmittingFb(true);
    try {
      const toId = isRequester ? request.carrier_id : request.requester_id;
      await client.post('/feedback', { request_id: request.id, to_user_id: toId, rating, comment });
      toast.success('Feedback submitted! ⭐'); setFeedbackGiven(true);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSubmittingFb(false); }
  };

  const stepIdx = STATUS_STEPS.findIndex(s => s.key === request.status);
  const statusStyle = sc[request.status] || sc.open;

  const tabs = [
    { id:'details',  label:'Details',  icon:'📋' },
    ...(canChat      ? [{ id:'chat',     label:'Chat',     icon:'💬', badge:unread }] : []),
    ...(showLocation ? [{ id:'location', label:'Location', icon:'📍' }] : []),
    ...(showFeedback ? [{ id:'feedback', label:'Rate ⭐',  icon:''   }] : []),
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)' }} />
      <motion.div initial={{ opacity:0, y:60 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:60 }}
        onClick={e => e.stopPropagation()}
        style={{ position:'relative', width:'100%', maxWidth:'680px', background:'#0f172a', border:'1px solid #1e293b', borderRadius:'24px 24px 0 0', overflow:'hidden', display:'flex', flexDirection:'column', maxHeight:'92vh' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'20px 20px 16px', borderBottom:'1px solid #1e293b', flexShrink:0 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', flexWrap:'wrap' }}>
              <span style={{ fontSize:'11px', padding:'2px 10px', borderRadius:'50px', fontWeight:600, textTransform:'capitalize', color:statusStyle.color, background:statusStyle.bg, border:`1px solid ${statusStyle.border}` }}>{request.status?.replace('_',' ')}</span>
              <span style={{ fontSize:'11px', color:'#475569' }}>{request.created_at ? formatDistanceToNow(new Date(request.created_at), { addSuffix:true }) : ''}</span>
            </div>
            <h2 style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'20px', color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingRight:'8px' }}>{request.title}</h2>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink:0, marginLeft:'8px' }}>
            <span style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'#a78bfa' }}>₹{request.reward}</span>
            <button onClick={onClose} style={{ color:'#475569', background:'none', border:'none', cursor:'pointer', fontSize:'20px', width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #1e293b', flexShrink:0, overflowX:'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, minWidth:'80px', padding:'12px 8px', fontSize:'13px', fontWeight:500, background:'none', border:'none', cursor:'pointer', borderBottom:tab===t.id?'2px solid #7c3aed':'2px solid transparent', color:tab===t.id?'#a78bfa':'#475569', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', position:'relative', fontFamily:'inherit', transition:'color 0.15s' }}>
              {t.icon} {t.label}
              {t.badge > 0 && <span style={{ position:'absolute', top:'8px', right:'8px', width:'16px', height:'16px', borderRadius:'50%', background:'#7c3aed', color:'white', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>

          {/* DETAILS */}
          {tab === 'details' && (
            <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'14px' }}>
              {/* Timeline */}
              {isRequester && stepIdx >= 0 && (
                <div style={card}>
                  <p style={{ color:'#475569', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'12px' }}>Delivery Status</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                    {STATUS_STEPS.map((step, i) => {
                      const done = i <= stepIdx, active = i === stepIdx;
                      return (
                        <div key={step.key} style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                          <div style={{ width:'28px', height:'28px', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', background:done?'#7c3aed':'#1e293b', color:done?'white':'#475569', outline:active?'2px solid #a78bfa':'none', outlineOffset:'2px' }}>{done?step.icon:i+1}</div>
                          <div><p style={{ fontSize:'13px', fontWeight:600, color:done?'white':'#475569' }}>{step.label}</p>{active&&<p style={{ fontSize:'11px', color:'#a78bfa', marginTop:'2px' }}>{step.desc}</p>}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Route */}
              <div style={card}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', marginTop:'4px' }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#10b981' }} />
                    <div style={{ width:'2px', height:'24px', background:'#334155' }} />
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#7c3aed' }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'14px', fontWeight:500, color:'white' }}>{request.pickup_location}</p>
                    <p style={{ fontSize:'13px', color:'#475569', marginTop:'20px' }}>{request.dropoff_location}</p>
                  </div>
                  {request.weight_kg && <span style={{ fontSize:'11px', color:'#64748b', background:'#1e293b', padding:'4px 8px', borderRadius:'8px' }}>{request.weight_kg}kg</span>}
                </div>
              </div>

              {request.description && <div style={card}><p style={{ fontSize:'11px', color:'#475569', fontWeight:600, marginBottom:'4px' }}>NOTE</p><p style={{ fontSize:'13px', color:'white' }}>{request.description}</p></div>}

              {/* Other party info */}
              {isRequester && request.carrier_name && (
                <div style={{ ...card, border:'1px solid rgba(96,165,250,0.25)' }}>
                  <p style={{ fontSize:'11px', color:'#60a5fa', fontWeight:700, marginBottom:'10px' }}>🛵 YOUR CARRIER</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(96,165,250,0.15)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {request.carrier_avatar ? <img src={request.carrier_avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : <span style={{ fontWeight:700, color:'#60a5fa', fontSize:'16px' }}>{request.carrier_name?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'14px', fontWeight:600, color:'white' }}>{request.carrier_name}</p>
                      <p style={{ fontSize:'12px', color: request.carrier_rating ? '#facc15' : '#475569' }}>{request.carrier_rating ? `★ ${Number(request.carrier_rating).toFixed(1)} rating` : 'New carrier'}</p>
                    </div>
                    {canChat && <button onClick={() => setTab('chat')} style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(124,58,237,0.1)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.2)', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>💬 Chat</button>}
                  </div>
                </div>
              )}

              {isCarrier && (
                <div style={{ ...card, border:'1px solid rgba(167,139,250,0.25)' }}>
                  <p style={{ fontSize:'11px', color:'#a78bfa', fontWeight:700, marginBottom:'10px' }}>📦 REQUESTER</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(167,139,250,0.15)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {request.requester_avatar ? <img src={request.requester_avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : <span style={{ fontWeight:700, color:'#a78bfa', fontSize:'16px' }}>{request.requester_name?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'14px', fontWeight:600, color:'white' }}>{request.requester_name}</p>
                      <p style={{ fontSize:'12px', color: request.requester_rating ? '#facc15' : '#475569' }}>{request.requester_rating ? `★ ${Number(request.requester_rating).toFixed(1)} rating` : 'No rating yet'}</p>
                    </div>
                    {canChat && <button onClick={() => setTab('chat')} style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(124,58,237,0.1)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.2)', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>💬 Chat</button>}
                  </div>
                </div>
              )}

              {request.status === 'open' && isRequester && !request.carrier_name && (
                <div style={{ ...card, textAlign:'center' }}><p style={{ fontSize:'13px', color:'#475569' }}>⏳ Waiting for a carrier to accept...</p></div>
              )}

              {request.status === 'delivered' && (
                <div style={{ ...card, border:'1px solid rgba(124,58,237,0.25)', textAlign:'center' }}>
                  <p style={{ color:'#a78bfa', fontWeight:600, fontSize:'14px' }}>✓ Delivery Complete</p>
                  <p style={{ color:'#475569', fontSize:'12px', marginTop:'4px' }}>{isRequester ? `Pay ₹${request.reward} to ${request.carrier_name} via UPI/cash` : `Ask ${request.requester_name} for ₹${request.reward}`}</p>
                  {!feedbackGiven && <button onClick={() => setTab('feedback')} style={{ marginTop:'10px', padding:'8px 16px', borderRadius:'10px', background:'rgba(250,204,21,0.1)', color:'#facc15', border:'1px solid rgba(250,204,21,0.2)', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>⭐ Leave Feedback</button>}
                </div>
              )}

              {/* Actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {request.status === 'open' && activeRole === 'carrier' && !isRequester && !isCarrier && (
                  <button onClick={handleAccept} style={{ width:'100%', padding:'14px', borderRadius:'12px', background:'#7c3aed', color:'white', border:'none', fontWeight:600, fontSize:'14px', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 20px rgba(124,58,237,0.3)' }}>Accept Request 🛵</button>
                )}
                {request.status === 'open' && isRequester && (
                  <button onClick={handleCancel} style={{ width:'100%', padding:'14px', borderRadius:'12px', background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)', fontWeight:600, fontSize:'14px', cursor:'pointer', fontFamily:'inherit' }}>Cancel Request ✕</button>
                )}
                {isCarrier && request.status === 'accepted' && (
                  <button onClick={() => handleStatus('in_progress')} style={{ width:'100%', padding:'14px', borderRadius:'12px', background:'rgba(250,204,21,0.1)', color:'#facc15', border:'1px solid rgba(250,204,21,0.2)', fontWeight:600, fontSize:'14px', cursor:'pointer', fontFamily:'inherit' }}>📦 I Have the Item — Start Delivery</button>
                )}
                {isCarrier && request.status === 'in_progress' && (
                  <button onClick={() => handleStatus('delivered')} style={{ width:'100%', padding:'14px', borderRadius:'12px', background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.2)', fontWeight:600, fontSize:'14px', cursor:'pointer', fontFamily:'inherit' }}>🏁 Mark as Delivered</button>
                )}
              </div>
            </div>
          )}

          {/* CHAT */}
          {tab === 'chat' && (
            <div style={{ display:'flex', flexDirection:'column', minHeight:'360px', height:'100%' }}>
              <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                {messages.length === 0 && <div style={{ textAlign:'center', padding:'48px 0', color:'#475569' }}><div style={{ fontSize:'40px', marginBottom:'8px' }}>💬</div><p style={{ fontSize:'14px' }}>No messages yet. Say hi!</p></div>}
                {messages.map((msg, i) => {
                  const mine = msg.fromId === user?.id;
                  return (
                    <div key={i} style={{ display:'flex', justifyContent:mine?'flex-end':'flex-start' }}>
                      <div style={{ maxWidth:'78%', display:'flex', flexDirection:'column', gap:'2px', alignItems:mine?'flex-end':'flex-start' }}>
                        {!mine && <p style={{ fontSize:'11px', color:'#475569', marginLeft:'4px' }}>{msg.fromName}</p>}
                        <div style={{ padding:'10px 16px', borderRadius:'18px', fontSize:'14px', lineHeight:1.5, background:mine?'#7c3aed':'#1e293b', color:'white', borderBottomRightRadius:mine?'4px':'18px', borderBottomLeftRadius:mine?'18px':'4px', border:mine?'none':'1px solid #334155' }}>{msg.message}</div>
                        <p style={{ fontSize:'10px', color:'#334155', margin:'0 4px' }}>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding:'12px 16px', borderTop:'1px solid #1e293b', display:'flex', gap:'8px', flexShrink:0 }}>
                <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMsg()} placeholder="Type a message... (Enter to send)" style={{ ...inp, flex:1 }} />
                <button onClick={sendMsg} style={{ padding:'10px 16px', borderRadius:'12px', background:'#7c3aed', color:'white', border:'none', cursor:'pointer', fontSize:'18px', fontWeight:700 }}>↑</button>
              </div>
            </div>
          )}

          {/* LOCATION */}
          {tab === 'location' && (
            <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'14px' }}>
              {isCarrier && (
                <div style={card}>
                  <p style={{ color:'white', fontSize:'14px', fontWeight:600, marginBottom:'4px' }}>Share Your Live Location</p>
                  <p style={{ color:'#475569', fontSize:'12px', marginBottom:'14px' }}>Updates every 5 sec. Requester sees your position in the map below.</p>
                  <button onClick={sharingLoc ? stopLoc : startLoc} style={{ width:'100%', padding:'12px', borderRadius:'12px', fontWeight:600, fontSize:'14px', cursor:'pointer', fontFamily:'inherit', border:'1px solid', background:sharingLoc?'rgba(239,68,68,0.1)':'rgba(52,211,153,0.1)', color:sharingLoc?'#f87171':'#34d399', borderColor:sharingLoc?'rgba(239,68,68,0.2)':'rgba(52,211,153,0.2)' }}>
                    {sharingLoc ? '⏹ Stop Sharing' : '📍 Start Sharing Live Location'}
                  </button>
                  {sharingLoc && <p style={{ color:'#34d399', textAlign:'center', fontSize:'12px', marginTop:'8px' }}>● Broadcasting live...</p>}
                </div>
              )}
              {carrierLoc ? (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                    <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#34d399', display:'inline-block' }} />
                    <p style={{ fontSize:'12px', color:'#34d399', fontWeight:600 }}>LIVE · {carrierLoc.name}</p>
                  </div>
                  <LiveMap carrierLat={Number(carrierLoc.lat)} carrierLng={Number(carrierLoc.lng)} carrierName={carrierLoc.name}
                    requesterLat={requesterLoc?.lat} requesterLng={requesterLoc?.lng} requesterName={isRequester ? user?.name : request.requester_name} />
                  <a href={`https://www.google.com/maps?q=${carrierLoc.lat},${carrierLoc.lng}`} target="_blank" rel="noreferrer"
                    style={{ display:'block', textAlign:'center', marginTop:'10px', padding:'10px', borderRadius:'12px', background:'rgba(59,130,246,0.1)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.2)', fontSize:'13px', fontWeight:500, textDecoration:'none' }}>
                    Open in Google Maps ↗
                  </a>
                </div>
              ) : isRequester && (
                <div style={{ textAlign:'center', padding:'48px 0', color:'#475569' }}>
                  <div style={{ fontSize:'40px', marginBottom:'12px' }}>🗺</div>
                  <p style={{ fontSize:'14px' }}>Waiting for carrier to share location...</p>
                </div>
              )}
            </div>
          )}

          {/* FEEDBACK */}
          {tab === 'feedback' && (
            <div style={{ padding:'20px' }}>
              {feedbackGiven ? (
                <div style={{ textAlign:'center', padding:'60px 0' }}>
                  <div style={{ fontSize:'56px', marginBottom:'16px' }}>🌟</div>
                  <p style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'22px', color:'white', marginBottom:'8px' }}>Thank you!</p>
                  <p style={{ fontSize:'14px', color:'#475569' }}>Your feedback helps build trust in the community.</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  <div style={{ textAlign:'center', paddingTop:'16px' }}>
                    <div style={{ fontSize:'44px', marginBottom:'12px' }}>⭐</div>
                    <p style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'20px', color:'white' }}>Rate {isRequester ? request.carrier_name : request.requester_name}</p>
                    <p style={{ fontSize:'14px', color:'#475569', marginTop:'4px' }}>{isRequester ? 'How was your delivery?' : 'How was the requester?'}</p>
                  </div>
                  <div style={{ display:'flex', justifyContent:'center' }}><StarRating value={rating} onChange={setRating} /></div>
                  {rating > 0 && <p style={{ textAlign:'center', fontSize:'14px', color:'#facc15' }}>{['','😞 Poor','😐 Fair','🙂 Good','😊 Great','🤩 Excellent!'][rating]}</p>}
                  <div>
                    <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>Comment (optional)</p>
                    <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Share your experience..." rows={3} style={{ ...inp, resize:'none' }} />
                  </div>
                  <button onClick={handleFeedback} disabled={submittingFb||!rating}
                    style={{ width:'100%', padding:'14px', borderRadius:'12px', background:'#7c3aed', color:'white', border:'none', fontWeight:600, fontSize:'14px', cursor:!rating?'not-allowed':'pointer', opacity:!rating?0.4:1, fontFamily:'inherit', boxShadow:'0 0 20px rgba(124,58,237,0.3)' }}>
                    {submittingFb ? 'Submitting...' : `Submit ${rating?'★'.repeat(rating):''} Feedback`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
