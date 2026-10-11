import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useRequestStore from '../store/requestStore.js';
import LocationPickerMap from './map/LocationPickerMap.jsx';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 0, title: 'Item Details', icon: '📦', desc: 'What needs to be moved?' },
  { id: 1, title: 'Map & Route', icon: '📍', desc: 'Pick exact locations on the map' },
  { id: 2, title: 'Reward & Time', icon: '💎', desc: 'Fair bounty for your carrier' },
];

const PRESET_TAGS = ['🍔 Food / Canteen', '📚 Books / Notes', '📦 Courier / Parcel', '💊 Medicine', '🔑 Keys / ID Card'];

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
    category: '🍔 Food / Canteen',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRequest } = useRequestStore();
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleQuickTag = (tag) => {
    set('category', tag);
    if (!form.title) {
      set('title', tag.split(' ').slice(1).join(' '));
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Please enter what needs to be delivered');
    if (!form.pickup_location.trim()) return toast.error('Please specify a pickup location');
    if (!form.dropoff_location.trim()) return toast.error('Please specify a dropoff location');
    if (!form.reward || Number(form.reward) <= 0) return toast.error('Reward must be greater than ₹0');

    setIsSubmitting(true);
    try {
      const payload = {
        title: `[${form.category.split(' ')[0]}] ${form.title.trim()}`,
        description: form.description.trim() || undefined,
        pickup_location: form.pickup_location.trim(),
        dropoff_location: form.dropoff_location.trim(),
        reward: Number(form.reward),
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      };

      const result = await createRequest(payload);
      if (result.success) {
        toast.success('🎉 Delivery Request Created & Live on Campus!');
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

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2 inline-block">
            ⚡ Quick Errand Dispatch
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Syne'] tracking-tight">
            Create Delivery Request
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Student carriers on your campus will see this instantly and deliver it.
          </p>
        </div>
      </div>

      {/* Modern Stepper Indicator */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
        {STEPS.map((s, i) => {
          const isActive = step === i;
          const isDone = step > i;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => (isDone ? setStep(i) : null)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/50'
                  : isDone
                  ? 'bg-slate-900/60 border-emerald-500/40 cursor-pointer'
                  : 'bg-slate-950/40 border-slate-800 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{isDone ? '✅' : s.icon}</span>
                <span className={`text-xs font-bold ${isActive ? 'text-purple-300' : isDone ? 'text-emerald-400' : 'text-slate-400'}`}>
                  Step {i + 1}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200 hidden sm:block truncate">
                {s.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Form Container */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Category Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleQuickTag(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        form.category === t
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  What item do you need? <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Masala Dosa from Canteen, Lab Manual, Blue Folder"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Estimated Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.weight_kg}
                    onChange={(e) => set('weight_kg', e.target.value)}
                    placeholder="0.5"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Deliver Before (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) => set('deadline', e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Instructions for the carrier
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="e.g. Please ask for extra chutney at the counter, room bell doesn't work, call when outside."
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl p-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-all resize-none"
                />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Interactive Map Geolocation
                  </label>
                  <span className="text-[11px] text-purple-400">Click map pins to auto-fill</span>
                </div>
                <LocationPickerMap
                  initialPickup={form.pickup_location}
                  initialDropoff={form.dropoff_location}
                  onPickupSelect={(addr) => set('pickup_location', addr)}
                  onDropoffSelect={(addr) => set('dropoff_location', addr)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
                    <span className="text-xs font-bold text-slate-200">Pickup Location *</span>
                  </div>
                  <input
                    type="text"
                    value={form.pickup_location}
                    onChange={(e) => set('pickup_location', e.target.value)}
                    placeholder="e.g. Campus Cafeteria Block B"
                    className="w-full bg-transparent border-b border-slate-700 focus:border-emerald-400 py-1.5 text-sm text-slate-100 focus:outline-none transition-all"
                  />
                  <div className="mt-2 flex items-center gap-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        form.pickup_location || 'Campus'
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      View on Google Maps ↗
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-md shadow-purple-400/50" />
                    <span className="text-xs font-bold text-slate-200">Dropoff Location *</span>
                  </div>
                  <input
                    type="text"
                    value={form.dropoff_location}
                    onChange={(e) => set('dropoff_location', e.target.value)}
                    placeholder="e.g. Tagore Hostel, Room 304"
                    className="w-full bg-transparent border-b border-slate-700 focus:border-purple-400 py-1.5 text-sm text-slate-100 focus:outline-none transition-all"
                  />
                  <div className="mt-2 flex items-center gap-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        form.dropoff_location || 'Hostel'
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
                    >
                      View on Google Maps ↗
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Smart Campus Price Estimator */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/20 border border-purple-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 text-lg">💡</span>
                  <div>
                    <span className="text-xs font-bold text-white block">Smart Price Estimator</span>
                    <span className="text-[11px] text-slate-400">
                      Suggested for {form.weight_kg ? `${form.weight_kg}kg` : 'standard'} parcel: <b className="text-purple-300">₹{Math.max(30, Math.round(30 + (Number(form.weight_kg || 0.5) * 20)))}</b>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set('reward', String(Math.max(30, Math.round(30 + (Number(form.weight_kg || 0.5) * 20)))))}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap"
                >
                  Apply Fair Price
                </button>
              </div>

              {/* Bounty / Reward Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Carrier Reward Bounty (₹) <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400 font-['Syne']">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="10"
                      value={form.reward}
                      onChange={(e) => set('reward', e.target.value)}
                      placeholder="40"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-2xl pl-10 pr-4 py-4 text-2xl font-bold text-purple-400 font-['Syne'] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Quick reward tags */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-slate-400">Quick suggestions:</span>
                  {['30', '40', '60', '80', '100'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => set('reward', amt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => set('reward', String(Number(form.reward || 40) + 15))}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30"
                  >
                    ⚡ +₹15 Rush Tip
                  </button>
                </div>
              </div>

              {/* Comprehensive Summary Preview Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Delivery Overview
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    Ready to Broadcast
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{form.title || 'Untitled item'}</h3>
                    {form.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{form.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Reward</span>
                    <span className="text-xl font-black text-purple-300 font-['Syne']">
                      ₹{form.reward || '0'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">📍</span>
                    <span className="truncate">{form.pickup_location || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-purple-400">🏁</span>
                    <span className="truncate">{form.dropoff_location || 'Not set'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              step === 0
                ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
                : 'border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300'
            }`}
          >
            ← Previous
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 0 && !form.title.trim()) {
                  return toast.error('Please enter what needs to be delivered');
                }
                if (step === 1 && (!form.pickup_location.trim() || !form.dropoff_location.trim())) {
                  return toast.error('Please provide both pickup and dropoff locations');
                }
                setStep((s) => s + 1);
              }}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              Continue Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/40 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Broadcasting...
                </>
              ) : (
                <>
                  <span>🚀</span> Post Live Request
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
