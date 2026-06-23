import { useEffect, useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import {
  GraduationCap, Languages, Coins, Award, Plus, FileText, Sparkles, BookMarked, Send
} from 'lucide-react';

const API = '/api/tn';
type Tab = 'samacheer' | 'templates' | 'grants' | 'tnFocus';

export default function TamilNadu() {
  const { token, school } = useStore();
  const [tab, setTab] = useState<Tab>('samacheer');
  const headers = { Authorization: `Bearer ${token}` };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-3xl -z-10 rounded-full" />
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-3">
            <Sparkles className="text-amber-400" size={32} /> Regional Compliance
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">EMIS Sync · TNDGE Guidelines · Samacheer Kalvi</p>
        </div>
        <p className="text-emerald-400 text-xs mt-1">School: {school?.name || '—'}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { k: 'samacheer', label: 'Samacheer Kalvi', icon: GraduationCap },
          { k: 'templates', label: 'Tamil Templates', icon: Languages },
          { k: 'grants', label: 'Aided Grants', icon: Coins },
          { k: 'tnFocus', label: 'TN Differentiation', icon: BookMarked },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.k} onClick={() => setTab(t.k as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.k ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}>
              <Icon size={16} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'samacheer' && <Samacheer headers={headers} />}
      {tab === 'templates' && <TamilTemplates headers={headers} />}
      {tab === 'grants' && <AidedGrants headers={headers} />}
      {tab === 'tnFocus' && <TNDifferentiation />}
    </div>
  );
}

