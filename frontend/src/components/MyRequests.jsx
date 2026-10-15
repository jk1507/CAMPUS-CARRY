import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Bike, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  MapPin,
  Radio
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useRequestStore from '../store/requestStore.js';
import RequestCard from './RequestCard.jsx';
import RequestDetailModal from './RequestDetailModal.jsx';

export default function MyRequests() {
  const { myRequests, fetchMine } = useRequestStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchMine();
  }, []);

  const filteredRequests = myRequests.filter((req) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'in_progress') return req.status === 'accepted' || req.status === 'in_progress';
    return req.status === statusFilter;
  });

  const activeCount = myRequests.filter((r) => ['open', 'accepted', 'in_progress'].includes(r.status)).length;
  const deliveredCount = myRequests.filter((r) => r.status === 'delivered').length;
  const openCount = myRequests.filter((r) => r.status === 'open').length;

  return (
    <div className="space-y-4 pb-12">
      {/* Header Metric Strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            Active in Transit
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {activeCount}
            </span>
            <span className="text-[11px] text-slate-500">Live Orders</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            Completed / Delivered
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {deliveredCount}
            </span>
            <span className="text-[11px] text-slate-500">Delivered</span>
          </div>
        </div>
      </div>

      {/* Screen Title & Quick Post Button */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
            {statusFilter === 'delivered' ? 'Delivered Section' : 'My Orders'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {statusFilter === 'delivered'
              ? 'Your completed deliveries, confirmed with handover OTP.'
              : 'Track live orders, view carrier broadcasted locations, and share 4-digit OTP.'}
          </p>
        </div>

        <button
          onClick={() => navigate('/app/new')}
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Errand</span>
        </button>
      </div>

      {/* Horizontally Scrollable Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'all', label: 'All Orders', count: myRequests.length },
          { id: 'open', label: 'Waiting for Peer', count: openCount },
          { id: 'in_progress', label: 'In Transit', count: activeCount - openCount },
          { id: 'delivered', label: 'Delivered Section', count: deliveredCount },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              statusFilter === f.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <span>{f.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            {statusFilter === 'delivered' ? <CheckCircle2 className="w-7 h-7 text-emerald-500" /> : <Package className="w-7 h-7" />}
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {statusFilter === 'delivered' ? 'No delivered orders yet' : 'No orders found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-5">
            {statusFilter === 'delivered'
              ? 'When a carrier delivers your order and enters your 4-digit OTP, it will immediately appear in this section!'
              : 'Need lunch from canteen or printouts before class? Post a quick errand.'}
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <button
              onClick={() => navigate('/app/new')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Post an Errand</span>
            </button>
            <button
              onClick={() => navigate('/app/feed')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <span>Explore Campus Feed →</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRequests.map((req) => (
            <div key={req.id} className="space-y-1.5">
              <RequestCard request={req} onView={setSelected} />

              {/* CARRIER BROADCASTED ADDRESS SECTION */}
              {req.carrier_address && req.status !== 'cancelled' && (
                <div 
                  onClick={() => setSelected(req)}
                  className="mx-1 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border border-emerald-500/40 dark:border-emerald-500/50 shadow-sm cursor-pointer hover:border-emerald-500 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Carrier Live Location Broadcast
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {req.carrier_updated_at ? formatDistanceToNow(new Date(req.carrier_updated_at), { addSuffix: true }) : 'Live'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {req.carrier_address}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0 flex items-center gap-1 bg-emerald-500/15 px-2.5 py-1 rounded-xl border border-emerald-500/25">
                      Track on Radar →
                    </span>
                  </div>
                </div>
              )}

              {/* DELIVERED ORDER CALLOUT */}
              {req.status === 'delivered' ? (
                <div 
                  onClick={() => setSelected(req)}
                  className="mx-1 p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-emerald-100/90 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-extrabold text-emerald-900 dark:text-emerald-300 block">
                        Order Delivered & Handover Complete 🎉
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Verified with your 4-digit OTP • Leave feedback for {req.carrier_name || 'peer'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-xl shadow-sm hover:bg-emerald-700 transition-colors shrink-0">
                    Rate Carrier →
                  </span>
                </div>
              ) : (
                /* CARRIER ASSIGNED / IN-TRANSIT CALLOUT */
                req.carrier_name && req.status !== 'cancelled' && (
                  <div 
                    onClick={() => setSelected(req)}
                    className="mx-1 p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-blue-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        Carrier: {req.carrier_name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      Track & Chat →
                    </span>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Bottom Sheet Modal */}
      <AnimatePresence>
        {selected && (
          <RequestDetailModal
            request={selected}
            onClose={() => setSelected(null)}
            onRefresh={fetchMine}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
