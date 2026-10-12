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
  Sparkles
} from 'lucide-react';
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
    return req.status === statusFilter;
  });

  const activeCount = myRequests.filter((r) => ['open', 'accepted', 'in_progress'].includes(r.status)).length;
  const deliveredCount = myRequests.filter((r) => r.status === 'delivered').length;

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
            Completed
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
            My Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track live orders, communicate with carriers, and confirm OTP handover.
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
          { id: 'all', label: 'All Orders' },
          { id: 'open', label: 'Waiting for Peer' },
          { id: 'in_progress', label: 'In Transit' },
          { id: 'delivered', label: 'Delivered' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              statusFilter === f.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            No orders found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-5">
            Need lunch from canteen or printouts before class? Post a quick errand.
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
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div key={req.id}>
              <RequestCard request={req} onView={setSelected} />
              
              {/* Carrier Assigned Callout */}
              {req.carrier_name && req.status !== 'cancelled' && (
                <div 
                  onClick={() => setSelected(req)}
                  className="mt-1.5 mx-2 p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-blue-100/80 transition-colors"
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
