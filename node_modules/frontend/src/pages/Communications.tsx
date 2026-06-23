import { useEffect, useState } from 'react';
import { MessageCircle, Radio, Save, Send } from 'lucide-react';
import { useStore } from '../store/useStore';

const api = 'http://localhost:5000/api';

const Communications = () => {
  const { school } = useStore();
  const brandColor = school?.themeColor || '#3b82f6';
  const token = localStorage.getItem('scl_token');
  const headers = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  const [classes, setClasses] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ simulationMode: true });
  const [circulars, setCirculars] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [circular, setCircular] = useState({ title: '', message: '', audience: 'ALL', classId: '', channels: ['PORTAL', 'PUSH'] as string[], status: 'DRAFT' });
  const [manual, setManual] = useState({ title: '', message: '', audience: 'ALL', classId: '', channels: ['PUSH'] as string[] });

  const loadData = async () => {
    const [classRes, settingsRes, circularRes, logRes] = await Promise.all([
      fetch(`${api}/school/classes`, { headers }),
      fetch(`${api}/communication/settings`, { headers }),
      fetch(`${api}/communication/circulars`, { headers }),
      fetch(`${api}/communication/logs`, { headers }),
    ]);
    const [classData, settingData, circularData, logData] = await Promise.all([classRes.json(), settingsRes.json(), circularRes.json(), logRes.json()]);
    if (classData.success) setClasses(classData.data);
    if (settingData.success) setSettings(settingData.data);
    if (circularData.success) setCirculars(circularData.data);
    if (logData.success) setLogs(logData.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const submit = async (url: string, method: string, body: any, success: string) => {
    setMessage('');
    const res = await fetch(`${api}${url}`, { method, headers: jsonHeaders, body: JSON.stringify(body) });
    const data = await res.json();
    setMessage(data.success ? data.message || success : data.message || 'Unable to save');
    if (data.success) loadData();
  };

  const toggleChannel = (source: 'circular' | 'manual', channel: string) => {
    const current = source === 'circular' ? circular : manual;
    const channels = current.channels.includes(channel) ? current.channels.filter((item) => item !== channel) : [...current.channels, channel];
    source === 'circular' ? setCircular({ ...circular, channels }) : setManual({ ...manual, channels });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Send className="w-5 h-5 text-emerald-400" /> Communications</h2>
        <p className="text-xs text-slate-500">Circulars, WhatsApp readiness, push notification tokens, and delivery logs</p>
      </div>
      {message && <div className="glass border border-emerald-500/20 text-emerald-300 text-xs rounded-xl p-3">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={(event) => { event.preventDefault(); submit('/communication/settings', 'PATCH', settings, 'Communication settings saved'); }} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><MessageCircle className="w-4 h-4 text-emerald-400" /> Channel Settings</h3>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={settings.simulationMode} onChange={(event) => setSettings({ ...settings, simulationMode: event.target.checked })} /> Simulation mode</label>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={settings.whatsappEnabled || false} onChange={(event) => setSettings({ ...settings, whatsappEnabled: event.target.checked })} /> WhatsApp enabled</label>
          <input value={settings.whatsappPhoneNumberId || ''} onChange={(event) => setSettings({ ...settings, whatsappPhoneNumberId: event.target.value })} placeholder="WhatsApp Phone Number ID" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <input value={settings.whatsappBusinessId || ''} onChange={(event) => setSettings({ ...settings, whatsappBusinessId: event.target.value })} placeholder="WhatsApp Business Account ID" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <input value={settings.whatsappVerifyToken || ''} onChange={(event) => setSettings({ ...settings, whatsappVerifyToken: event.target.value })} placeholder="Webhook verify token" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <input value={settings.whatsappAccessToken || ''} onChange={(event) => setSettings({ ...settings, whatsappAccessToken: event.target.value })} placeholder="Access token" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={settings.pushEnabled || false} onChange={(event) => setSettings({ ...settings, pushEnabled: event.target.checked })} /> Push enabled</label>
          <input value={settings.firebaseProjectId || ''} onChange={(event) => setSettings({ ...settings, firebaseProjectId: event.target.value })} placeholder="Firebase Project ID" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <input value={settings.firebaseVapidKey || ''} onChange={(event) => setSettings({ ...settings, firebaseVapidKey: event.target.value })} placeholder="Firebase VAPID key" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <button className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2" style={{ background: brandColor }}><Save className="w-4 h-4" /> Save Settings</button>
        </form>

        <form onSubmit={(event) => { event.preventDefault(); submit('/communication/circulars', 'POST', { ...circular, classId: circular.classId || undefined }, 'Circular saved'); }} className="glass p-5 rounded-2xl border border-white/5 space-y-4 xl:col-span-2">
          <h3 className="text-sm font-bold text-white">Circular Management</h3>
          <input value={circular.title} onChange={(event) => setCircular({ ...circular, title: event.target.value })} placeholder="Circular title" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <textarea value={circular.message} onChange={(event) => setCircular({ ...circular, message: event.target.value })} rows={4} placeholder="Message" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={circular.audience} onChange={(event) => setCircular({ ...circular, audience: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"><option>ALL</option><option>STAFF</option><option>PARENTS</option><option>STUDENTS</option><option>CLASS</option></select>
            <select value={circular.classId} onChange={(event) => setCircular({ ...circular, classId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"><option value="">Class optional</option>{classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select>
            <select value={circular.status} onChange={(event) => setCircular({ ...circular, status: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"><option>DRAFT</option><option>PUBLISHED</option></select>
          </div>
          <div className="flex flex-wrap gap-2">{['PORTAL', 'PUSH', 'WHATSAPP'].map((channel) => <button type="button" key={channel} onClick={() => toggleChannel('circular', channel)} className={`px-3 py-2 rounded-lg text-xs font-semibold ${circular.channels.includes(channel) ? 'bg-slate-800 text-white' : 'border border-slate-800 text-slate-500'}`}>{channel}</button>)}</div>
          <button className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Save Circular</button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass rounded-2xl border border-white/5 overflow-hidden"><div className="p-5 border-b border-slate-900"><h3 className="text-sm font-bold text-white">Circulars</h3></div><table className="w-full text-left text-xs"><thead className="text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Title</th><th className="px-5 py-3">Audience</th><th className="px-5 py-3">Channels</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-900/60">{circulars.map((item) => <tr key={item.id}><td className="px-5 py-3 text-white">{item.title}</td><td className="px-5 py-3">{item.audience}</td><td className="px-5 py-3 text-sky-300">{item.channels}</td><td className="px-5 py-3">{item.status}</td><td className="px-5 py-3">{item.status !== 'PUBLISHED' && <button onClick={() => submit(`/communication/circulars/${item.id}/publish`, 'PATCH', {}, 'Circular published')} className="px-3 py-1.5 rounded-lg text-white" style={{ background: brandColor }}>Publish</button>}</td></tr>)}</tbody></table></div>
        <form onSubmit={(event) => { event.preventDefault(); submit('/communication/messages', 'POST', { ...manual, classId: manual.classId || undefined }, 'Message queued'); }} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Radio className="w-4 h-4 text-amber-400" /> Quick Broadcast</h3>
          <input value={manual.title} onChange={(event) => setManual({ ...manual, title: event.target.value })} placeholder="Title optional" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <textarea value={manual.message} onChange={(event) => setManual({ ...manual, message: event.target.value })} rows={4} placeholder="Message" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <div className="flex gap-2">{['PUSH', 'WHATSAPP', 'PORTAL'].map((channel) => <button type="button" key={channel} onClick={() => toggleChannel('manual', channel)} className={`px-3 py-2 rounded-lg text-xs font-semibold ${manual.channels.includes(channel) ? 'bg-slate-800 text-white' : 'border border-slate-800 text-slate-500'}`}>{channel}</button>)}</div>
          <button className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Queue Message</button>
        </form>
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden"><div className="p-5 border-b border-slate-900"><h3 className="text-sm font-bold text-white">Delivery Logs</h3></div><table className="w-full text-left text-xs"><thead className="text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Channel</th><th className="px-5 py-3">Recipient</th><th className="px-5 py-3">Message</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Time</th></tr></thead><tbody className="divide-y divide-slate-900/60">{logs.map((log) => <tr key={log.id}><td className="px-5 py-3 text-sky-300">{log.channel}</td><td className="px-5 py-3 text-white">{log.recipient}</td><td className="px-5 py-3 text-slate-400 max-w-md truncate">{log.message}</td><td className="px-5 py-3">{log.status}</td><td className="px-5 py-3 text-slate-500">{log.sentAt || '-'}</td></tr>)}</tbody></table></div>
    </div>
  );
};

export default Communications;
