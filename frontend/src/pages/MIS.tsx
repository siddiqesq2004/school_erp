import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Users, GraduationCap, BookOpen, MapPin, WalletCards } from 'lucide-react';

const MIS = () => {
  const token = useStore((state) => state.token);
  const [summary, setSummary] = useState({
    studentCount: 0,
    staffCount: 0,
    classCount: 0,
    sectionCount: 0,
    vehicleCount: 0,
    routeCount: 0,
    bookCount: 0,
    issuedBooks: 0,
    totalDue: 0,
    collected: 0,
    outstanding: 0,
    overdueCount: 0,
    debitTotal: 0,
    creditTotal: 0,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch('http://localhost:5000/api/mis/overview', { headers });
        const json = await res.json();
        if (json.success) setSummary(json.data);
      } catch (error) {
        console.error(error);
      }
    };

    if (token) fetchSummary();
  }, [token]);

  const chartData = [
    { name: 'Students', value: summary.studentCount },
    { name: 'Staff', value: summary.staffCount },
    { name: 'Classes', value: summary.classCount },
    { name: 'Routes', value: summary.routeCount },
    { name: 'Books', value: summary.bookCount },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="glass p-8 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Managed Intelligence System</span>
            <h1 className="text-3xl font-bold text-white mt-3">MIS Dashboard</h1>
            <p className="text-sm text-slate-400 mt-2">A consolidated view of school operations, finance and library controls.</p>
          </div>
          <div className="flex items-center gap-3 rounded-3xl bg-slate-950/70 px-5 py-4 border border-slate-800">
            <LayoutDashboard className="w-6 h-6 text-sky-400" />
            <span className="text-sm text-slate-300">Real-time KPIs</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { title: 'Students', value: summary.studentCount, icon: GraduationCap },
          { title: 'Staff', value: summary.staffCount, icon: Users },
          { title: 'Books', value: summary.bookCount, icon: BookOpen },
          { title: 'Routes', value: summary.routeCount, icon: MapPin },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="glass rounded-3xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.title}</span>
                <div className="rounded-2xl bg-slate-950/70 p-3 text-sky-400">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white">{item.value}</h2>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <section className="glass rounded-3xl p-6 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Operational Summary</h2>
              <p className="text-sm text-slate-400">Fee, transport and library health in one place.</p>
            </div>
            <WalletCards className="w-5 h-5 text-sky-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Active Routes', value: summary.routeCount },
              { label: 'Vehicles', value: summary.vehicleCount },
              { label: 'Issued Books', value: summary.issuedBooks },
              { label: 'Overdue Fees', value: summary.overdueCount },
            ].map((item) => (
              <div key={item.label} className="glass rounded-3xl p-4 border border-white/5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="text-2xl font-black text-white mt-3">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-3xl p-6 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Finance Pulse</h2>
              <p className="text-sm text-slate-400">Debit/Credit balance snapshot.</p>
            </div>
            <WalletCards className="w-5 h-5 text-sky-400" />
          </div>
          <div className="space-y-4">
            <div className="glass rounded-3xl p-4 border border-white/5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Due</p>
              <h3 className="text-2xl font-black text-white">{summary.totalDue.toFixed(2)}</h3>
            </div>
            <div className="glass rounded-3xl p-4 border border-white/5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Collected</p>
              <h3 className="text-2xl font-black text-white">{summary.collected.toFixed(2)}</h3>
            </div>
            <div className="glass rounded-3xl p-4 border border-white/5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Outstanding</p>
              <h3 className="text-2xl font-black text-white">{summary.outstanding.toFixed(2)}</h3>
            </div>
          </div>
        </section>
      </div>

      <section className="glass rounded-3xl p-6 border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Campus Operational Trend</h2>
            <p className="text-sm text-slate-400">Visual breakdown of core school metrics.</p>
          </div>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 12, left: -12, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Bar dataKey="value" fill="#38bdf8" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default MIS;
