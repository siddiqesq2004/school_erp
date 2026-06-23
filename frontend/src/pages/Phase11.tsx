import { useEffect, useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import {
  Building2, Palette, Key, BarChart3, FileText, Shield, Globe, Plus, Trash2, Copy, Check
} from 'lucide-react';

const API = '/api/phase11';

type Tab = 'branches' | 'whiteLabel' | 'apiKeys' | 'analytics' | 'reports' | 'audit';

export default function Phase11() {
  const { token, school } = useStore();
  const [tab, setTab] = useState<Tab>('branches');
  const headers = { Authorization: `Bearer ${token}` };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 blur-3xl -z-10 rounded-full" />
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 flex items-center gap-3">
          <Globe className="text-sky-400" size={32} /> Enterprise
        </h1>
        <p className="text-slate-400 text-sm mt-2 font-medium">
          Multi-branch · White-label · API gateway · Advanced analytics · System hardening
        </p>
        <p className="text-emerald-400 text-xs mt-1 font-semibold tracking-wide uppercase">School: {school?.name || '—'}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { k: 'branches', label: 'Multi-Branch', icon: Building2 },
          { k: 'whiteLabel', label: 'White-Label', icon: Palette },
          { k: 'apiKeys', label: 'API Gateway', icon: Key },
          { k: 'analytics', label: 'Advanced Analytics', icon: BarChart3 },
          { k: 'reports', label: 'Custom Reports', icon: FileText },
          { k: 'audit', label: 'Audit Logs', icon: Shield },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k as Tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm ${
                tab === t.k
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-sky-500/25 scale-105'
                  : 'bg-slate-800/80 backdrop-blur-md text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-105 border border-slate-700/50'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'branches' && <Branches headers={headers} schoolName={school?.name || ''} />}
      {tab === 'whiteLabel' && <WhiteLabel headers={headers} />}
      {tab === 'apiKeys' && <APIKeys headers={headers} />}
      {tab === 'analytics' && <Analytics headers={headers} />}
      {tab === 'reports' && <CustomReports headers={headers} />}
      {tab === 'audit' && <AuditLogs headers={headers} />}
    </div>
  );
}

