import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Banknote, Check, Download, FileText, Loader, Plus, Save, X } from 'lucide-react';

const api = 'http://localhost:5000/api';
const today = new Date().toISOString().slice(0, 10);
const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value || 0);

const Payroll = () => {
  const { school } = useStore();
  const brandColor = school?.themeColor || '#3b82f6';
  const token = localStorage.getItem('scl_token');
  const headers = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  const [tab, setTab] = useState<'runs' | 'salary' | 'leave'>('runs');
  const [staff, setStaff] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [payslip, setPayslip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [salaryForm, setSalaryForm] = useState({ staffId: '', basic: '', hra: '', da: '', ta: '', specialAllowance: '', pfEnabled: true, pfRate: 12, esiEnabled: false, esiRate: 0.75, tds: '', effectiveFrom: today });
  const [bankForm, setBankForm] = useState({ staffId: '', bankName: '', bankAccount: '', ifscCode: '', panNumber: '', uanNumber: '', esiNumber: '', joiningDate: '' });
  const [leaveForm, setLeaveForm] = useState({ staffId: '', leaveType: 'CASUAL', fromDate: today, toDate: today, days: 1, reason: '' });
  const [runForm, setRunForm] = useState({ month: currentMonth, year: currentYear, workingDays: 26 });

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, salariesRes, leavesRes, runsRes] = await Promise.all([
        fetch(`${api}/school/staff`, { headers }),
        fetch(`${api}/payroll/salaries`, { headers }),
        fetch(`${api}/payroll/leaves`, { headers }),
        fetch(`${api}/payroll/runs`, { headers }),
      ]);
      const [staffData, salaryData, leaveData, runData] = await Promise.all([staffRes.json(), salariesRes.json(), leavesRes.json(), runsRes.json()]);
      if (staffData.success) {
        setStaff(staffData.data);
        const firstId = staffData.data[0]?.id || '';
        setSalaryForm((form) => ({ ...form, staffId: form.staffId || firstId }));
        setBankForm((form) => ({ ...form, staffId: form.staffId || firstId }));
        setLeaveForm((form) => ({ ...form, staffId: form.staffId || firstId }));
      }
      if (salaryData.success) setSalaries(salaryData.data);
      if (leaveData.success) setLeaves(leaveData.data);
      if (runData.success) {
        setRuns(runData.data);
        setSelectedRunId((id) => id || runData.data[0]?.id || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedRun = useMemo(() => runs.find((run) => run.id === selectedRunId), [runs, selectedRunId]);
  const latestSalaries = useMemo(() => {
    const latest = new Map<string, any>();
    salaries.forEach((salary) => {
      if (!latest.has(salary.staffId)) latest.set(salary.staffId, salary);
    });
    return Array.from(latest.values());
  }, [salaries]);

  const submit = async (url: string, method: string, body: any, successMessage: string) => {
    setMessage('');
    const res = await fetch(`${api}${url}`, { method, headers: jsonHeaders, body: JSON.stringify(body) });
    const data = await res.json();
    setMessage(data.success ? data.message || successMessage : data.message || 'Unable to save');
    if (data.success) loadData();
    return data;
  };

  const saveSalary = (event: React.FormEvent) => {
    event.preventDefault();
    submit('/payroll/salaries', 'POST', {
      ...salaryForm,
      basic: Number(salaryForm.basic),
      hra: Number(salaryForm.hra || 0),
      da: Number(salaryForm.da || 0),
      ta: Number(salaryForm.ta || 0),
      specialAllowance: Number(salaryForm.specialAllowance || 0),
      tds: Number(salaryForm.tds || 0),
    }, 'Salary structure saved');
  };

  const saveBank = (event: React.FormEvent) => {
    event.preventDefault();
    const { staffId, ...details } = bankForm;
    submit(`/payroll/staff/${staffId}`, 'PATCH', details, 'Bank and statutory details saved');
  };

  const saveLeave = (event: React.FormEvent) => {
    event.preventDefault();
    submit('/payroll/leaves', 'POST', leaveForm, 'Leave request saved');
  };

  const processPayroll = (event: React.FormEvent) => {
    event.preventDefault();
    submit('/payroll/runs', 'POST', runForm, 'Payroll processed');
  };

  const downloadBankFile = async (runId: string) => {
    const res = await fetch(`${api}/payroll/runs/${runId}/bank-transfer`, { headers });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bank-transfer-${runForm.year}-${String(runForm.month).padStart(2, '0')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const chooseStaffForBank = (staffId: string) => {
    const member = staff.find((item) => item.id === staffId);
    setBankForm({
      staffId,
      bankName: member?.bankName || '',
      bankAccount: member?.bankAccount || '',
      ifscCode: member?.ifscCode || '',
      panNumber: member?.panNumber || '',
      uanNumber: member?.uanNumber || '',
      esiNumber: member?.esiNumber || '',
      joiningDate: member?.joiningDate || '',
    });
  };

  if (loading) return <div className="py-24 flex justify-center text-slate-500"><Loader className="w-7 h-7 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-400" /> Payroll & Leave Management</h2>
        <p className="text-xs text-slate-500">Salary structures, statutory deductions, leave approvals, payslips, and bank transfer files</p>
      </div>

      {message && <div className="glass border border-emerald-500/20 text-emerald-300 text-xs rounded-xl p-3">{message}</div>}

      <div className="flex gap-2 border-b border-slate-900 pb-3 overflow-x-auto">
        {[['runs', 'Monthly Payroll'], ['salary', 'Salary & Bank Setup'], ['leave', 'Leave Management']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)} className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${tab === key ? 'text-white bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}>{label}</button>
        ))}
      </div>

      {tab === 'runs' && (
        <>
          <form onSubmit={processPayroll} className="glass p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-end gap-3">
            <label className="text-[10px] text-slate-500 uppercase font-bold">Month<input type="number" min="1" max="12" value={runForm.month} onChange={(event) => setRunForm({ ...runForm, month: Number(event.target.value) })} className="block mt-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" /></label>
            <label className="text-[10px] text-slate-500 uppercase font-bold">Year<input type="number" value={runForm.year} onChange={(event) => setRunForm({ ...runForm, year: Number(event.target.value) })} className="block mt-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" /></label>
            <label className="text-[10px] text-slate-500 uppercase font-bold">Working Days<input type="number" value={runForm.workingDays} onChange={(event) => setRunForm({ ...runForm, workingDays: Number(event.target.value) })} className="block mt-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" /></label>
            <button className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Process Payroll</button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[['Gross Payroll', money(selectedRun?.totalGross), 'text-sky-400'], ['Deductions', money(selectedRun?.totalDeductions), 'text-amber-400'], ['Net Payable', money(selectedRun?.totalNet), 'text-emerald-400']].map(([label, value, color]) => (
              <div key={label as string} className="glass p-5 rounded-2xl border border-white/5"><p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</p><p className={`text-xl font-bold mt-2 ${color}`}>{value}</p></div>
            ))}
          </div>

          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-5 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <select value={selectedRunId} onChange={(event) => setSelectedRunId(event.target.value)} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
                <option value="">Select payroll run</option>
                {runs.map((run) => <option key={run.id} value={run.id}>{String(run.month).padStart(2, '0')}/{run.year} - {run.status}</option>)}
              </select>
              {selectedRun && <div className="flex gap-2"><button onClick={() => downloadBankFile(selectedRun.id)} className="px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2"><Download className="w-4 h-4" /> Bank CSV</button>{selectedRun.status !== 'PAID' && <button onClick={() => submit(`/payroll/runs/${selectedRun.id}/paid`, 'PATCH', {}, 'Payroll marked as paid')} className="px-3 py-2 rounded-xl text-xs text-white flex items-center gap-2" style={{ background: brandColor }}><Check className="w-4 h-4" /> Mark Paid</button>}</div>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/20 text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Staff</th><th className="px-5 py-3">Gross</th><th className="px-5 py-3">LOP</th><th className="px-5 py-3">PF</th><th className="px-5 py-3">ESI</th><th className="px-5 py-3">TDS</th><th className="px-5 py-3">Net</th><th className="px-5 py-3">Payslip</th></tr></thead>
                <tbody className="divide-y divide-slate-900/60">{selectedRun?.items.map((item: any) => <tr key={item.id}><td className="px-5 py-3 text-white font-semibold">{item.staff.firstName} {item.staff.lastName}<span className="block text-[10px] text-slate-500">{item.staff.employeeCode}</span></td><td className="px-5 py-3">{money(item.grossSalary)}</td><td className="px-5 py-3 text-rose-400">{item.lopDays}d / {money(item.lopDeduction)}</td><td className="px-5 py-3">{money(item.pfDeduction)}</td><td className="px-5 py-3">{money(item.esiDeduction)}</td><td className="px-5 py-3">{money(item.tdsDeduction)}</td><td className="px-5 py-3 text-emerald-400 font-bold">{money(item.netSalary)}</td><td className="px-5 py-3"><button onClick={() => setPayslip({ ...item, run: selectedRun })} title="View payslip" className="p-2 rounded-lg border border-slate-800 text-sky-400"><FileText className="w-4 h-4" /></button></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'salary' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form onSubmit={saveSalary} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-400" /> Salary Revision</h3>
            <select value={salaryForm.staffId} onChange={(event) => setSalaryForm({ ...salaryForm, staffId: event.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">{staff.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName} - {member.employeeCode}</option>)}</select>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[['basic', 'Basic'], ['hra', 'HRA'], ['da', 'DA'], ['ta', 'TA'], ['specialAllowance', 'Special'], ['tds', 'TDS']].map(([field, label]) => <input key={field} type="number" placeholder={label} value={(salaryForm as any)[field]} onChange={(event) => setSalaryForm({ ...salaryForm, [field]: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />)}</div>
            <div className="grid grid-cols-2 gap-3"><label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={salaryForm.pfEnabled} onChange={(event) => setSalaryForm({ ...salaryForm, pfEnabled: event.target.checked })} /> PF <input type="number" value={salaryForm.pfRate} onChange={(event) => setSalaryForm({ ...salaryForm, pfRate: Number(event.target.value) })} className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg" />%</label><label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={salaryForm.esiEnabled} onChange={(event) => setSalaryForm({ ...salaryForm, esiEnabled: event.target.checked })} /> ESI <input type="number" value={salaryForm.esiRate} onChange={(event) => setSalaryForm({ ...salaryForm, esiRate: Number(event.target.value) })} className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg" />%</label></div>
            <input type="date" value={salaryForm.effectiveFrom} onChange={(event) => setSalaryForm({ ...salaryForm, effectiveFrom: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <button className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2" style={{ background: brandColor }}><Save className="w-4 h-4" /> Save Salary</button>
          </form>

          <form onSubmit={saveBank} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white">Bank & Statutory Details</h3>
            <select value={bankForm.staffId} onChange={(event) => chooseStaffForBank(event.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">{staff.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName} - {member.employeeCode}</option>)}</select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[['bankName', 'Bank Name'], ['bankAccount', 'Account Number'], ['ifscCode', 'IFSC Code'], ['panNumber', 'PAN Number'], ['uanNumber', 'UAN Number'], ['esiNumber', 'ESI Number']].map(([field, label]) => <input key={field} placeholder={label} value={(bankForm as any)[field]} onChange={(event) => setBankForm({ ...bankForm, [field]: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />)}</div>
            <input type="date" value={bankForm.joiningDate} onChange={(event) => setBankForm({ ...bankForm, joiningDate: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <button className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Save Details</button>
          </form>

          <div className="glass rounded-2xl border border-white/5 overflow-hidden xl:col-span-2"><table className="w-full text-left text-xs"><thead className="text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Staff</th><th className="px-5 py-3">Basic</th><th className="px-5 py-3">Gross</th><th className="px-5 py-3">PF</th><th className="px-5 py-3">ESI</th><th className="px-5 py-3">Effective</th></tr></thead><tbody className="divide-y divide-slate-900/60">{latestSalaries.map((salary) => <tr key={salary.id}><td className="px-5 py-3 text-white">{salary.staff.firstName} {salary.staff.lastName}</td><td className="px-5 py-3">{money(salary.basic)}</td><td className="px-5 py-3 text-emerald-400">{money(salary.basic + salary.hra + salary.da + salary.ta + salary.specialAllowance)}</td><td className="px-5 py-3">{salary.pfEnabled ? `${salary.pfRate}%` : '-'}</td><td className="px-5 py-3">{salary.esiEnabled ? `${salary.esiRate}%` : '-'}</td><td className="px-5 py-3">{salary.effectiveFrom}</td></tr>)}</tbody></table></div>
        </div>
      )}

      {tab === 'leave' && (
        <div className="space-y-6">
          <form onSubmit={saveLeave} className="glass p-5 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <select value={leaveForm.staffId} onChange={(event) => setLeaveForm({ ...leaveForm, staffId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">{staff.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select>
            <select value={leaveForm.leaveType} onChange={(event) => setLeaveForm({ ...leaveForm, leaveType: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"><option>CASUAL</option><option>SICK</option><option>EARNED</option><option>UNPAID</option></select>
            <input type="date" value={leaveForm.fromDate} onChange={(event) => setLeaveForm({ ...leaveForm, fromDate: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <input type="date" value={leaveForm.toDate} onChange={(event) => setLeaveForm({ ...leaveForm, toDate: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <input type="number" step="0.5" value={leaveForm.days} onChange={(event) => setLeaveForm({ ...leaveForm, days: Number(event.target.value) })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <button className="rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Add Leave</button>
          </form>
          <div className="glass rounded-2xl border border-white/5 overflow-hidden"><table className="w-full text-left text-xs"><thead className="text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Staff</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Dates</th><th className="px-5 py-3">Days</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-900/60">{leaves.map((leave) => <tr key={leave.id}><td className="px-5 py-3 text-white">{leave.staff.firstName} {leave.staff.lastName}</td><td className="px-5 py-3">{leave.leaveType}</td><td className="px-5 py-3 text-slate-400">{leave.fromDate} to {leave.toDate}</td><td className="px-5 py-3">{leave.days}</td><td className="px-5 py-3">{leave.status}</td><td className="px-5 py-3">{leave.status === 'PENDING' && <div className="flex gap-2"><button onClick={() => submit(`/payroll/leaves/${leave.id}`, 'PATCH', { status: 'APPROVED' }, 'Leave approved')} title="Approve" className="p-2 rounded-lg text-emerald-400 border border-emerald-500/20"><Check className="w-4 h-4" /></button><button onClick={() => submit(`/payroll/leaves/${leave.id}`, 'PATCH', { status: 'REJECTED' }, 'Leave rejected')} title="Reject" className="p-2 rounded-lg text-rose-400 border border-rose-500/20"><X className="w-4 h-4" /></button></div>}</td></tr>)}</tbody></table></div>
        </div>
      )}

      {payslip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-lg w-full max-w-xl p-7 shadow-2xl">
            <div className="flex justify-between items-start border-b pb-4"><div><h3 className="font-bold text-lg">{school?.name}</h3><p className="text-xs text-slate-500">Salary Payslip - {String(payslip.run.month).padStart(2, '0')}/{payslip.run.year}</p></div><button onClick={() => setPayslip(null)}><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-2 gap-3 text-xs py-4"><p><b>Employee:</b> {payslip.staff.firstName} {payslip.staff.lastName}</p><p><b>Code:</b> {payslip.staff.employeeCode}</p><p><b>Designation:</b> {payslip.staff.designation || '-'}</p><p><b>Department:</b> {payslip.staff.department || '-'}</p></div>
            <div className="grid grid-cols-2 gap-6 text-xs border-y py-4"><div className="space-y-2"><p className="font-bold">Earnings</p><p>Basic <span className="float-right">{money(payslip.basic)}</span></p><p>HRA <span className="float-right">{money(payslip.hra)}</span></p><p>DA <span className="float-right">{money(payslip.da)}</span></p><p>TA <span className="float-right">{money(payslip.ta)}</span></p><p>Special <span className="float-right">{money(payslip.specialAllowance)}</span></p></div><div className="space-y-2"><p className="font-bold">Deductions</p><p>LOP ({payslip.lopDays} days) <span className="float-right">{money(payslip.lopDeduction)}</span></p><p>PF <span className="float-right">{money(payslip.pfDeduction)}</span></p><p>ESI <span className="float-right">{money(payslip.esiDeduction)}</span></p><p>TDS <span className="float-right">{money(payslip.tdsDeduction)}</span></p></div></div>
            <div className="pt-4 flex justify-between items-center"><p className="font-bold">Net Salary: {money(payslip.netSalary)}</p><button onClick={() => window.print()} className="px-4 py-2 rounded-lg text-xs text-white bg-slate-900">Print Payslip</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
