import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { FileText, Plus, TrendingUp, DollarSign } from 'lucide-react';

interface AccountHead {
  id: string;
  name: string;
  type: string;
  openingBalance: number;
}

interface LedgerEntry {
  id: string;
  amount: number;
  transactionType: string;
  description?: string;
  date: string;
  accountHead: AccountHead;
}

const Accounts = () => {
  const token = useStore((state) => state.token);
  const [accounts, setAccounts] = useState<AccountHead[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState({ accountCount: 0, totalDebit: 0, totalCredit: 0, netBalance: 0, ledgerCount: 0 });
  const [headForm, setHeadForm] = useState({ name: '', type: 'ASSET', openingBalance: 0 });
  const [entryForm, setEntryForm] = useState({ accountHeadId: '', transactionType: 'DEBIT', amount: 0, date: '', description: '' });
  const [message, setMessage] = useState<string>('');

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [headRes, ledgerRes, summaryRes] = await Promise.all([
        fetch('http://localhost:5000/api/accounts/heads', { headers }),
        fetch('http://localhost:5000/api/accounts/ledger', { headers }),
        fetch('http://localhost:5000/api/accounts/summary', { headers }),
      ]);

      const headJson = await headRes.json();
      const ledgerJson = await ledgerRes.json();
      const summaryJson = await summaryRes.json();

      if (headJson.success) setAccounts(headJson.data);
      if (ledgerJson.success) setLedger(ledgerJson.data);
      if (summaryJson.success) setSummary(summaryJson.data);
    } catch (error) {
      console.error(error);
      setMessage('Unable to load account data.');
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleCreateHead = async () => {
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch('http://localhost:5000/api/accounts/heads', {
        method: 'POST',
        headers,
        body: JSON.stringify(headForm),
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Account head created successfully');
        setHeadForm({ name: '', type: 'ASSET', openingBalance: 0 });
        fetchData();
      } else {
        setMessage(json.message || 'Unable to create account head');
      }
    } catch (error) {
      console.error(error);
      setMessage('Unable to create account head.');
    }
  };

  const handleAddEntry = async () => {
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch('http://localhost:5000/api/accounts/ledger', {
        method: 'POST',
        headers,
        body: JSON.stringify(entryForm),
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Ledger entry recorded successfully');
        setEntryForm({ accountHeadId: '', transactionType: 'DEBIT', amount: 0, date: '', description: '' });
        fetchData();
      } else {
        setMessage(json.message || 'Unable to record ledger entry');
      }
    } catch (error) {
      console.error(error);
      setMessage('Unable to record ledger entry.');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="glass p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Accounts & Finance</h2>
            <p className="text-sm text-slate-400 mt-1">Manage account heads, ledger entries, and financial overview for the school.</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-950/70 px-5 py-3 border border-slate-800">
            <DollarSign className="w-5 h-5 text-sky-400" />
            <span className="text-sm text-slate-400">Financial control center</span>
          </div>
        </div>

        {message && <div className="text-sm text-emerald-300 mb-4">{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-3xl p-5 border border-white/5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Accounts</p>
            <h3 className="text-3xl font-black text-white">{summary.accountCount}</h3>
            <p className="text-[11px] text-slate-400 mt-2">Head records available.</p>
          </div>
          <div className="glass rounded-3xl p-5 border border-white/5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Debit total</p>
            <h3 className="text-3xl font-black text-white">{summary.totalDebit.toFixed(2)}</h3>
            <p className="text-[11px] text-slate-400 mt-2">Incoming allocations.</p>
          </div>
          <div className="glass rounded-3xl p-5 border border-white/5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Credit total</p>
            <h3 className="text-3xl font-black text-white">{summary.totalCredit.toFixed(2)}</h3>
            <p className="text-[11px] text-slate-400 mt-2">Outgoing payments.</p>
          </div>
          <div className="glass rounded-3xl p-5 border border-white/5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Net balance</p>
            <h3 className="text-3xl font-black text-white">{summary.netBalance.toFixed(2)}</h3>
            <p className="text-[11px] text-slate-400 mt-2">Debit minus credit.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="glass rounded-3xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Create New Account Head</h3>
                <p className="text-xs text-slate-500">Setup ledger categories for finance operations.</p>
              </div>
              <Plus className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-4">
              <input
                value={headForm.name}
                onChange={(event) => setHeadForm({ ...headForm, name: event.target.value })}
                placeholder="Head name"
                className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
              />
              <select
                value={headForm.type}
                onChange={(event) => setHeadForm({ ...headForm, type: event.target.value as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE' })}
                className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
              >
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
              <input
                type="number"
                min={0}
                value={headForm.openingBalance}
                onChange={(event) => setHeadForm({ ...headForm, openingBalance: Number(event.target.value) })}
                placeholder="Opening balance"
                className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
              />
              <button
                onClick={handleCreateHead}
                className="w-full py-3 rounded-3xl bg-sky-500 text-white font-semibold hover:bg-sky-400 transition-colors"
              >
                Create Head
              </button>
            </div>
          </section>

          <section className="glass rounded-3xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Record Ledger Entry</h3>
                <p className="text-xs text-slate-500">Track debit and credit bookings.</p>
              </div>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-4">
              <select
                value={entryForm.accountHeadId}
                onChange={(event) => setEntryForm({ ...entryForm, accountHeadId: event.target.value })}
                className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
              >
                <option value="">Select account head</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
              <select
                value={entryForm.transactionType}
                onChange={(event) => setEntryForm({ ...entryForm, transactionType: event.target.value as 'DEBIT' | 'CREDIT' })}
                className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
              >
                <option value="DEBIT">Debit</option>
                <option value="CREDIT">Credit</option>
              </select>
              <input
                type="number"
                min={1}
                value={entryForm.amount}
                onChange={(event) => setEntryForm({ ...entryForm, amount: Number(event.target.value) })}
                placeholder="Amount"
                className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
              />
              <input
                type="date"
                value={entryForm.date}
                onChange={(event) => setEntryForm({ ...entryForm, date: event.target.value })}
                className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
              />
              <textarea
                rows={3}
                value={entryForm.description}
                onChange={(event) => setEntryForm({ ...entryForm, description: event.target.value })}
                placeholder="Description"
                className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
              />
              <button
                onClick={handleAddEntry}
                className="w-full py-3 rounded-3xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors"
              >
                Record Entry
              </button>
            </div>
          </section>
        </div>

        <section className="glass rounded-3xl p-6 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Recent Ledger Activity</h3>
              <p className="text-sm text-slate-400">Latest posted entries for accounts.</p>
            </div>
            <TrendingUp className="w-5 h-5 text-sky-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                    <td className="px-4 py-3 text-slate-300">{entry.date}</td>
                    <td className="px-4 py-3 text-white">{entry.accountHead.name}</td>
                    <td className="px-4 py-3 text-slate-300">{entry.transactionType}</td>
                    <td className="px-4 py-3 text-emerald-300">{entry.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-400">{entry.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Accounts;