function Branches({ headers, schoolName }: any) {
  const [branches, setBranches] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', branchType: 'BRANCH', city: '', state: '', board: 'SAMACHEER',
    phone: '', email: '', address: '', udiseCode: '',
  });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [b, r] = await Promise.all([
      axios.get(`${API}/branches`, { headers }),
      axios.get(`${API}/branches/report/consolidated`, { headers }),
    ]);
    setBranches(b.data.data || []);
    setReport(r.data.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.post(`${API}/branches`, form, { headers });
      setShowForm(false);
      setForm({ name: '', code: '', branchType: 'BRANCH', city: '', state: '', board: 'SAMACHEER', phone: '', email: '', address: '', udiseCode: '' });
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create branch');
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this branch?')) return;
    await axios.delete(`${API}/branches/${id}`, { headers });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 flex items-center gap-2">
          Branches of {schoolName}
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20">
          <Plus size={18} /> Add Branch
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-2 gap-3">
            <input className="bg-slate-700 text-white rounded px-3 py-2" placeholder="Branch name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="bg-slate-700 text-white rounded px-3 py-2" placeholder="Code (e.g. CBSE-CH-01)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <select className="bg-slate-700 text-white rounded px-3 py-2" value={form.branchType} onChange={(e) => setForm({ ...form, branchType: e.target.value })}>
              <option>MAIN</option><option>BRANCH</option><option>EXTENSION</option>
            </select>
            <select className="bg-slate-700 text-white rounded px-3 py-2" value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })}>
              <option>SAMACHEER</option><option>CBSE</option><option>ICSE</option><option>INTERNATIONAL</option>
            </select>
            <input className="bg-slate-700 text-white rounded px-3 py-2" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className="bg-slate-700 text-white rounded px-3 py-2" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <input className="bg-slate-700 text-white rounded px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="bg-slate-700 text-white rounded px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="bg-slate-700 text-white rounded px-3 py-2 col-span-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <input className="bg-slate-700 text-white rounded px-3 py-2" placeholder="UDISE code (optional)" value={form.udiseCode} onChange={(e) => setForm({ ...form, udiseCode: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50">{busy ? 'Creating...' : 'Create Branch'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-600 text-white rounded">Cancel</button>
          </div>
        </form>
      )}

      {report && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-5 rounded-2xl shadow-xl">
          <h3 className="text-white font-bold mb-1">Consolidated Report</h3>
          <p className="text-slate-400 text-sm">Total Active Branches: <span className="text-sky-400 font-extrabold text-lg ml-1">{report.totalBranches}</span></p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.length === 0 && <p className="text-slate-400 col-span-3 text-center py-10 bg-slate-800/30 rounded-2xl border border-slate-700/30 border-dashed">No branches yet. Add your first branch above.</p>}
        {branches.map((b) => (
          <div key={b.id} className="group bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 hover:border-sky-500/50 hover:bg-slate-800 transition-all duration-300 shadow-lg hover:shadow-sky-500/10">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-bold">{b.name}</h3>
                <p className="text-slate-400 text-sm">{b.code} · {b.branchType}</p>
                <p className="text-slate-500 text-xs mt-1">{b.board || 'No board'} · {b.city || ''}</p>
                {b.udiseCode && <p className="text-slate-500 text-xs">UDISE: {b.udiseCode}</p>}
              </div>
              <button onClick={() => del(b.id)} className="text-rose-400 hover:text-rose-300">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-3 text-xs">
              <span className={`px-2 py-0.5 rounded ${b.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-300'}`}>
                {b.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhiteLabel({ headers }: any) {
  const [cfg, setCfg] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios.get(`${API}/white-label`, { headers }).then((r) => setCfg(r.data.data));
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await axios.put(`${API}/white-label`, cfg, { headers });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  if (!cfg) return <p className="text-slate-400">Loading white-label config...</p>;

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6 flex items-center gap-3">
          <Palette size={24} className="text-purple-400" /> White-Label Branding
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-slate-400 text-sm">App Name</span>
            <input className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.appName || ''} onChange={(e) => setCfg({ ...cfg, appName: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Tagline</span>
            <input className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.tagline || ''} onChange={(e) => setCfg({ ...cfg, tagline: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">SMS Sender Name</span>
            <input className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.smsSenderName || ''} onChange={(e) => setCfg({ ...cfg, smsSenderName: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Custom Domain</span>
            <input className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" placeholder="school.schoolapp.com" value={cfg.customDomain || ''} onChange={(e) => setCfg({ ...cfg, customDomain: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Primary Color</span>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" className="h-10 w-12 rounded" value={cfg.primaryColor || '#3b82f6'} onChange={(e) => setCfg({ ...cfg, primaryColor: e.target.value })} />
              <input className="flex-1 bg-slate-700 text-white rounded px-3 py-2" value={cfg.primaryColor || ''} onChange={(e) => setCfg({ ...cfg, primaryColor: e.target.value })} />
            </div>
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Accent Color</span>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" className="h-10 w-12 rounded" value={cfg.accentColor || '#22c55e'} onChange={(e) => setCfg({ ...cfg, accentColor: e.target.value })} />
              <input className="flex-1 bg-slate-700 text-white rounded px-3 py-2" value={cfg.accentColor || ''} onChange={(e) => setCfg({ ...cfg, accentColor: e.target.value })} />
            </div>
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Support Email</span>
            <input className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.supportEmail || ''} onChange={(e) => setCfg({ ...cfg, supportEmail: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Support Phone</span>
            <input className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.supportPhone || ''} onChange={(e) => setCfg({ ...cfg, supportPhone: e.target.value })} />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={save} disabled={busy} className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50">
            {busy ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="text-emerald-400 text-sm flex items-center gap-1"><Check size={16} /> Saved</span>}
        </div>
      </div>

      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl">
        <h3 className="text-white font-bold mb-4">Live Preview</h3>
        <div className="border border-slate-700 rounded-lg p-6" style={{ background: `linear-gradient(135deg, ${cfg.primaryColor || '#3b82f6'}22, ${cfg.accentColor || '#22c55e'}22)` }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: cfg.primaryColor || '#3b82f6' }}>
              {(cfg.appName || 'S').charAt(0)}
            </div>
            <div>
              <h4 className="text-white text-lg font-bold">{cfg.appName || 'School ERP'}</h4>
              <p className="text-slate-400 text-sm">{cfg.tagline || 'Your school tagline here'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function APIKeys({ headers }: any) {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState<{ name: string; scopes: string; rawKey?: string }>({ name: '', scopes: 'read' });
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    const r = await axios.get(`${API}/api-keys`, { headers });
    setKeys(r.data.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const r: any = await axios.post(`${API}/api-keys`, { name: newKey.name, scopes: newKey.scopes }, { headers });
    setNewKey({ name: '', scopes: 'read', rawKey: r.data.data.rawKey });
    load();
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoke this API key?')) return;
    await axios.put(`${API}/api-keys/${id}/revoke`, {}, { headers });
    load();
  };

  const copyKey = (raw: string) => {
    navigator.clipboard.writeText(raw);
    alert('API key copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-3"><Key size={24} className="text-amber-400" /> API Gateway Keys</h2>
        <button onClick={() => { setShowNew(!showNew); setNewKey({ name: '', scopes: 'read' }); }} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20">
          <Plus size={18} /> Create Key
        </button>
      </div>

      {showNew && (
        <div className="bg-slate-800 p-5 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="bg-slate-700 text-white rounded px-3 py-2" placeholder="Key name (e.g. Mobile App)" value={newKey.name} onChange={(e) => setNewKey({ ...newKey, name: e.target.value })} />
            <select className="bg-slate-700 text-white rounded px-3 py-2" value={newKey.scopes} onChange={(e) => setNewKey({ ...newKey, scopes: e.target.value })}>
              <option value="read">Read only</option>
              <option value="read,write">Read + Write</option>
              <option value="read,write,admin">Full admin</option>
            </select>
          </div>
          {!newKey.rawKey ? (
            <button onClick={create} disabled={!newKey.name} className="px-4 py-2 bg-sky-500 text-white rounded disabled:opacity-50">Generate Key</button>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded">
              <p className="text-amber-400 text-sm font-semibold mb-2">⚠️ Save this key — it will not be shown again</p>
              <div className="flex items-center gap-2">
                <code className="bg-slate-900 text-emerald-400 px-3 py-2 rounded flex-1 break-all text-sm">{newKey.rawKey}</code>
                <button onClick={() => copyKey(newKey.rawKey!)} className="px-3 py-2 bg-slate-700 text-white rounded"><Copy size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-sm text-slate-200">
          <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50">
            <tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">Prefix</th><th className="p-3 text-left">Scopes</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Last Used</th><th></th></tr>
          </thead>
          <tbody>
            {keys.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-500">No API keys yet</td></tr>}
            {keys.map((k) => (
              <tr key={k.id} className="border-t border-slate-700">
                <td className="p-3">{k.name}</td>
                <td className="p-3 font-mono text-xs">{k.keyPrefix}...</td>
                <td className="p-3 text-xs">{k.scopes}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${k.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{k.isActive ? 'Active' : 'Revoked'}</span></td>
                <td className="p-3 text-xs text-slate-400">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}</td>
                <td className="p-3">{k.isActive && <button onClick={() => revoke(k.id)} className="text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Analytics({ headers }: any) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    axios.get(`${API}/analytics/advanced`, { headers }).then((r) => setData(r.data.data));
  }, []);

  if (!data) return <p className="text-slate-400">Loading analytics...</p>;

  const kpis = [
    { label: 'Active Students', value: data.kpis.activeStudents, color: 'sky' },
    { label: 'Active Staff', value: data.kpis.activeStaff, color: 'emerald' },
    { label: 'Active Branches', value: data.kpis.activeBranches, color: 'amber' },
    { label: 'API Keys', value: data.kpis.activeAPIKeys, color: 'purple' },
    { label: 'Open Tickets', value: data.kpis.openTickets, color: 'rose' },
    { label: 'Today Attendance', value: data.kpis.todayAttendance, color: 'cyan' },
    { label: 'Total Revenue', value: `₹${(data.kpis.totalRevenue || 0).toLocaleString()}`, color: 'yellow' },
    { label: 'Total Tickets', value: data.kpis.supportTickets, color: 'indigo' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-3"><BarChart3 size={24} className="text-indigo-400" /> Advanced Analytics — {data.month}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="group bg-slate-800/60 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800 transition-all duration-300 hover:-translate-y-1 shadow-lg">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{k.label}</p>
            <p className={`text-3xl font-extrabold mt-2 text-${k.color}-400 group-hover:scale-105 transition-transform origin-left`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl">
        <h3 className="text-white font-bold mb-4">Recent Audit Events</h3>
        {data.recentAudits.length === 0 ? <p className="text-slate-500 text-sm">No recent activity</p> : (
          <ul className="space-y-2">
            {data.recentAudits.map((a: any) => (
              <li key={a.id} className="text-sm text-slate-300 border-l-2 border-sky-500 pl-3">
                <span className="text-sky-400 font-mono">{a.action}</span> on <span className="text-slate-400">{a.entity}</span>
                <span className="text-slate-500 text-xs ml-2">{new Date(a.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CustomReports({ headers }: any) {
  const [reports, setReports] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', module: 'SIS', schedule: '' });
  const [runResult, setRunResult] = useState<any>(null);

  const load = async () => {
    const r = await axios.get(`${API}/custom-reports`, { headers });
    setReports(r.data.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    await axios.post(`${API}/custom-reports`, { ...form, config: { module: form.module } }, { headers });
    setShowForm(false);
    setForm({ name: '', description: '', module: 'SIS', schedule: '' });
    load();
  };

  const run = async (id: string) => {
    const r = await axios.post(`${API}/custom-reports/${id}/run`, {}, { headers });
    setRunResult(r.data.data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-rose-400 flex items-center gap-3"><FileText size={24} className="text-fuchsia-400" /> Custom Reports</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20">
          <Plus size={16} /> New Report
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 p-5 rounded-xl space-y-3">
          <input className="w-full bg-slate-700 text-white rounded px-3 py-2" placeholder="Report name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="w-full bg-slate-700 text-white rounded px-3 py-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="bg-slate-700 text-white rounded px-3 py-2" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}>
              <option>SIS</option><option>ATTENDANCE</option><option>FEES</option><option>EXAMS</option>
            </select>
            <input className="bg-slate-700 text-white rounded px-3 py-2" placeholder="Cron (e.g. 0 8 * * *)" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
          </div>
          <button onClick={create} disabled={!form.name} className="px-4 py-2 bg-sky-500 text-white rounded disabled:opacity-50">Save Report</button>
        </div>
      )}

      {runResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
          <h3 className="text-emerald-400 font-semibold mb-2">Report Run Result</h3>
          <pre className="text-slate-300 text-sm overflow-auto">{JSON.stringify(runResult.data, null, 2)}</pre>
          <button onClick={() => setRunResult(null)} className="mt-2 text-xs text-slate-400 hover:text-slate-200">Close</button>
        </div>
      )}

      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-sm text-slate-200">
          <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50">
            <tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">Module</th><th className="p-3 text-left">Schedule</th><th className="p-3 text-left">Last Run</th><th></th></tr>
          </thead>
          <tbody>
            {reports.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-500">No custom reports yet</td></tr>}
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-slate-700">
                <td className="p-3">{r.name}</td>
                <td className="p-3 text-xs">{r.module}</td>
                <td className="p-3 text-xs font-mono">{r.schedule || 'manual'}</td>
                <td className="p-3 text-xs">{r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : 'Never'}</td>
                <td className="p-3"><button onClick={() => run(r.id)} className="px-2 py-1 bg-sky-500 text-white rounded text-xs">Run</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditLogs({ headers }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    axios.get(`${API}/audit-logs?limit=50`, { headers }).then((r) => setLogs(r.data.data || []));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 flex items-center gap-3"><Shield size={24} className="text-red-400" /> Audit Log Trail</h2>
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-sm text-slate-200">
          <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50">
            <tr><th className="p-3 text-left">When</th><th className="p-3 text-left">Action</th><th className="p-3 text-left">Entity</th><th className="p-3 text-left">IP</th></tr>
          </thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-500">No audit logs yet</td></tr>}
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-700">
                <td className="p-3 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded text-xs">{l.action}</span></td>
                <td className="p-3 text-xs">{l.entity}</td>
                <td className="p-3 text-xs text-slate-400 font-mono">{l.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
