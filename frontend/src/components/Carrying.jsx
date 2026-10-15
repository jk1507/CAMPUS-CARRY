import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  Navigation, 
  MessageSquare, 
  ArrowRight,
  MapPin,
  Radio,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  Check,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import useRequestStore from '../store/requestStore.js';
import RequestCard from './RequestCard.jsx';
import RequestDetailModal from './RequestDetailModal.jsx';

export default function Carrying() {
  const { carrying, fetchCarrying, broadcastCarrierAddress } = useRequestStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'delivered' | 'all'
  
  // Custom address broadcast input per request ID
  const [addressInputs, setAddressInputs] = useState({});
  const [broadcastingId, setBroadcastingId] = useState(null);
  const [expandedBroadcastId, setExpandedBroadcastId] = useState(null);

  useEffect(() => {
    fetchCarrying();
  }, []);

  const activeMissions = carrying.filter(
    (r) => r.status === 'accepted' || r.status === 'in_progress'
  );
  const deliveredMissions = carrying.filter((r) => r.status === 'delivered');

  const totalEarningsInTransit = activeMissions.reduce(
    (sum, r) => sum + Number(r.reward || 0),
    0
  );
  const totalDeliveredEarnings = deliveredMissions.reduce(
    (sum, r) => sum + Number(r.reward || 0),
    0
  );

  const displayedMissions = 
    activeTab === 'active' 
      ? activeMissions 
      : activeTab === 'delivered' 
      ? deliveredMissions 
      : carrying;

  const quickLandmarks = [
    '🏫 Main Library',
    '☕ Campus Cafeteria',
    '🚪 Main Gate',
    '🏢 Academic Block A',
    '🚲 At Pickup Spot'
  ];

  const handleBroadcastAddress = async (requestId, textToBroadcast, coords = null) => {
    const address = textToBroadcast?.trim();
    if (!address && !coords) {
      return toast.error('Please enter an address or choose a location');
    }

    setBroadcastingId(requestId);
    const payload = {
      address: address || 'Live GPS Location Shared',
      lat: coords?.lat ?? undefined,
      lng: coords?.lng ?? undefined,
    };

    const res = await broadcastCarrierAddress(requestId, payload);
    setBroadcastingId(null);

    if (res.success) {
      toast.success('📍 Broadcasted your address to the requester!');
      // Clear input
      setAddressInputs((prev) => ({ ...prev, [requestId]: '' }));
    } else {
      toast.error(res.error || 'Failed to broadcast address');
    }
  };

  const handleGpsBroadcast = (requestId) => {
    if (!navigator.geolocation) {
      return toast.error('Geolocation is not supported by your browser');
    }

    toast('📡 Fetching GPS coordinates...', { icon: '📍' });
    setBroadcastingId(requestId);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let inferredName = `Campus GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

        // Try reverse geocode
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`
          );
          const data = await resp.json();
          if (data?.display_name) {
            inferredName = data.display_name.split(',').slice(0, 3).join(', ');
          }
        } catch {}

        await handleBroadcastAddress(requestId, inferredName, { lat: latitude, lng: longitude });
      },
      (err) => {
        setBroadcastingId(null);
        toast.error('Unable to fetch GPS location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Carrier Stats Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
            Campus Carrier Dashboard
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
            {activeTab === 'delivered' ? 'Delivered Section' : 'Carrier Section'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeTab === 'delivered'
              ? 'Successfully completed missions and verified payouts.'
              : 'Broadcast your live address to requesters & complete handovers with 4-digit OTP.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-right">
            <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase block">
              In Flight
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
              ₹{totalEarningsInTransit}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-right">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block">
              Earned
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{totalDeliveredEarnings}
            </span>
          </div>
        </div>
      </div>

      {/* Status Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'active'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Active Missions</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
            {activeMissions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('delivered')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'delivered'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Delivered Section</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === 'delivered' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
            {deliveredMissions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
          }`}
        >
          <span>All ({carrying.length})</span>
        </button>
      </div>

      {/* Missions List */}
      {displayedMissions.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
            {activeTab === 'delivered' ? <CheckCircle2 className="w-7 h-7 text-emerald-500" /> : <Bike className="w-7 h-7 text-blue-500" />}
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {activeTab === 'delivered' ? 'No delivered missions yet' : 'No active missions in flight'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-5">
            {activeTab === 'delivered'
              ? 'Once you deliver an order and verify the 4-digit OTP, it will reach this delivery section!'
              : 'Accept errands from the live campus feed to start delivering and earning.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {activeTab === 'delivered' && activeMissions.length > 0 ? (
              <button
                onClick={() => setActiveTab('active')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <span>View Active Missions ({activeMissions.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/app/feed')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <span>Open Dispatch Feed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedMissions.map((req) => {
            const isDelivered = req.status === 'delivered';
            const isBroadcastExpanded = expandedBroadcastId === req.id;

            return (
              <div
                key={req.id}
                className={`p-3.5 rounded-3xl transition-all border ${
                  isDelivered
                    ? 'bg-white dark:bg-[#111827] border-emerald-300 dark:border-emerald-800/80 shadow-sm'
                    : 'bg-white dark:bg-[#111827] border-slate-200/90 dark:border-slate-800 shadow-sm'
                }`}
              >
                <RequestCard request={req} onView={setSelected} />

                {/* DELIVERED SECTION CARD DETAIL */}
                {isDelivered ? (
                  <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <p className="font-extrabold text-emerald-900 dark:text-emerald-300 text-sm">
                          Delivery Completed & Handed Over 🎉
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Verified with 4-digit OTP • ₹{req.reward} credited to your carrier wallet
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelected(req)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm self-start sm:self-auto flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>View Receipt & Feedback</span>
                    </button>
                  </div>
                ) : (
                  /* ACTIVE MISSION ACTIONS & ADDRESS BROADCASTING */
                  <div className="mt-3 space-y-2.5">
                    {/* Carrier Broadcasted Address Status Banner */}
                    {req.carrier_address && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 dark:border-emerald-500/40 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                              Currently Broadcasting to Requester
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {req.carrier_updated_at
                              ? formatDistanceToNow(new Date(req.carrier_updated_at), { addSuffix: true })
                              : 'Live'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {req.carrier_address}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Broadcast Address Accordion Trigger */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              Broadcast Location / Address to Requester
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Seen live in the requester's section so they know where you are.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedBroadcastId(isBroadcastExpanded ? null : req.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors shrink-0"
                        >
                          {isBroadcastExpanded ? 'Close' : 'Broadcast'}
                        </button>
                      </div>

                      {/* Expanded Broadcast Panel */}
                      {isBroadcastExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2.5"
                        >
                          {/* Quick Campus Landmark Chips */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                              Quick Campus Landmarks:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {quickLandmarks.map((landmark) => (
                                <button
                                  key={landmark}
                                  type="button"
                                  onClick={() => handleBroadcastAddress(req.id, landmark)}
                                  disabled={broadcastingId === req.id}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                                >
                                  {landmark}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom Address Input + Send */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={addressInputs[req.id] || ''}
                                onChange={(e) =>
                                  setAddressInputs((prev) => ({ ...prev, [req.id]: e.target.value }))
                                }
                                onKeyDown={(e) =>
                                  e.key === 'Enter' &&
                                  handleBroadcastAddress(req.id, addressInputs[req.id])
                                }
                                placeholder="Type current address or landmark..."
                                className="w-full bg-white dark:bg-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleBroadcastAddress(req.id, addressInputs[req.id])}
                              disabled={broadcastingId === req.id || !addressInputs[req.id]?.trim()}
                              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Send</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGpsBroadcast(req.id)}
                              disabled={broadcastingId === req.id}
                              title="Broadcast Live Browser GPS"
                              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                            >
                              <Radio className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">GPS</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Standard Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(req)}
                        className="py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Verify OTP & Handover</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                          req.pickup_location
                        )}&destination=${encodeURIComponent(req.dropoff_location)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Turn-by-Turn GPS</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Bottom Sheet Modal */}
      <AnimatePresence>
        {selected && (
          <RequestDetailModal
            request={selected}
            onClose={() => setSelected(null)}
            onRefresh={fetchCarrying}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
