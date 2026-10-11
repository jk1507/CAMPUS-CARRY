import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  X, 
  MapPin, 
  MessageSquare, 
  Star, 
  Navigation, 
  Camera, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  Phone,
  User,
  ArrowRight
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import useRequestStore from '../store/requestStore.js';
import { getSocket } from '../socket/socket.js';
import LiveMap from './LiveMap.jsx';
import client from '../api/client.js';
import toast from 'react-hot-toast';

export default function RequestDetailModal({ request: init, onClose, onRefresh, autoTab }) {
  const { user, activeRole } = useAuthStore();
  const { cancelRequest, updateStatus, acceptRequest } = useRequestStore();
  const [request, setRequest] = useState(init);
  const [tab, setTab] = useState(autoTab || 'details'); // 'details' | 'chat' | 'location' | 'feedback'
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [carrierLoc, setCarrierLoc] = useState(null);
  const [requesterLoc, setRequesterLoc] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingFb, setSubmittingFb] = useState(false);
  const [sharingLoc, setSharingLoc] = useState(false);
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [chatImageBase64, setChatImageBase64] = useState(null);

  const chatEndRef = useRef(null);
  const locInterval = useRef(null);

  const isRequester = user?.id === request.requester_id;
  const isCarrier = user?.id === request.carrier_id;
  const isInvolved = isRequester || isCarrier;
  const canChat = isInvolved && ['accepted', 'in_progress', 'delivered'].includes(request.status);

  const refreshReq = async () => {
    try {
      const r = await client.get(`/requests/${request.id}`);
      setRequest(r.data.data);
      return r.data.data;
    } catch {
      return null;
    }
  };

  const getMyLoc = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setRequesterLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  };

  useEffect(() => {
    refreshReq();
    client.get(`/chat/${request.id}`).then((r) => setMessages(r.data.data || [])).catch(() => {});
    if (user?.id) {
      client.get(`/feedback/request/${request.id}`).then((r) => {
        if (r.data.data) setFeedbackGiven(true);
      }).catch(() => {});
    }
  }, [request.id]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join:request', request.id);

    socket.on('message:receive', (msg) => {
      if (msg.fromId === user?.id) return;
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    });

    socket.on('location:update', (data) =>
      setCarrierLoc({ lat: data.lat, lng: data.lng, name: data.name, ts: data.timestamp })
    );

    socket.on('request:statusUpdate', async ({ status }) => {
      setRequest((r) => ({ ...r, status }));
      onRefresh?.();
      if (status === 'in_progress') toast('📦 Errand item picked up!', { position: 'top-right' });
      if (status === 'delivered') {
        toast('🏁 Handover complete! Rate your peer.', { position: 'top-right' });
        setTimeout(() => setTab('feedback'), 700);
        onRefresh?.();
      }
    });

    return () => {
      socket.emit('leave:request', request.id);
      socket.off('message:receive');
      socket.off('location:update');
      socket.off('request:statusUpdate');
      stopLoc();
    };
  }, [request.id]);

  useEffect(() => {
    if (tab === 'chat') {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
    if (tab === 'location' && isRequester) getMyLoc();
  }, [tab]);

  const sendMsg = async () => {
    const textToSend = msgInput.trim();
    const finalImg = chatImageBase64;
    if (!textToSend && !finalImg) return;

    const msg = {
      fromId: user.id,
      fromName: user.name,
      message: textToSend || '📷 [Photo Attached]',
      image_url: finalImg || null,
      timestamp: new Date().toISOString(),
    };
    try {
      await client.post('/chat', {
        request_id: request.id,
        message: textToSend,
        image_url: finalImg,
      });
    } catch {}
    getSocket().emit('message:send', {
      requestId: request.id,
      message: textToSend,
      imageUrl: finalImg,
    });
    setMessages((prev) => [...prev, msg]);
    setMsgInput('');
    setChatImageBase64(null);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setChatImageBase64(event.target.result);
      toast.success('Photo attached');
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyDeliveryOtp = async () => {
    if (!deliveryOtpInput.trim()) {
      return toast.error('Enter 4-digit handover OTP from the requester');
    }
    setIsVerifyingOtp(true);
    try {
      const res = await client.post(`/requests/${request.id}/verify-otp`, {
        otp: deliveryOtpInput.trim(),
      });
      if (res.data.success) {
        toast.success('🎉 Delivery Confirmed & Handed Over!');
        setRequest((p) => ({ ...p, status: 'delivered' }));
        onRefresh?.();
        setTimeout(() => setTab('feedback'), 700);
      } else {
        toast.error(res.data.error || 'Invalid OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const startLoc = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setSharingLoc(true);
    toast.success('Broadcasting live GPS coordinates...');
    const send = () =>
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          getSocket().emit('location:send', {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            requestId: request.id,
          });
          client
            .post('/location/update', {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              request_id: request.id,
            })
            .catch(() => {});
        },
        () => {}
      );
    send();
    locInterval.current = setInterval(send, 5000);
  };

  const stopLoc = () => {
    setSharingLoc(false);
    if (locInterval.current) {
      clearInterval(locInterval.current);
      locInterval.current = null;
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this request?')) return;
    const r = await cancelRequest(request.id);
    if (r.success) {
      toast.success('Request Cancelled');
      onClose();
      onRefresh?.();
    } else toast.error(r.error);
  };

  const handleStatus = async (status) => {
    const r = await updateStatus(request.id, status);
    if (r.success) {
      setRequest((p) => ({ ...p, status }));
      onRefresh?.();
      if (status === 'delivered') setTimeout(() => setTab('feedback'), 800);
    } else toast.error(r.error);
  };

  const handleAccept = async () => {
    const r = await acceptRequest(request.id);
    if (r.success) {
      toast.success('Errand Accepted! 🛵');
      const f = await refreshReq();
      if (f) setRequest(f);
      onRefresh?.();
      setTimeout(() => setTab('location'), 400);
    } else toast.error(r.error);
  };

  const handleFeedback = async () => {
    if (!rating) return;
    setSubmittingFb(true);
    const toUserId = isRequester ? request.carrier_id : request.requester_id;
    try {
      await client.post('/feedback', {
        request_id: request.id,
        to_user_id: toUserId,
        rating,
        comment: comment || undefined,
      });
      setFeedbackGiven(true);
      toast.success('Feedback submitted! Thank you.');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmittingFb(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-[#111827] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] pb-safe-bottom overflow-hidden text-slate-900 dark:text-slate-100"
      >
        {/* Top Handle on Mobile */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-3 mb-1" />

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block font-mono">
              Errand #{request.id}
            </span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-xs">
              {request.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
              ₹{request.reward}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Segmented Tab Row */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 bg-slate-50/60 dark:bg-slate-900/60">
          {[
            { id: 'details', label: 'Details' },
            ...(canChat ? [{ id: 'chat', label: 'Chat' }] : []),
            { id: 'location', label: 'GPS & Route' },
            ...(request.status === 'delivered' ? [{ id: 'feedback', label: 'Review' }] : []),
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: DETAILS */}
          {tab === 'details' && (
            <div className="space-y-3.5">
              {/* Pickup & Dropoff Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Pickup</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{request.pickup_location}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Dropoff</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{request.dropoff_location}</span>
                  </div>
                </div>
              </div>

              {request.description && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Instructions</span>
                  <p className="text-slate-700 dark:text-slate-300">{request.description}</p>
                </div>
              )}

              {/* 4-Digit Handover Security OTP */}
              {isRequester && request.otp && request.status !== 'delivered' && request.status !== 'cancelled' && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>4-Digit Handover OTP</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    {request.otp.split('').map((d, i) => (
                      <span key={i} className="w-10 h-12 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500 flex items-center justify-center text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 shadow-sm">
                        {d}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Share this code with your carrier only upon receiving the item.
                  </p>
                </div>
              )}

              {/* Carrier Handover OTP input box */}
              {isCarrier && request.status === 'in_progress' && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                    Enter Requester's 4-Digit OTP
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Ask {request.requester_name || 'the requester'} for their code to confirm delivery.
                  </p>
                  <div className="flex items-center gap-2 max-w-xs mx-auto">
                    <input
                      type="text"
                      maxLength={4}
                      value={deliveryOtpInput}
                      onChange={(e) => setDeliveryOtpInput(e.target.value)}
                      placeholder="OTP"
                      className="w-full text-center tracking-widest font-mono font-black text-lg py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      onClick={handleVerifyDeliveryOtp}
                      disabled={isVerifyingOtp}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {request.status === 'open' && activeRole === 'carrier' && !isRequester && !isCarrier && (
                  <button
                    onClick={handleAccept}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md"
                  >
                    Accept Errand 🛵
                  </button>
                )}

                {request.status === 'open' && isRequester && (
                  <button
                    onClick={handleCancel}
                    className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900/60"
                  >
                    Cancel Errand
                  </button>
                )}

                {isCarrier && request.status === 'accepted' && (
                  <button
                    onClick={() => handleStatus('in_progress')}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md"
                  >
                    I Have Picked Up the Item → Start Transit
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CHAT */}
          {tab === 'chat' && (
            <div className="flex flex-col h-72">
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {messages.length === 0 && (
                  <div className="text-center py-16 text-slate-400 text-xs">
                    No messages yet. Send a note or attach a photo receipt.
                  </div>
                )}
                {messages.map((msg, i) => {
                  const mine = msg.fromId === user?.id;
                  return (
                    <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] p-3 rounded-2xl text-xs ${
                        mine
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                      }`}>
                        {!mine && <p className="text-[10px] font-bold text-slate-400 mb-0.5">{msg.fromName}</p>}
                        {msg.image_url && (
                          <img src={msg.image_url} alt="Receipt" className="w-full max-h-40 object-cover rounded-xl mb-1.5" />
                        )}
                        {msg.message && msg.message !== '📷 [Photo Attached]' && <p>{msg.message}</p>}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <label className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer hover:bg-slate-200">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
                </label>
                <input
                  type="text"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                  placeholder="Type message or attach receipt..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  onClick={sendMsg}
                  className="p-2 rounded-xl bg-blue-600 text-white"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: LOCATION */}
          {tab === 'location' && (
            <div className="space-y-3">
              {isCarrier && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Broadcast GPS Location</p>
                    <p className="text-[11px] text-slate-400">Updates position every 5 sec</p>
                  </div>
                  <button
                    onClick={sharingLoc ? stopLoc : startLoc}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                      sharingLoc ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {sharingLoc ? 'Stop' : 'Share GPS'}
                  </button>
                </div>
              )}

              {/* Navigation Button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                  request.pickup_location
                )}&destination=${encodeURIComponent(request.dropoff_location)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Navigation className="w-4 h-4" />
                <span>Open Google Maps Turn-by-Turn</span>
              </a>

              {carrierLoc && (
                <div className="h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <LiveMap
                    carrierLat={Number(carrierLoc.lat)}
                    carrierLng={Number(carrierLoc.lng)}
                    carrierName={carrierLoc.name}
                    requesterLat={requesterLoc?.lat}
                    requesterLng={requesterLoc?.lng}
                    requesterName={isRequester ? user?.name : request.requester_name}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FEEDBACK */}
          {tab === 'feedback' && (
            <div className="text-center py-4 space-y-4">
              {feedbackGiven ? (
                <div>
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Rating Submitted!</h3>
                  <p className="text-xs text-slate-400 mt-1">Thank you for rating your campus peer.</p>
                </div>
              ) : (
                <div className="space-y-3 max-w-xs mx-auto">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Rate {isRequester ? request.carrier_name : request.requester_name}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="p-1 text-2xl"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            s <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Quick review..."
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  />

                  <button
                    onClick={handleFeedback}
                    disabled={submittingFb || !rating}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40"
                  >
                    {submittingFb ? 'Submitting...' : 'Submit Review'}
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
