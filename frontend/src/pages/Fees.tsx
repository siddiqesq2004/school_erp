import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { IndianRupee, Loader, Plus, ReceiptText, WalletCards } from 'lucide-react';

const api = 'http://localhost:5000/api';
const today = new Date().toISOString().slice(0, 10);

const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const Fees = () => {
  const { school } = useStore();
  const brandColor = school?.themeColor || '#3b82f6';
  const token = localStorage.getItem('scl_token');
  const headers = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [feeForm, setFeeForm] = useState({ name: '', amount: '', frequency: 'MONTHLY', dueDay: 10, lateFee: 0 });
  const [assignForm, setAssignForm] = useState({ feeStructureId: '', classId: '', dueDate: today });
  const [payingId, setPayingId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, structuresRes, paymentsRes, summaryRes] = await Promise.all([
        fetch(`${api}/school/students`, { headers }),
        fetch(`${api}/fees/structures`, { headers }),
        fetch(`${api}/fees/payments${statusFilter ? `?status=${statusFilter}` : ''}`, { headers }),
        fetch(`${api}/fees/summary`, { headers }),
      ]);
      const studentsData = await studentsRes.json();
      const structuresData = await structuresRes.json();
      const paymentsData = await paymentsRes.json();
      const summaryData = await summaryRes.json();
      if (studentsData.success) setStudents(studentsData.data);
      if (structuresData.success) {
        setStructures(structuresData.data);
        if (!assignForm.feeStructureId && structuresData.data[0]) setAssignForm((form) => ({ ...form, feeStructureId: structuresData.data[0].id }));
      }
      if (paymentsData.success) setPayments(paymentsData.data);
      if (summaryData.success) setSummary(summaryData.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const classes = useMemo(() => {
    const byId = new Map<string, any>();
    students.forEach((student) => {
      if (student.class) byId.set(student.class.id, student.class);
    });
    return Array.from(byId.values());
  }, [students]);

  const createStructure = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const res = await fetch(`${api}/fees/structures`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ ...feeForm, amount: Number(feeForm.amount), dueDay: Number(feeForm.dueDay), lateFee: Number(feeForm.lateFee) }),
    });
    const data = await res.json();
    setMessage(data.success ? 'Fee structure created' : data.message || 'Unable to create fee structure');
    if (data.success) {
      setFeeForm({ name: '', amount: '', frequency: 'MONTHLY', dueDay: 10, lateFee: 0 });
      loadData();
    }
  };

  const assignFee = async (event: React.FormEvent) => {
    event.preventDefault();
    const targetStudents = students.filter((student) => !assignForm.classId || student.classId === assignForm.classId);
    setMessage('');
    const res = await fetch(`${api}/fees/assign`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ feeStructureId: assignForm.feeStructureId, dueDate: assignForm.dueDate, studentIds: targetStudents.map((student) => student.id) }),
    });
    const data = await res.json();
    setMessage(data.success ? data.message : data.message || 'Unable to assign fee');
    if (data.success) loadData();
  };

  const recordPayment = async (payment: any) => {
    const amount = Number(payAmount || payment.amount - payment.paidAmount);
    setMessage('');
    const res = await fetch(`${api}/fees/payments`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ feePaymentId: payment.id, paidAmount: amount, paymentMode, paidDate: today }),
    });
    const data = await res.json();
    setMessage(data.success ? `Receipt ${data.data.receiptNo} generated` : data.message || 'Unable to record payment');
    if (data.success) {
      setPayingId('');
      setPayAmount('');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <WalletCards className="w-5 h-5 text-emerald-400" />
          Fee Management
        </h2>
        <p className="text-xs text-slate-500">Fee setup, payment recording, defaulter tracking, ledger, and receipts</p>
      </div>

      {message && <div className="glass border border-emerald-500/20 text-emerald-300 text-xs rounded-xl p-3">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ['Total Due', money(summary.totalDue), 'text-slate-200'],
          ['Collected', money(summary.collected), 'text-emerald-400'],
          ['Outstanding', money(summary.outstanding), 'text-amber-400'],
          ['Overdue', money(summary.overdue), 'text-rose-400'],
        ].map(([label, value, color]) => <div key={label as string} className="glass p-5 rounded-2xl border border-white/5"><p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</p><p className={`text-xl font-bold mt-2 ${color}`}>{value}</p></div>)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={createStructure} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-400" /> Fee Structure</h3>
          <input value={feeForm.name} onChange={(event) => setFeeForm({ ...feeForm, name: event.target.value })} placeholder="Tuition Fee" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <input type="number" value={feeForm.amount} onChange={(event) => setFeeForm({ ...feeForm, amount: event.target.value })} placeholder="Amount" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <div className="grid grid-cols-3 gap-3">
            <select value={feeForm.frequency} onChange={(event) => setFeeForm({ ...feeForm, frequency: event.target.value })} className="col-span-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
              <option>MONTHLY</option><option>QUARTERLY</option><option>TERM</option><option>ANNUAL</option><option>ONE_TIME</option>
            </select>
            <input type="number" value={feeForm.dueDay} onChange={(event) => setFeeForm({ ...feeForm, dueDay: Number(event.target.value) })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          </div>
          <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Create Structure</button>
        </form>

        <form onSubmit={assignFee} className="glass p-5 rounded-2xl border border-white/5 space-y-4 xl:col-span-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><IndianRupee className="w-4 h-4 text-amber-400" /> Assign Fee Demand</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={assignForm.feeStructureId} onChange={(event) => setAssignForm({ ...assignForm, feeStructureId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required>
              <option value="">Select Fee</option>
              {structures.map((fee) => <option key={fee.id} value={fee.id}>{fee.name} - {money(fee.amount)}</option>)}
            </select>
            <select value={assignForm.classId} onChange={(event) => setAssignForm({ ...assignForm, classId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
              <option value="">All Students</option>
              {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
            <input type="date" value={assignForm.dueDate} onChange={(event) => setAssignForm({ ...assignForm, dueDate: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          </div>
          <button className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Assign to Students</button>
        </form>
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><ReceiptText className="w-4 h-4 text-sky-400" /> Student Fee Ledger</h3>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
            <option value="">All Status</option><option>PENDING</option><option>PARTIAL</option><option>PAID</option><option>OVERDUE</option>
          </select>
        </div>
        {loading ? <div className="py-16 flex justify-center text-slate-500"><Loader className="w-6 h-6 animate-spin" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/20 text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Fee</th><th className="px-5 py-3">Due Date</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Receipt</th><th className="px-5 py-3">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-900/60">
                {payments.map((payment) => <tr key={payment.id}><td className="px-5 py-3 text-white font-semibold">{payment.student.firstName} {payment.student.lastName}<span className="block text-[10px] text-slate-500">{payment.student.class?.name || 'Unassigned'} {payment.student.section?.name || ''}</span></td><td className="px-5 py-3 text-slate-300">{payment.feeStructure.name}</td><td className="px-5 py-3 text-slate-400">{payment.dueDate}</td><td className="px-5 py-3 text-slate-200">{money(payment.amount)}</td><td className="px-5 py-3 text-emerald-400">{money(payment.paidAmount)}</td><td className="px-5 py-3"><span className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${payment.status === 'PAID' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : payment.status === 'OVERDUE' ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'}`}>{payment.status}</span></td><td className="px-5 py-3 text-slate-400 font-mono">{payment.receiptNo || '-'}</td><td className="px-5 py-3">{payment.status === 'PAID' ? <span className="text-slate-600">Closed</span> : payingId === payment.id ? <div className="flex gap-2"><input type="number" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} placeholder={`${payment.amount - payment.paidAmount}`} className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300" /><select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300"><option>CASH</option><option>UPI</option><option>CARD</option><option>CHEQUE</option><option>ONLINE</option></select><button onClick={() => recordPayment(payment)} className="px-3 py-1 rounded-lg text-white" style={{ background: brandColor }}>Save</button></div> : <button onClick={() => { setPayingId(payment.id); setPayAmount(String(payment.amount - payment.paidAmount)); }} className="px-3 py-1.5 rounded-lg text-white" style={{ background: brandColor }}>Pay</button>}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fees;