function Samacheer({ headers }: any) {
  const [cfg, setCfg] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [annual, setAnnual] = useState<any>(null);
  const [showMarkForm, setShowMarkForm] = useState(false);
  const [markForm, setMarkForm] = useState({
    studentId: '', classId: '', subjectName: 'Tamil', academicYear: '2025-2026', term: 1,
    examType: 'WRITTEN', theoryMarks: 0, practicalMarks: 0, maxMarks: 100, remarks: '',
  });

  const load = async () => {
    const [c, m] = await Promise.all([
      axios.get(`${API}/samacheer/config`, { headers }),
      axios.get(`${API}/samacheer/marks`, { headers }),
    ]);
    setCfg(c.data.data);
    setMarks(m.data.data || []);
  };
  useEffect(() => { load(); }, []);

  const saveCfg = async () => {
    await axios.put(`${API}/samacheer/config`, cfg, { headers });
    alert('Samacheer Kalvi configuration saved');
  };

  const addMark = async () => {
    await axios.post(`${API}/samacheer/marks`, markForm, { headers });
    setShowMarkForm(false);
    load();
  };

  const computeAnnual = async () => {
    if (!markForm.studentId) return alert('Enter student ID first');
    const r = await axios.get(`${API}/samacheer/marks/${markForm.studentId}/${markForm.academicYear}/annual`, { headers });
    setAnnual(r.data.data);
  };

  if (!cfg) return <p className="text-slate-400">Loading Samacheer config...</p>;

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 p-5 rounded-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <GraduationCap size={20} /> Samacheer Kalvi Configuration
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-slate-400 text-sm">Board Name</span>
            <input className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.boardName || ''} onChange={(e) => setCfg({ ...cfg, boardName: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Academic Pattern</span>
            <select className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.academicPattern} onChange={(e) => setCfg({ ...cfg, academicPattern: e.target.value })}>
              <option>TERM_BASED</option><option>QUARTERLY</option>
            </select>
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Terms per Year</span>
            <input type="number" className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.termsPerYear} onChange={(e) => setCfg({ ...cfg, termsPerYear: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Pass Percentage</span>
            <input type="number" className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.passPercentage} onChange={(e) => setCfg({ ...cfg, passPercentage: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Grace Marks</span>
            <input type="number" className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.graceMarks} onChange={(e) => setCfg({ ...cfg, graceMarks: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Min Attendance %</span>
            <input type="number" className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.minAttendance} onChange={(e) => setCfg({ ...cfg, minAttendance: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Grading Type</span>
            <select className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.gradingType} onChange={(e) => setCfg({ ...cfg, gradingType: e.target.value })}>
              <option>SAMACHEER</option><option>MARKS_BASED</option>
            </select>
          </label>
          <label className="block">
            <span className="text-slate-400 text-sm">Tamil Subject</span>
            <select className="w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" value={cfg.tamilSubject ? 'true' : 'false'} onChange={(e) => setCfg({ ...cfg, tamilSubject: e.target.value === 'true' })}>
              <option value="true">Enabled (First/Second language)</option>
              <option value="false">Disabled</option>
            </select>
          </label>
        </div>
        <button onClick={saveCfg} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">Save Config</button>
      </div>

      <div className="bg-slate-800 p-5 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold">Term-wise Mark Entry</h3>
          <button onClick={() => setShowMarkForm(!showMarkForm)} className="flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white rounded text-sm">
            <Plus size={14} /> Enter Marks
          </button>
        </div>

        {showMarkForm && (
          <div className="bg-slate-700 p-3 rounded mb-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input className="bg-slate-600 text-white rounded px-2 py-1 text-sm" placeholder="Student ID (UUID)" value={markForm.studentId} onChange={(e) => setMarkForm({ ...markForm, studentId: e.target.value })} />
              <input className="bg-slate-600 text-white rounded px-2 py-1 text-sm" placeholder="Class ID (UUID)" value={markForm.classId} onChange={(e) => setMarkForm({ ...markForm, classId: e.target.value })} />
              <input className="bg-slate-600 text-white rounded px-2 py-1 text-sm" placeholder="Subject" value={markForm.subjectName} onChange={(e) => setMarkForm({ ...markForm, subjectName: e.target.value })} />
              <input className="bg-slate-600 text-white rounded px-2 py-1 text-sm" placeholder="Academic Year" value={markForm.academicYear} onChange={(e) => setMarkForm({ ...markForm, academicYear: e.target.value })} />
              <select className="bg-slate-600 text-white rounded px-2 py-1 text-sm" value={markForm.term} onChange={(e) => setMarkForm({ ...markForm, term: Number(e.target.value) })}>
                <option value={1}>Term 1</option><option value={2}>Term 2</option><option value={3}>Term 3</option>
              </select>
              <input type="number" className="bg-slate-600 text-white rounded px-2 py-1 text-sm" placeholder="Max marks" value={markForm.maxMarks} onChange={(e) => setMarkForm({ ...markForm, maxMarks: Number(e.target.value) })} />
              <input type="number" className="bg-slate-600 text-white rounded px-2 py-1 text-sm" placeholder="Theory" value={markForm.theoryMarks} onChange={(e) => setMarkForm({ ...markForm, theoryMarks: Number(e.target.value) })} />
              <input type="number" className="bg-slate-600 text-white rounded px-2 py-1 text-sm" placeholder="Practical" value={markForm.practicalMarks} onChange={(e) => setMarkForm({ ...markForm, practicalMarks: Number(e.target.value) })} />
              <input className="bg-slate-600 text-white rounded px-2 py-1 text-sm" placeholder="Remarks" value={markForm.remarks} onChange={(e) => setMarkForm({ ...markForm, remarks: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button onClick={addMark} className="px-3 py-1 bg-sky-500 text-white rounded text-sm">Save Marks</button>
              <button onClick={computeAnnual} className="px-3 py-1 bg-emerald-500 text-white rounded text-sm flex items-center gap-1"><Award size={14} /> Compute Annual</button>
            </div>
          </div>
        )}

        {annual && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded mb-3">
            <h4 className="text-amber-400 font-semibold">Annual Result: {annual.studentId} · {annual.academicYear}</h4>
            <table className="w-full mt-2 text-sm text-slate-200">
              <thead><tr className="text-slate-400"><th className="text-left">Subject</th><th>T1</th><th>T2</th><th>T3</th><th>Avg</th><th>Grade</th></tr></thead>
              <tbody>
                {annual.subjects?.map((s: any) => (
                  <tr key={s.subject} className="border-t border-slate-700">
                    <td className="py-1">{s.subject}</td>
                    <td className="text-center">{s.t1}</td>
                    <td className="text-center">{s.t2}</td>
                    <td className="text-center">{s.t3}</td>
                    <td className="text-center font-bold">{s.average?.toFixed(1)}</td>
                    <td className="text-center"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">{s.grade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-slate-900 rounded overflow-hidden">
          <table className="w-full text-sm text-slate-200">
            <thead className="bg-slate-950 text-slate-400">
              <tr><th className="p-2 text-left">Subject</th><th className="p-2">Term</th><th className="p-2">Total</th><th className="p-2">Grade</th><th className="p-2">Year</th></tr>
            </thead>
            <tbody>
              {marks.length === 0 && <tr><td colSpan={5} className="p-3 text-center text-slate-500">No Samacheer marks yet</td></tr>}
              {marks.map((m) => (
                <tr key={m.id} className="border-t border-slate-700">
                  <td className="p-2">{m.subjectName}</td>
                  <td className="p-2 text-center">T{m.term}</td>
                  <td className="p-2 text-center">{m.totalMarks}/{m.maxMarks}</td>
                  <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">{m.grade || '—'}</span></td>
                  <td className="p-2 text-center text-xs">{m.academicYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TamilTemplates({ headers }: any) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'ATTENDANCE', language: 'TA', subject: '', body: '', description: '' });
  const [preview, setPreview] = useState<{ rendered: string; variables: string[] } | null>(null);
  const [previewVars, setPreviewVars] = useState('{"parentName":"அன்புள்ள பெற்றோர்","studentName":"கார்த்திக்","date":"2026-01-15","className":"10-A","schoolName":"அரசு மேல்நிலைப் பள்ளி"}');

  const load = async () => {
    const r = await axios.get(`${API}/tamil/templates`, { headers });
    setTemplates(r.data.data || []);
  };
  useEffect(() => { load(); }, []);

  const seed = async () => {
    const r = await axios.post(`${API}/tamil/templates/seed-defaults`, {}, { headers });
    alert(r.data.message);
    load();
  };

  const create = async () => {
    await axios.post(`${API}/tamil/templates`, form, { headers });
    setShowForm(false);
    setForm({ name: '', category: 'ATTENDANCE', language: 'TA', subject: '', body: '', description: '' });
    load();
  };

  const doPreview = async () => {
    try {
      const vars = JSON.parse(previewVars);
      const r = await axios.post(`${API}/tamil/templates/preview`, { body: form.body, language: form.language, variables: vars }, { headers });
      setPreview(r.data.data);
    } catch (e: any) {
      alert('Invalid JSON in variables: ' + e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Languages size={20} /> Tamil Communication Templates</h2>
        <div className="flex gap-2">
          <button onClick={seed} className="px-3 py-1 bg-emerald-500 text-white rounded text-sm">Seed Defaults (Tamil)</button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1 bg-sky-500 text-white rounded text-sm"><Plus size={14} /> New</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-800 p-5 rounded-xl space-y-3">
          <input className="w-full bg-slate-700 text-white rounded px-3 py-2" placeholder="Template name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="bg-slate-700 text-white rounded px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>ATTENDANCE</option><option>FEE</option><option>EXAM</option><option>CIRCULAR</option><option>LEAVE</option><option>GENERAL</option>
            </select>
            <select className="bg-slate-700 text-white rounded px-3 py-2" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="TA">தமிழ் (Tamil)</option><option value="EN">English</option><option value="BILINGUAL">Bilingual</option>
            </select>
          </div>
          <input className="w-full bg-slate-700 text-white rounded px-3 py-2" placeholder="Subject line (optional)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <textarea className="w-full bg-slate-700 text-white rounded px-3 py-2 h-32" placeholder="Body — use {{parentName}}, {{studentName}}, {{date}} etc." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={create} disabled={!form.name || !form.body} className="px-4 py-2 bg-sky-500 text-white rounded disabled:opacity-50">Save Template</button>
            <button onClick={doPreview} disabled={!form.body} className="px-4 py-2 bg-emerald-500 text-white rounded disabled:opacity-50">Preview with sample data</button>
          </div>
          {preview && (
            <div className="bg-slate-900 p-3 rounded border border-amber-500/30">
              <p className="text-amber-400 text-xs mb-1">Preview ({preview.language}):</p>
              <pre className="text-slate-200 text-sm whitespace-pre-wrap font-sans">{preview.rendered}</pre>
              <p className="text-slate-500 text-xs mt-2">Detected variables: {preview.variables.join(', ') || 'none'}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.length === 0 && <p className="text-slate-400 col-span-2 text-center py-6">No templates yet — click "Seed Defaults" to add Tamil templates.</p>}
        {templates.map((t) => (
          <div key={t.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">{t.category}</span>
              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">{t.language}</span>
            </div>
            <h3 className="text-white font-bold">{t.name}</h3>
            {t.subject && <p className="text-slate-400 text-sm italic mt-1">Subject: {t.subject}</p>}
            <p className="text-slate-300 text-xs mt-2 line-clamp-3 whitespace-pre-wrap">{t.body}</p>
            {t.variables && <p className="text-slate-500 text-xs mt-2">Variables: {(() => { try { return JSON.parse(t.variables).join(', '); } catch { return '—'; } })()}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AidedGrants({ headers }: any) {
  const [grants, setGrants] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ grantType: 'SALARY_GRANT', financialYear: '2025-2026', sanctionedAmount: 0, purpose: '', beneficiaryCount: 0, sanctionOrderNo: '', sanctionDate: '' });
  const [receiveFor, setReceiveFor] = useState<string | null>(null);
  const [receiveAmt, setReceiveAmt] = useState(0);

  const load = async () => {
    const [g, s] = await Promise.all([
      axios.get(`${API}/aided-grants`, { headers }),
      axios.get(`${API}/aided-grants/summary`, { headers }),
    ]);
    setGrants(g.data.data || []);
    setSummary(s.data.data);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    await axios.post(`${API}/aided-grants`, form, { headers });
    setShowForm(false);
    setForm({ grantType: 'SALARY_GRANT', financialYear: '2025-2026', sanctionedAmount: 0, purpose: '', beneficiaryCount: 0, sanctionOrderNo: '', sanctionDate: '' });
    load();
  };

  const receive = async (id: string) => {
    await axios.put(`${API}/aided-grants/${id}/receive`, { receivedAmount: receiveAmt }, { headers });
    setReceiveFor(null);
    setReceiveAmt(0);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Coins size={20} /> Aided School Grants</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white rounded text-sm">
          <Plus size={14} /> New Grant
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800 p-3 rounded-xl"><p className="text-slate-400 text-xs">Total Sanctioned</p><p className="text-xl font-bold text-emerald-400">₹{(summary.totals.sanctionedAmount || 0).toLocaleString()}</p></div>
          <div className="bg-slate-800 p-3 rounded-xl"><p className="text-slate-400 text-xs">Total Received</p><p className="text-xl font-bold text-sky-400">₹{(summary.totals.receivedAmount || 0).toLocaleString()}</p></div>
          <div className="bg-slate-800 p-3 rounded-xl"><p className="text-slate-400 text-xs">Pending</p><p className="text-xl font-bold text-amber-400">₹{(summary.totals.pendingAmount || 0).toLocaleString()}</p></div>
          <div className="bg-slate-800 p-3 rounded-xl"><p className="text-slate-400 text-xs">Grants Count</p><p className="text-xl font-bold text-purple-400">{summary.grantCount}</p></div>
        </div>
      )}

      {showForm && (
        <div className="bg-slate-800 p-5 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select className="bg-slate-700 text-white rounded px-3 py-2" value={form.grantType} onChange={(e) => setForm({ ...form, grantType: e.target.value })}>
              <option>SALARY_GRANT</option><option>BUILDING_GRANT</option><option>EQUIPMENT_GRANT</option><option>MAINTENANCE_GRANT</option><option>SPECIAL_GRANT</option>
            </select>
            <input className="bg-slate-700 text-white rounded px-3 py-2" placeholder="Financial Year" value={form.financialYear} onChange={(e) => setForm({ ...form, financialYear: e.target.value })} />
            <input type="number" className="bg-slate-700 text-white rounded px-3 py-2" placeholder="Sanctioned Amount (₹)" value={form.sanctionedAmount} onChange={(e) => setForm({ ...form, sanctionedAmount: Number(e.target.value) })} />
            <input type="number" className="bg-slate-700 text-white rounded px-3 py-2" placeholder="Beneficiary count" value={form.beneficiaryCount} onChange={(e) => setForm({ ...form, beneficiaryCount: Number(e.target.value) })} />
            <input className="bg-slate-700 text-white rounded px-3 py-2" placeholder="Sanction Order No." value={form.sanctionOrderNo} onChange={(e) => setForm({ ...form, sanctionOrderNo: e.target.value })} />
            <input type="date" className="bg-slate-700 text-white rounded px-3 py-2" value={form.sanctionDate} onChange={(e) => setForm({ ...form, sanctionDate: e.target.value })} />
          </div>
          <textarea className="w-full bg-slate-700 text-white rounded px-3 py-2" placeholder="Purpose / Remarks" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          <button onClick={create} disabled={!form.sanctionedAmount} className="px-4 py-2 bg-emerald-500 text-white rounded disabled:opacity-50">Create Grant</button>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-slate-200">
          <thead className="bg-slate-900 text-slate-400">
            <tr><th className="p-3 text-left">Type</th><th className="p-3 text-left">Year</th><th className="p-3">Sanctioned</th><th className="p-3">Received</th><th className="p-3">Pending</th><th className="p-3">Status</th><th></th></tr>
          </thead>
          <tbody>
            {grants.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-slate-500">No aided grants yet</td></tr>}
            {grants.map((g) => (
              <tr key={g.id} className="border-t border-slate-700">
                <td className="p-3 text-xs">{g.grantType}</td>
                <td className="p-3 text-xs">{g.financialYear}</td>
                <td className="p-3 text-center">₹{g.sanctionedAmount?.toLocaleString()}</td>
                <td className="p-3 text-center text-emerald-400">₹{g.receivedAmount?.toLocaleString()}</td>
                <td className="p-3 text-center text-amber-400">₹{g.pendingAmount?.toLocaleString()}</td>
                <td className="p-3 text-center"><span className="px-2 py-0.5 rounded text-xs bg-sky-500/20 text-sky-400">{g.status}</span></td>
                <td className="p-3">
                  {receiveFor === g.id ? (
                    <div className="flex gap-1">
                      <input type="number" className="bg-slate-700 text-white rounded px-1 w-20 text-xs" value={receiveAmt} onChange={(e) => setReceiveAmt(Number(e.target.value))} />
                      <button onClick={() => receive(g.id)} className="text-emerald-400 text-xs">✓</button>
                      <button onClick={() => setReceiveFor(null)} className="text-slate-400 text-xs">✗</button>
                    </div>
                  ) : (
                    <button onClick={() => { setReceiveFor(g.id); setReceiveAmt(g.pendingAmount); }} className="text-sky-400 text-xs">Receive</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TNDifferentiation() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2"><BookMarked size={20} /> Why Tamil Nadu Focus?</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-900/40 to-slate-800 p-5 rounded-xl border border-amber-500/30">
          <GraduationCap className="text-amber-400" size={28} />
          <h3 className="text-white font-bold mt-3">Samacheer Kalvi</h3>
          <p className="text-slate-300 text-sm mt-2">
            Tamil Nadu State Board follows a unique term-based assessment (Term 1, 2, 3) with grace marks,
            attendance condonation up to 10 days, and 80% minimum attendance. Our engine implements all of this.
          </p>
          <ul className="text-slate-400 text-xs mt-3 space-y-1 list-disc list-inside">
            <li>Term-wise marks (T1 / T2 / T3)</li>
            <li>Auto grade: Distinction / First / Second / Pass / Fail</li>
            <li>Theory + Practical separation</li>
            <li>Tamil as first/second language</li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-emerald-900/40 to-slate-800 p-5 rounded-xl border border-emerald-500/30">
          <Languages className="text-emerald-400" size={28} />
          <h3 className="text-white font-bold mt-3">Tamil Templates</h3>
          <p className="text-slate-300 text-sm mt-2">
            Parent communication in Tamil builds trust. Our template engine supports bilingual (Tamil + English) messages with variable substitution and Tamil numeral rendering.
          </p>
          <ul className="text-slate-400 text-xs mt-3 space-y-1 list-disc list-inside">
            <li>Tamil + English + Bilingual modes</li>
            <li>Automatic variable extraction</li>
            <li>Tamil digit rendering (௧, ௨, ௩…)</li>
            <li>Live preview with sample data</li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-purple-900/40 to-slate-800 p-5 rounded-xl border border-purple-500/30">
          <Coins className="text-purple-400" size={28} />
          <h3 className="text-white font-bold mt-3">Aided School Grants</h3>
          <p className="text-slate-300 text-sm mt-2">
            Government-aided schools receive grants for salaries, building, equipment, and maintenance. Our module tracks sanction, receipts, claims, and Utilisation Certificates (UC) for DESE/DEGE submission.
          </p>
          <ul className="text-slate-400 text-xs mt-3 space-y-1 list-disc list-inside">
            <li>Salary / Building / Equipment / Maintenance grants</li>
            <li>Monthly claim tracking</li>
            <li>Auto UC generation</li>
            <li>Sanction vs Received dashboards</li>
          </ul>
        </div>
      </div>
      <div className="bg-slate-800 p-5 rounded-xl">
        <h3 className="text-white font-bold">Differentiator Summary</h3>
        <p className="text-slate-300 text-sm mt-2">
          The combination of <strong>Samacheer Kalvi compliance</strong>, <strong>Tamil bilingual communication</strong>, and <strong>aided school grant management</strong> makes this ERP uniquely positioned for the Tamil Nadu school market. National vendors typically lack TN-specific grading, Tamil SMS/WhatsApp templates, and government grant-in-aid workflows — we ship all three out of the box.
        </p>
      </div>
    </div>
  );
}
