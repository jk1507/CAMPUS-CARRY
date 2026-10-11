import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import client from '../api/client.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ label, value, sub, color, delay = 0 }) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'20px' }}>
      <p style={{ color:'#475569', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>{label}</p>
      <p style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'28px', color }}>{value}</p>
      {sub && <p style={{ color:'#334155', fontSize:'12px', marginTop:'4px' }}>{sub}</p>}
    </motion.div>
  );
}

function WithdrawalRow({ withdrawal, onRefresh }) {
  const statusColors = {
    pending:   { bg: 'rgba(250,204,21,0.1)',  color: '#facc15', border: 'rgba(250,204,21,0.2)'  },
    processed: { bg: 'rgba(52,211,153,0.1)',  color: '#34d399', border: 'rgba(52,211,153,0.2)'  },
    failed:    { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.2)' },
  };
  const sc = statusColors[withdrawal.status] || statusColors.pending;

  return (
    <div style={{ background:'rgba(15,23,42,0.6)', border:'1px solid #1e293b', borderRadius:'12px', padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}>
          <span style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'20px', color:'#a78bfa' }}>₹{withdrawal.amount}</span>
          <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'50px', fontWeight:600, background:sc.sc || sc.bg, color:sc.color, border:`1px solid ${sc.border}`, textTransform:'capitalize' }}>{withdrawal.status}</span>
        </div>
        <p style={{ fontSize:'12px', color:'#475569' }}>UPI: {withdrawal.upi_id}</p>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <p style={{ fontSize:'12px', color:'#64748b' }}>{new Date(withdrawal.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
      </div>
    </div>
  );
}

