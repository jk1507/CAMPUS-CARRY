import React, { useState } from 'react';
import { motion } from 'framer-motion';
import client from '../api/client.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

const REQUESTER_ISSUES = [
  { value:'item_damaged',    label:'📦 Item was damaged during delivery' },
  { value:'item_missing',    label:'🔍 Item not delivered / missing' },
  { value:'carrier_no_show', label:'🚫 Carrier accepted but didn\'t show up' },
  { value:'wrong_item',      label:'❌ Wrong item delivered' },
  { value:'rude_carrier',    label:'😡 Carrier was rude or unprofessional' },
  { value:'payment_dispute', label:'💸 Payment dispute' },
  { value:'other',           label:'⚠️ Other issue' },
];
const CARRIER_ISSUES = [
  { value:'false_request',     label:'🚫 Requester posted a fake/invalid request' },
  { value:'no_payment',        label:'💸 Requester refused to pay after delivery' },
  { value:'rude_requester',    label:'😡 Requester was rude or threatening' },
  { value:'wrong_details',     label:'📋 Wrong pickup/dropoff information given' },
  { value:'changed_mind',      label:'🔄 Requester cancelled after item was picked up' },
  { value:'other',             label:'⚠️ Other issue' },
];

const inp = { width:'100%', background:'#1e293b', border:'1px solid #334155', borderRadius:'12px', padding:'12px 16px', color:'#f1f5f9', fontSize:'14px', outline:'none', fontFamily:'inherit' };

export default function HelpPage() {
  const { user, activeRole } = useAuthStore();
  const [form, setForm]         = useState({ issue_type:'', request_id:'', description:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const issues = activeRole === 'carrier' ? CARRIER_ISSUES : REQUESTER_ISSUES;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.issue_type || !form.description) return toast.error('Please fill in all required fields');
    setSubmitting(true);
    try {
      await client.post('/reports', {
        reported_user_id: 1,
        request_id: form.request_id ? Number(form.request_id) : undefined,
        reason: `[${activeRole?.toUpperCase()} REPORT] [${form.issue_type}] ${form.description}`,
      });
      setSubmitted(true);
      toast.success('Report submitted! We\'ll review it within 24 hours.');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div style={{ maxWidth:'520px', margin:'0 auto', textAlign:'center', paddingTop:'80px' }}>
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}>
        <div style={{ fontSize:'64px', marginBottom:'16px' }}>✅</div>
        <h2 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'white', marginBottom:'8px' }}>Report Submitted</h2>
        <p style={{ color:'#64748b', fontSize:'14px', marginBottom:'24px' }}>We've received your complaint and will review it within 24 hours.</p>
        <button onClick={() => { setSubmitted(false); setForm({ issue_type:'', request_id:'', description:'' }); }}
          style={{ padding:'10px 24px', borderRadius:'12px', background:'#7c3aed', color:'white', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'14px' }}>
          Submit Another
        </button>
      </motion.div>
    </div>
  );

  return (
    <div style={{ maxWidth:'520px', margin:'0 auto' }}>
      <div style={{ marginBottom:'28px' }}>
        <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'white' }}>Help & Support</h1>
        <p style={{ color:'#64748b', fontSize:'13px', marginTop:'4px' }}>
          {activeRole === 'carrier' ? 'Report an issue with a requester or delivery' : 'Report an issue with a carrier or delivery'}
        </p>
      </div>

      {/* Context banner */}
      <div style={{ background:activeRole==='carrier'?'rgba(59,130,246,0.05)':'rgba(124,58,237,0.05)', border:`1px solid ${activeRole==='carrier'?'rgba(59,130,246,0.2)':'rgba(124,58,237,0.2)'}`, borderRadius:'12px', padding:'12px 16px', marginBottom:'20px', fontSize:'13px', color:'#94a3b8' }}>
        {activeRole === 'carrier' ? '🛵 Reporting as a Carrier — for issues caused by requesters' : '📦 Reporting as a Requester — for issues caused by carriers'}
      </div>

      {/* FAQ */}
      <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'20px', marginBottom:'20px' }}>
        <p style={{ color:'white', fontSize:'14px', fontWeight:600, marginBottom:'16px' }}>Quick answers</p>
        {(activeRole === 'carrier' ? [
          ['Requester didn\'t pay?', 'Submit a report with the Request ID. Always confirm payment before handing over items.'],
          ['Request had wrong info?', 'You can cancel and report. Always clarify via chat before picking up.'],
          ['How is my rating calculated?', 'Average of all feedback you\'ve received across deliveries.'],
        ] : [
          ['How do I cancel a request?', 'Open the request card → Cancel Request. Only works before a carrier accepts.'],
          ['My carrier disappeared?', 'Use the report form below with the Request ID. We investigate all no-shows.'],
          ['Payment is direct?', 'Yes — you pay the carrier directly in cash or UPI. CampusCarry doesn\'t handle money.'],
        ]).map(([q, a]) => (
          <details key={q} style={{ marginBottom:'12px', cursor:'pointer' }}>
            <summary style={{ color:'#94a3b8', fontSize:'13px', listStyle:'none', display:'flex', justifyContent:'space-between' }}>
              {q} <span style={{ color:'#475569', fontSize:'11px' }}>▼</span>
            </summary>
            <p style={{ color:'#475569', fontSize:'12px', marginTop:'8px', lineHeight:1.6 }}>{a}</p>
          </details>
        ))}
      </div>

      {/* Report form */}
      <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'20px' }}>
        <p style={{ color:'white', fontSize:'14px', fontWeight:600, marginBottom:'20px' }}>
          📋 Report an Issue with a {activeRole === 'carrier' ? 'Requester' : 'Carrier'}
        </p>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div>
            <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>Issue Type *</p>
            <select value={form.issue_type} onChange={e => set('issue_type', e.target.value)} style={{ ...inp, color: form.issue_type ? '#f1f5f9' : '#475569' }}>
              <option value="">Select an issue...</option>
              {issues.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>Request ID (find it in {activeRole==='carrier'?'My Deliveries':'My Requests'})</p>
            <input type="number" value={form.request_id} onChange={e => set('request_id', e.target.value)} placeholder="e.g. 42" style={inp}
              onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='#334155'} />
          </div>
          <div>
            <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>Describe what happened *</p>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Please be as specific as possible..." rows={4}
              style={{ ...inp, resize:'none' }}
              onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='#334155'} />
          </div>
          <div style={{ background:'#1e293b', borderRadius:'12px', padding:'12px 16px', fontSize:'12px', color:'#475569' }}>
            Submitted by: <span style={{ color:'#94a3b8' }}>{user?.name} ({user?.email})</span>
          </div>
          <button type="submit" disabled={submitting}
            style={{ width:'100%', padding:'14px', borderRadius:'12px', background:'#7c3aed', color:'white', border:'none', fontWeight:600, fontSize:'14px', cursor:submitting?'not-allowed':'pointer', opacity:submitting?0.6:1, fontFamily:'inherit', boxShadow:'0 0 16px rgba(124,58,237,0.3)' }}>
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
