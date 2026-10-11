import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  HelpCircle,
  FileQuestion,
  CheckCircle2,
  Package,
  Bike
} from 'lucide-react';
import client from '../api/client.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

const REQUESTER_ISSUES = [
  { value: 'item_damaged',    label: 'Item was damaged during transit' },
  { value: 'item_missing',    label: 'Item not delivered / missing' },
  { value: 'carrier_no_show', label: 'Carrier accepted but didn\'t show up' },
  { value: 'wrong_item',      label: 'Wrong item or quantity delivered' },
  { value: 'rude_carrier',    label: 'Carrier was rude or unprofessional' },
  { value: 'payment_dispute', label: 'Payment dispute / pricing issue' },
  { value: 'other',           label: 'Other problem' },
];

const CARRIER_ISSUES = [
  { value: 'false_request',   label: 'Requester posted a fake or invalid order' },
  { value: 'no_payment',      label: 'Requester refused to pay after delivery' },
  { value: 'rude_requester',  label: 'Requester was rude or threatening' },
  { value: 'wrong_details',   label: 'Wrong pickup/dropoff address provided' },
  { value: 'changed_mind',    label: 'Requester cancelled after item was picked up' },
  { value: 'other',           label: 'Other problem' },
];

export default function HelpPage() {
  const { user, activeRole } = useAuthStore();
  const [form, setForm]         = useState({ issue_type: '', request_id: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [openFaq, setOpenFaq]       = useState(0);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const issues = activeRole === 'carrier' ? CARRIER_ISSUES : REQUESTER_ISSUES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.issue_type || !form.description) {
      return toast.error('Please select an issue type and describe what happened');
    }
    setSubmitting(true);
    try {
      await client.post('/reports', {
        reported_user_id: 1,
        request_id: form.request_id ? Number(form.request_id) : undefined,
        reason: `[${activeRole?.toUpperCase()} REPORT] [${form.issue_type}] ${form.description}`,
      });
      setSubmitted(true);
      toast.success('Report submitted! Our campus moderation team will review it within 24h.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = activeRole === 'carrier' ? [
    {
      q: 'Requester didn\'t pay cash or UPI?',
      a: 'Submit a report with the Request ID right away. Always request payment confirmation or the 4-digit handover OTP before handing over parcels.'
    },
    {
      q: 'Request had wrong location or hostel info?',
      a: 'You can notify the requester in live chat. If unreachable or unreasonable, you may report the order to protect your completion rate.'
    },
    {
      q: 'How does carrier earnings payout work?',
      a: 'Go to Carrier Mode → Withdraw. Enter your verified UPI ID and claim any balance above ₹100 instantly.'
    },
    {
      q: 'How is my trust score calculated?',
      a: 'Your rating is calculated from peer feedback and successful delivery confirmations across campus.'
    }
  ] : [
    {
      q: 'How do I cancel an errand request?',
      a: 'Open My Requests → select your card → Tap "Cancel Request". Note: Orders can only be cancelled before a peer carrier accepts them.'
    },
    {
      q: 'My carrier is unresponsive or missing?',
      a: 'Use the report form below with the Request ID. Campus safety investigates all abandoned requests promptly.'
    },
    {
      q: 'How does payment work for items?',
      a: 'Zipp allows direct student-to-student payments via UPI or cash upon delivery, with OTP verification protecting both sides.'
    },
    {
      q: 'Is live GPS sharing safe on campus?',
      a: 'Yes! Live locations are only shared via encrypted campus channels while an active mission is in transit.'
    }
  ];

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card p-8 space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold text-zipp-ink-900 font-heading">Report Submitted</h2>
          <p className="text-xs text-zipp-ink-500 leading-relaxed">
            We have received your issue log and will review it with campus moderation within 24 hours.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({ issue_type: '', request_id: '', description: '' });
            }}
            className="btn-primary w-full py-2.5 text-xs"
          >
            Submit Another Report
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zipp-ink-900 tracking-tight flex items-center gap-2">
          <LifeBuoy className="text-zipp-primary" size={26} />
          Help & Support
        </h1>
        <p className="text-xs text-zipp-ink-500 mt-1">
          {activeRole === 'carrier'
            ? 'Guidance and issue resolution for campus couriers'
            : 'Guidance and order dispute assistance for requesters'}
        </p>
      </div>

      {/* Role Context Pill */}
      <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
        activeRole === 'carrier'
          ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300'
          : 'bg-zipp-primary/10 border-zipp-primary/20 text-zipp-primary'
      }`}>
        {activeRole === 'carrier' ? <Bike size={20} /> : <Package size={20} />}
        <p className="text-xs font-semibold">
          {activeRole === 'carrier'
            ? 'Carrier Mode Help — issues with requesters, parcels, or payouts'
            : 'Requester Mode Help — issues with delivery delays, carriers, or cancellations'}
        </p>
      </div>

      {/* Accordion FAQ */}
      <div className="card p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zipp-ink-500 flex items-center gap-1.5">
          <HelpCircle size={14} className="text-zipp-primary" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-2 pt-1">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-zipp-ink-100 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  className="w-full text-left p-3.5 bg-zipp-surface flex items-center justify-between text-xs font-bold text-zipp-ink-900 hover:bg-zipp-ink-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-zipp-ink-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown size={16} className="text-zipp-ink-400 shrink-0 ml-2" />
                  )}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-3.5 pb-3.5 pt-1 text-xs text-zipp-ink-600 leading-relaxed bg-zipp-ink-50/50"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Form */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h2 className="text-sm font-bold text-zipp-ink-900">
            Report an Issue with a {activeRole === 'carrier' ? 'Requester' : 'Carrier'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="text-xs font-bold text-zipp-ink-700 uppercase tracking-wider mb-1.5 block">
              Issue Type *
            </label>
            <select
              value={form.issue_type}
              onChange={(e) => set('issue_type', e.target.value)}
              className="input-field text-xs"
            >
              <option value="">Select an issue category...</option>
              {issues.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-zipp-ink-700 uppercase tracking-wider mb-1.5 block">
              Request ID (Optional)
            </label>
            <input
              type="number"
              value={form.request_id}
              onChange={(e) => set('request_id', e.target.value)}
              placeholder={`e.g. 42 (found in ${activeRole === 'carrier' ? 'My Deliveries' : 'My Requests'})`}
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zipp-ink-700 uppercase tracking-wider mb-1.5 block">
              Describe what happened *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Please provide details, timestamps, or descriptions to help our campus moderators..."
              rows={4}
              className="input-field text-xs py-2.5 resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-zipp-ink-50 border border-zipp-ink-100 text-[11px] text-zipp-ink-500">
            Filing report as: <span className="font-semibold text-zipp-ink-800">{user?.name} ({user?.email})</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
          >
            <Send size={15} />
            {submitting ? 'Submitting Report...' : 'Submit Issue to Campus Support'}
          </button>
        </form>
      </div>
    </div>
  );
}