export default function WithdrawalPage() {
  const { user } = useAuthStore();
  const [withdrawals, setWithdrawals]    = useState([]);
  const [form, setForm]                  = useState({ amount:'', upi_id:'' });
  const [submitting, setSubmitting]      = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [refreshing, setRefreshing]      = useState(false);

  // Fetch withdrawals on mount
  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setRefreshing(true);
    try {
      const res = await client.get('/withdrawals');
      setWithdrawals(res.data.data || []);
      // Calculate pending total
      const pending = (res.data.data || []).filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount), 0);
      setPendingAmount(pending);
    } catch { /* silent */ }
    finally { setRefreshing(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.upi_id) return toast.error('Please fill in all fields');

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return toast.error('Amount must be a positive number');

    setSubmitting(true);
    try {
      const res = await client.post('/withdrawals', { amount, upi_id: form.upi_id });
      toast.success('Withdrawal initiated! Complete the UPI payment to receive funds.');
      setForm({ amount:'', upi_id:'' });
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const totalEarned = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
  const processedCount = withdrawals.filter(w => w.status === 'processed').length;
  const failedCount = withdrawals.filter(w => w.status === 'failed').length;

  return (
    <div style={{ maxWidth:'640px', margin:'0 auto' }}>
      <div style={{ marginBottom:'32px' }}>
        <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'white' }}>💰 Withdraw Earnings</h1>
        <p style={{ color:'#64748b', fontSize:'13px', marginTop:'4px' }}>Request a payout to your UPI account</p>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'12px', marginBottom:'24px' }}>
        <StatCard label="Total Requested"  value={`₹${totalEarned}`}   sub={`${withdrawals.length} requests`}  color="#a78bfa" delay={0} />
        <StatCard label="Pending"          value={`₹${pendingAmount}`} sub="Awaiting payment"                color="#facc15" delay={0.05} />
        <StatCard label="Processed"        value={`₹${totalEarned - pendingAmount}`} sub={`${processedCount} successful`} color="#34d399" delay={0.1} />
        <StatCard label="Failed"           value={failedCount > 0 ? `₹${withdrawals.filter(w => w.status === 'failed').reduce((s,w) => s + Number(w.amount), 0)}` : '₹0'} sub={`${failedCount} failed`} color="#f87171" delay={0.15} />
      </div>

      {/* New withdrawal form */}
      <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'24px', marginBottom:'24px' }}>
        <p style={{ color:'white', fontSize:'14px', fontWeight:600, marginBottom:'16px' }}>New Withdrawal Request</p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div>
            <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>Amount (₹) *</p>
            <input
              type="number"
              step="0.01"
              min="1"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="e.g. 500"
              style={{ width:'100%', background:'#1e293b', border:'1px solid #334155', borderRadius:'12px', padding:'12px 16px', color:'#f1f5f9', fontSize:'14px', outline:'none', fontFamily:'inherit' }}
              onFocus={e => e.target.style.borderColor='#7c3aed'}
              onBlur={e  => e.target.style.borderColor='#334155'}
            />
            <p style={{ color:'#334155', fontSize:'11px', marginTop:'4px' }}>Minimum ₹10 · Must have earned at least this amount</p>
          </div>

          <div>
            <p style={{ color:'#64748b', fontSize:'12px', fontWeight:500, marginBottom:'6px' }}>UPI ID *</p>
            <input
              type="text"
              value={form.upi_id}
              onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))}
              placeholder="e.g. yourname@paytm"
              style={{ width:'100%', background:'#1e293b', border:'1px solid #334155', borderRadius:'12px', padding:'12px 16px', color:'#f1f5f9', fontSize:'14px', outline:'none', fontFamily:'inherit' }}
              onFocus={e => e.target.style.borderColor='#7c3aed'}
              onBlur={e  => e.target.style.borderColor='#334155'}
            />
            <p style={{ color:'#334155', fontSize:'11px', marginTop:'4px' }}>Your UPI ID for receiving payments (e.g., name@paytm, name@phonepe)</p>
          </div>

          <div style={{ background:'rgba(124,58,237,0.05)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'12px', padding:'14px 16px', fontSize:'13px', color:'#94a3b8' }}>
            <p style={{ fontWeight:600, color:'#a78bfa', marginBottom:'4px' }}>How it works:</p>
            <p style={{ lineHeight:1.6 }}>
              1. Submit this request with your UPI ID and amount<br />
              2. A Razorpay payment link will be generated<br />
              3. Complete the UPI payment from your banking app<br />
              4. Funds will be transferred to your UPI account
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width:'100%', padding:'14px', borderRadius:'12px',
              background: submitting ? 'rgba(124,58,237,0.5)' : '#7c3aed',
              color:'white', border:'none', fontWeight:600, fontSize:'14px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              fontFamily:'inherit',
              boxShadow:'0 0 20px rgba(124,58,237,0.3)',
            }}
          >
            {submitting ? 'Processing...' : 'Request Withdrawal →'}
          </button>
        </form>
      </div>

      {/* Withdrawal history */}
      <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:'16px', padding:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <p style={{ color:'white', fontSize:'14px', fontWeight:600 }}>Withdrawal History</p>
          <button
            onClick={fetchWithdrawals}
            disabled={refreshing}
            style={{
              fontSize:'12px', color:'#64748b', background:'rgba(30,41,59,0.8)',
              border:'1px solid #334155', borderRadius:'8px', padding:'6px 12px',
              cursor: refreshing ? 'not-allowed' : 'pointer', fontFamily:'inherit',
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            {refreshing ? '↻ Refreshing...' : '↻ Refresh'}
          </button>
        </div>

        {withdrawals.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'#475569' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>💰</div>
            <p style={{ fontSize:'14px' }}>No withdrawal requests yet.</p>
            <p style={{ fontSize:'12px', marginTop:'4px' }}>Use the form above to request your first payout.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {withdrawals.map(w => (
              <WithdrawalRow key={w.id} withdrawal={w} onRefresh={fetchWithdrawals} />
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div style={{ marginTop:'24px', background:'rgba(52,211,153,0.05)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:'12px', padding:'14px 16px', fontSize:'12px', color:'#475569' }}>
        <p style={{ fontWeight:600, color:'#34d399', marginBottom:'4px' }}>ℹ️ About Payouts:</p>
        <p style={{ lineHeight:1.6 }}>
          CampusCarry processes withdrawals within 24–48 hours of successful UPI payment confirmation.
          Payouts are made via Razorpay to your registered UPI ID. Keep your UPI ID up to date in your profile.
        </p>
      </div>
    </div>
  );
}
