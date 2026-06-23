import { useEffect, useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import {
  LifeBuoy, BookOpen, Video, Activity, Plus, X, Send, FileText, Server, Gauge, Database, Clock
} from 'lucide-react';

const API = '/api/phase12';
type Tab = 'tickets' | 'kb' | 'videos' | 'docs' | 'health';

export default function Phase12() {
  const { token } = useStore();
  const [tab, setTab] = useState<Tab>('tickets');
  const headers = { Authorization: `Bearer ${token}` };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl -z-10 rounded-full" />
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center gap-3">
          <LifeBuoy className="text-emerald-400" size={32} /> Support & Launch
        </h1>
        <p className="text-slate-400 text-sm mt-2 font-medium">
          Support portal · Knowledge base · Video tutorials · Performance · Security audit · Documentation
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { k: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
          { k: 'kb', label: 'Knowledge Base', icon: BookOpen },
          { k: 'videos', label: 'Video Tutorials', icon: Video },
          { k: 'docs', label: 'Documentation', icon: FileText },
          { k: 'health', label: 'System Health', icon: Activity },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.k} onClick={() => setTab(t.k as Tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm ${
                tab === t.k
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25 scale-105'
                  : 'bg-slate-800/80 backdrop-blur-md text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-105 border border-slate-700/50'
              }`}>
              <Icon size={16} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'tickets' && <Tickets headers={headers} />}
      {tab === 'kb' && <KB headers={headers} />}
      {tab === 'videos' && <Videos headers={headers} />}
      {tab === 'docs' && <Documentation />}
      {tab === 'health' && <Health headers={headers} />}
    </div>
  );
}

function Tickets({ headers }: any) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [open, setOpen] = useState<any>(null);
  const [form, setForm] = useState({ subject: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
  const [reply, setReply] = useState('');

  const load = async () => {
    const r = await axios.get(`${API}/tickets`, { headers });
    setTickets(r.data.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    await axios.post(`${API}/tickets`, form, { headers });
    setShowNew(false);
    setForm({ subject: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
    load();
  };

  const view = async (id: string) => {
    const r = await axios.get(`${API}/tickets/${id}`, { headers });
    setOpen(r.data.data);
  };

  const sendReply = async () => {
    if (!reply) return;
    await axios.post(`${API}/tickets/${open.id}/messages`, { message: reply }, { headers });
    setReply('');
    view(open.id);
  };

  const setStatus = async (status: string) => {
    await axios.put(`${API}/tickets/${open.id}/status`, { status }, { headers });
    view(open.id);
    load();
  };

  const colorMap: any = { LOW: 'slate', MEDIUM: 'sky', HIGH: 'amber', URGENT: 'rose' };
  const statusColor: any = { OPEN: 'sky', IN_PROGRESS: 'amber', RESOLVED: 'emerald', CLOSED: 'slate' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400 flex items-center gap-3"><LifeBuoy size={24} className="text-sky-400" /> Support Tickets</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20">
          <Plus size={18} /> New Ticket
        </button>
      </div>

      {showNew && (
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <input className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-sky-500 focus:outline-none" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <textarea className="w-full bg-slate-700 text-white rounded px-3 py-2 h-24 border border-slate-600 focus:border-sky-500 focus:outline-none" placeholder="Describe the issue..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>GENERAL</option><option>TECHNICAL</option><option>BILLING</option><option>FEATURE_REQUEST</option><option>BUG</option>
            </select>
            <select className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
            </select>
          </div>
          <button onClick={create} disabled={!form.subject || !form.description} className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-sky-500/20">Submit Ticket</button>
        </div>
      )}

      {open && (
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white text-xl font-bold">{open.subject}</h3>
              <p className="text-slate-400 text-sm mt-1">{open.ticketNo} · <span className={`text-${statusColor[open.status]}-400 font-semibold`}>{open.status}</span> · <span className={`text-${colorMap[open.priority]}-400 font-semibold`}>{open.priority}</span></p>
            </div>
            <button onClick={() => setOpen(null)} className="p-1 hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
          </div>
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
            <p className="text-slate-300 whitespace-pre-wrap">{open.description}</p>
          </div>
          <div className="mt-4 space-y-3">
            {open.messages?.map((m: any) => (
              <div key={m.id} className={`p-4 rounded-xl border ${m.isStaff ? 'bg-sky-500/10 border-sky-500/30' : 'bg-slate-700/50 border-slate-600/50'}`}>
                <p className="text-slate-200 text-sm">{m.message}</p>
                <p className="text-slate-400 text-xs mt-2">{new Date(m.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-2 border border-slate-600 focus:border-sky-500 focus:outline-none" placeholder="Type a reply..." value={reply} onChange={(e) => setReply(e.target.value)} />
            <button onClick={sendReply} className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl shadow-lg hover:shadow-sky-500/20"><Send size={18} /></button>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setStatus('IN_PROGRESS')} className="px-4 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 rounded-lg text-xs font-semibold transition-colors">Mark In Progress</button>
            <button onClick={() => setStatus('RESOLVED')} className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg text-xs font-semibold transition-colors">Mark Resolved</button>
            <button onClick={() => setStatus('CLOSED')} className="px-4 py-1.5 bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors">Close</button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-sm text-slate-200">
          <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50">
            <tr><th className="p-4 text-left font-semibold">Ticket</th><th className="p-4 text-left font-semibold">Subject</th><th className="p-4 text-left font-semibold">Category</th><th className="p-4 text-left font-semibold">Priority</th><th className="p-4 text-left font-semibold">Status</th><th></th></tr>
          </thead>
          <tbody>
            {tickets.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-500">No tickets yet</td></tr>}
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-slate-700">
                <td className="p-3 text-xs font-mono">{t.ticketNo}</td>
                <td className="p-3">{t.subject}</td>
                <td className="p-3 text-xs">{t.category}</td>
                <td className="p-3"><span className={`px-2 py-0.5 bg-${colorMap[t.priority]}-500/20 text-${colorMap[t.priority]}-400 rounded text-xs`}>{t.priority}</span></td>
                <td className="p-3"><span className={`px-2 py-0.5 bg-${statusColor[t.status]}-500/20 text-${statusColor[t.status]}-400 rounded text-xs`}>{t.status}</span></td>
                <td className="p-3"><button onClick={() => view(t.id)} className="text-sky-400 hover:text-sky-300 text-xs">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KB({ headers }: any) {
  const [articles, setArticles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', content: '', category: 'GENERAL' });

  const load = async () => {
    const r = await axios.get(`${API}/kb`, { headers });
    setArticles(r.data.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    await axios.post(`${API}/kb`, form, { headers });
    setShowNew(false);
    setForm({ title: '', slug: '', content: '', category: 'GENERAL' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-3"><BookOpen size={24} className="text-purple-400" /> Knowledge Base</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20">
          <Plus size={18} /> Add Article
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <input className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-purple-500 focus:outline-none" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-purple-500 focus:outline-none" placeholder="URL slug (e.g. fee-payment-guide)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <select className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>GENERAL</option><option>FEES</option><option>EXAMS</option><option>ATTENDANCE</option><option>ADMISSIONS</option>
            </select>
          </div>
          <textarea className="w-full bg-slate-700 text-white rounded px-3 py-2 h-32 border border-slate-600 focus:border-purple-500 focus:outline-none" placeholder="Article content (markdown supported)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <button onClick={create} disabled={!form.title || !form.slug || !form.content} className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/20">Publish</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.length === 0 && <p className="text-slate-400 col-span-3 text-center py-10 bg-slate-800/30 rounded-2xl border border-slate-700/30 border-dashed">No articles yet. Add your first help article.</p>}
        {articles.map((a) => (
          <div key={a.id} className="group bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800 transition-all duration-300 shadow-lg hover:shadow-purple-500/10">
            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">{a.category}</span>
            <h3 className="text-white text-lg font-bold mt-4 group-hover:text-purple-400 transition-colors">{a.title}</h3>
            <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed">{a.content.substring(0, 120)}...</p>
            <div className="flex items-center justify-between mt-4 text-slate-500 text-xs font-medium">
              <span>{a.views} views</span>
              <span>{new Date(a.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Videos({ headers }: any) {
  const [videos, setVideos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '', module: 'GENERAL', duration: 0 });

  const load = async () => {
    const r = await axios.get(`${API}/videos`, { headers });
    setVideos(r.data.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    await axios.post(`${API}/videos`, form, { headers });
    setShowNew(false);
    setForm({ title: '', description: '', videoUrl: '', module: 'GENERAL', duration: 0 });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400 flex items-center gap-3"><Video size={24} className="text-rose-400" /> Video Tutorials</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20">
          <Plus size={18} /> Add Video
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <input className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-rose-500 focus:outline-none" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-rose-500 focus:outline-none" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-rose-500 focus:outline-none" placeholder="Video URL (YouTube embed or .mp4)" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}>
              <option>GENERAL</option><option>SIS</option><option>FEES</option><option>EXAMS</option><option>ATTENDANCE</option><option>PAYROLL</option>
            </select>
            <input type="number" className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none" placeholder="Duration (sec)" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
          </div>
          <button onClick={create} disabled={!form.title || !form.videoUrl} className="px-5 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-rose-500/20">Publish Video</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {videos.length === 0 && <p className="text-slate-400 col-span-3 text-center py-10 bg-slate-800/30 rounded-2xl border border-slate-700/30 border-dashed">No videos yet</p>}
        {videos.map((v) => (
          <div key={v.id} className="group bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 hover:border-rose-500/50 transition-all duration-300 shadow-lg hover:shadow-rose-500/10 cursor-pointer">
            <div className="aspect-video bg-slate-900/80 rounded-xl mb-3 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Video size={48} className="group-hover:text-rose-500 transition-colors z-10" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">{v.module}</span>
            <h3 className="text-white font-bold mt-3 text-sm group-hover:text-rose-400 transition-colors">{v.title}</h3>
            <div className="flex items-center justify-between mt-2 text-slate-500 text-xs font-medium">
              <span>{v.views} views</span>
              <span>{v.duration ? `${Math.floor(v.duration/60)}m ${v.duration%60}s` : '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Documentation() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center gap-3"><FileText size={24} className="text-amber-400" /> Documentation & Launch</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <a href="http://localhost:5000/api" target="_blank" rel="noreferrer" className="group bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 shadow-lg">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Server className="text-amber-400" size={24} />
          </div>
          <h3 className="text-white font-bold mt-2 text-lg">API Endpoint Index</h3>
          <p className="text-slate-400 text-sm mt-1">All registered modules and their base routes</p>
        </a>
        <a href="http://localhost:5000/health" target="_blank" rel="noreferrer" className="group bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 shadow-lg">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Activity className="text-emerald-400" size={24} />
          </div>
          <h3 className="text-white font-bold mt-2 text-lg">Health Check</h3>
          <p className="text-slate-400 text-sm mt-1">System status & uptime endpoint</p>
        </a>
        <div className="group bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-sky-500/50 transition-all duration-300 hover:-translate-y-1 shadow-lg">
          <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Gauge className="text-sky-400" size={24} />
          </div>
          <h3 className="text-white font-bold mt-2 text-lg">Load Testing (k6)</h3>
          <p className="text-slate-400 text-sm mt-1">Run <code className="text-sky-400 bg-sky-400/10 px-1 rounded font-mono text-xs">k6 run loadtest/k6-smoke.js</code></p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
        <h3 className="text-xl font-bold text-white mb-4 relative z-10 flex items-center gap-2">
          <CheckCircle2 className="text-emerald-400" /> Launch Checklist
        </h3>
        <ul className="space-y-3 text-sm text-slate-300 relative z-10">
          <li className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={12} className="text-emerald-400" /></div> Performance optimisation — compression, rate limit, indexes</li>
          <li className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={12} className="text-emerald-400" /></div> Security audit — helmet headers, CORS, input size limit</li>
          <li className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={12} className="text-emerald-400" /></div> Documentation — API index at /api</li>
          <li className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={12} className="text-emerald-400" /></div> Support portal — tickets, KB, video tutorials</li>
          <li className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={12} className="text-emerald-400" /></div> Load testing — k6 script in <code className="bg-slate-700 px-1 rounded">backend/loadtest/</code></li>
          <li className="flex items-center gap-2 text-slate-400"><div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center"><span className="text-xs">⏭️</span></div> Run load test before production cutover</li>
          <li className="flex items-center gap-2 text-slate-400"><div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center"><span className="text-xs">⏭️</span></div> Set up PM2 cluster mode in production</li>
        </ul>
      </div>
    </div>
  );
}

function Health({ headers }: any) {
  const [h, setH] = useState<any>(null);
  useEffect(() => {
    axios.get(`${API}/health`, { headers }).then((r) => setH(r.data.data));
  }, []);

  if (!h) return <p className="text-slate-400">Loading health metrics...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-3"><Activity size={24} className="text-emerald-400" /> System Health & Metrics</h2>
      <div className={`p-6 rounded-2xl border ${h.status === 'healthy' ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-transparent shadow-emerald-500/10' : 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent shadow-amber-500/10'} shadow-lg backdrop-blur-sm relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-32 h-32 ${h.status === 'healthy' ? 'bg-emerald-500/20' : 'bg-amber-500/20'} blur-3xl rounded-full`}></div>
        <p className="text-3xl font-extrabold text-white mb-2 relative z-10">Status: <span className={h.status === 'healthy' ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400'}>{h.status.toUpperCase()}</span></p>
        <p className="text-slate-400 text-sm font-medium relative z-10">Uptime: {Math.floor(h.uptime)}s · Node {h.nodeVersion} · Memory {h.memoryMB}MB</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="group bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/10">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Uptime</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2 flex items-center gap-2 group-hover:scale-105 transition-transform origin-left"><Clock size={24} className="text-emerald-500/50" /> {Math.floor(h.uptime / 60)}m</p>
        </div>
        <div className="group bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 hover:border-sky-500/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-sky-500/10">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Memory</p>
          <p className="text-3xl font-extrabold text-sky-400 mt-2 group-hover:scale-105 transition-transform origin-left">{h.memoryMB}MB</p>
        </div>
        <div className="group bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-amber-500/10">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tickets</p>
          <p className="text-3xl font-extrabold text-amber-400 mt-2 group-hover:scale-105 transition-transform origin-left">{h.tickets.total}</p>
        </div>
        <div className="group bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-rose-500/10">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Open</p>
          <p className="text-3xl font-extrabold text-rose-400 mt-2 group-hover:scale-105 transition-transform origin-left">{h.tickets.open}</p>
        </div>
      </div>
    </div>
  );
}
