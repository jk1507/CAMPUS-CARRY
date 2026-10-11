import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  MapPin, 
  Navigation, 
  IndianRupee, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import useRequestStore from '../store/requestStore.js';
import LocationPickerMap from './map/LocationPickerMap.jsx';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 0, title: 'Item Details', desc: 'What needs to be moved?' },
  { id: 1, title: 'Map Geolocation', desc: 'Pick pickup & dropoff' },
  { id: 2, title: 'Reward & Review', desc: 'Set tip and verify' },
];

const PRESET_TAGS = ['Canteen Food', 'Lab Manual / Notes', 'Amazon / Courier', 'Pharmacy Medicine', 'Hostel Keys'];

export default function RequestWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '',
    description: '',
    pickup_location: '',
    dropoff_location: '',
    reward: '40',
    weight_kg: '0.5',
    deadline: '',
    category: 'Canteen Food',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRequest } = useRequestStore();
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Please enter what needs to be delivered');
    if (!form.pickup_location.trim()) return toast.error('Please specify a pickup location');
    if (!form.dropoff_location.trim()) return toast.error('Please specify a dropoff location');
    if (!form.reward || Number(form.reward) <= 0) return toast.error('Reward must be greater than ₹0');

    setIsSubmitting(true);
    try {
      const payload = {
        title: `[${form.category}] ${form.title.trim()}`,
        description: form.description.trim() || undefined,
        pickup_location: form.pickup_location.trim(),
        dropoff_location: form.dropoff_location.trim(),
        reward: Number(form.reward),
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      };

      const result = await createRequest(payload);
      if (result.success) {
        toast.success('🎉 Errand Broadcasted! Peers on campus can see it.');
        navigate('/app/mine');
      } else {
        toast.error(result.error || 'Failed to create request');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const recommendedReward = Math.max(30, Math.round(30 + Number(form.weight_kg || 0.5) * 20));

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Stepper Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Step {step + 1} of 3
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {STEPS[step].title}
          </span>
        </div>
        {/* Progress Line */}
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Wizard Content Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <AnimatePresence mode="wait">
          {/* Step 1: Details */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Category Tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('category', t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        form.category === t
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  What item do you need? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Masala Dosa, Blue Record Book, Amazon Parcel"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.weight_kg}
                    onChange={(e) => set('weight_kg', e.target.value)}
                    placeholder="0.5"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) => set('deadline', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Special Notes for Carrier
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="e.g. Please ask for extra sauce; call once outside Room 302."
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Locations */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Map Pin Placement
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    Tap map to drop pin
                  </span>
                </div>
                <LocationPickerMap
                  initialPickup={form.pickup_location}
                  initialDropoff={form.dropoff_location}
                  onPickupSelect={(addr) => set('pickup_location', addr)}
                  onDropoffSelect={(addr) => set('dropoff_location', addr)}
                />
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Pickup Location *
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.pickup_location}
                    onChange={(e) => set('pickup_location', e.target.value)}
                    placeholder="e.g. Cafeteria Counter 2"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Dropoff Location *
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.dropoff_location}
                    onChange={(e) => set('dropoff_location', e.target.value)}
                    placeholder="e.g. Tagore Hostel, Room 304"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Reward & Review */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-4"
            >
              {/* Smart Price Estimator Card */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Fair Bounty Suggestion</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Standard for {form.weight_kg}kg parcel: <b className="text-blue-600 dark:text-blue-400 font-mono">₹{recommendedReward}</b>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set('reward', String(recommendedReward))}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-all"
                >
                  Apply
                </button>
              </div>

              {/* Bounty Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Carrier Bounty Tip (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400 font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="10"
                    value={form.reward}
                    onChange={(e) => set('reward', e.target.value)}
                    placeholder="40"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-2xl font-black text-blue-600 dark:text-blue-400 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  {['30', '40', '50', '80', '100'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => set('reward', amt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono"
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => set('reward', String(Number(form.reward || 40) + 15))}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    +₹15 Rush
                  </button>
                </div>
              </div>

              {/* Review Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Summary Preview
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {form.title || 'Untitled request'}
                </p>
                <div className="space-y-1 text-slate-600 dark:text-slate-300 pt-1">
                  <p className="truncate">📍 Pickup: {form.pickup_location || '—'}</p>
                  <p className="truncate">🏁 Dropoff: {form.dropoff_location || '—'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky-Bottom Safe Area Aware Button Bar */}
        <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
              step === 0
                ? 'opacity-30 border-transparent text-slate-400 cursor-not-allowed'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            ← Back
          </button>

          {step < 2 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 0 && !form.title.trim())
                  return toast.error('Please enter what needs to be delivered');
                if (step === 1 && (!form.pickup_location.trim() || !form.dropoff_location.trim()))
                  return toast.error('Both pickup and dropoff locations required');
                setStep((s) => s + 1);
              }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 active:scale-95 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Broadcast Errand</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
