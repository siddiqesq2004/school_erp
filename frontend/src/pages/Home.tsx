import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Award
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const ATTENDANCE_DATA = [
  { day: 'Mon', percentage: 94 },
  { day: 'Tue', percentage: 96 },
  { day: 'Wed', percentage: 95 },
  { day: 'Thu', percentage: 97 },
  { day: 'Fri', percentage: 93 },
];

const FEE_COLLECTION_DATA = [
  { term: 'Term 1', collected: 45000, pending: 15000 },
  { term: 'Term 2', collected: 38000, pending: 22000 },
  { term: 'Term 3', collected: 15000, pending: 45000 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 } 
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const Home = () => {
  const { school, user } = useStore();
  const brandColor = school?.themeColor || '#38bdf8'; // Default to sky-400
  
  const [stats, setStats] = useState({
    studentsCount: 0,
    staffCount: 0,
    classesCount: 0,
  });

  const [loading, setLoading] = useState(true);

  // Fetch operational school metrics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('scl_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Get classes
        const classRes = await fetch('http://localhost:5000/api/school/classes', { headers });
        const classData = await classRes.json();
        
        // Get students
        const studentRes = await fetch('http://localhost:5000/api/school/students', { headers });
        const studentData = await studentRes.json();

        // Get staff
        const staffRes = await fetch('http://localhost:5000/api/school/staff', { headers });
        const staffData = await staffRes.json();

        setStats({
          classesCount: classData.success ? classData.data.length : 0,
          studentsCount: studentData.success ? studentData.data.length : 0,
          staffCount: staffData.success ? staffData.data.length : 0,
        });
      } catch (err) {
        console.error('Error fetching statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="space-y-8"
    >
      {/* Radiant Greeting Banner */}
      <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden glass-panel p-8 border border-white/5 shadow-2xl group">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity duration-700"
          style={{ backgroundColor: brandColor }}
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span 
              className="text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-full inline-flex items-center gap-2 mb-4 bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
              style={{ color: brandColor }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Control Center Core v1.0
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white font-sans tracking-tight mb-2">
              Welcome back, <span className="text-gradient">{user?.username}</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Monitor attendance tracking indices, outstanding fee collections, and complete academic structures across your organization.
            </p>
          </div>
          <div className="glass px-6 py-4 rounded-2xl flex items-center gap-4 border border-white/5 shadow-inner">
            <div className="p-2.5 bg-sky-500/10 rounded-xl">
              <Calendar className="w-6 h-6 text-sky-400" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest">Local Session</span>
              <span className="text-sm font-bold text-slate-200">Current Term</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Numerical Card grids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pupils Card */}
        <motion.div variants={itemVariants} className="glass p-6 rounded-2xl border border-white/5 glass-hover flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider mb-2">Student Strength</span>
            <h4 className="text-3xl font-black text-white tracking-tight">
              {loading ? '...' : stats.studentsCount}
            </h4>
            <span className="text-[10px] text-emerald-400 font-bold inline-flex items-center gap-1 mt-3 bg-emerald-500/10 px-2.5 py-1 rounded-md">
              <TrendingUp className="w-3 h-3" /> +100% active
            </span>
          </div>
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white relative z-10 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
            style={{ backgroundColor: `${brandColor}15`, border: `1px solid ${brandColor}30` }}
          >
            <GraduationCap className="w-7 h-7" style={{ color: brandColor }} />
          </div>
        </motion.div>

        {/* Staff HR Card */}
        <motion.div variants={itemVariants} className="glass p-6 rounded-2xl border border-white/5 glass-hover flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider mb-2">Faculty & HR</span>
            <h4 className="text-3xl font-black text-white tracking-tight">
              {loading ? '...' : stats.staffCount}
            </h4>
            <span className="text-[10px] text-slate-400 font-bold inline-flex items-center gap-1 mt-3 bg-white/5 px-2.5 py-1 rounded-md">
              Teaching & Admin
            </span>
          </div>
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white relative z-10 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            style={{ backgroundColor: `rgba(99, 102, 241, 0.15)`, border: `1px solid rgba(99, 102, 241, 0.3)` }}
          >
            <Users className="w-7 h-7 text-indigo-400" />
          </div>
        </motion.div>

        {/* Active Classrooms */}
        <motion.div variants={itemVariants} className="glass p-6 rounded-2xl border border-white/5 glass-hover flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider mb-2">Classrooms</span>
            <h4 className="text-3xl font-black text-white tracking-tight">
              {loading ? '...' : stats.classesCount}
            </h4>
            <span className="text-[10px] text-slate-400 font-bold inline-flex items-center gap-1 mt-3 bg-white/5 px-2.5 py-1 rounded-md">
              Syllabus mapped
            </span>
          </div>
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white relative z-10 shadow-[0_0_20px_rgba(236,72,153,0.15)]"
            style={{ backgroundColor: `rgba(236, 72, 153, 0.15)`, border: `1px solid rgba(236, 72, 153, 0.3)` }}
          >
            <Award className="w-7 h-7 text-pink-400" />
          </div>
        </motion.div>

        {/* Attendance Index */}
        <motion.div variants={itemVariants} className="glass p-6 rounded-2xl border border-white/5 glass-hover flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider mb-2">Today's Presence</span>
            <h4 className="text-3xl font-black text-white tracking-tight">95.4%</h4>
            <span className="text-[10px] text-emerald-400 font-bold inline-flex items-center gap-1 mt-3 bg-emerald-500/10 px-2.5 py-1 rounded-md">
              Normal index
            </span>
          </div>
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white relative z-10 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            style={{ backgroundColor: `rgba(16, 185, 129, 0.15)`, border: `1px solid rgba(16, 185, 129, 0.3)` }}
          >
            <Clock className="w-7 h-7 text-emerald-400" />
          </div>
        </motion.div>
      </div>

      {/* Graphical Analytics section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance trend AreaChart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white leading-tight mb-1">Weekly Attendance Ratio</h3>
              <p className="text-xs text-slate-500 font-medium">Student presence logged across secondary segments</p>
            </div>
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20 shadow-[0_0_10px_rgba(56,189,248,0.1)]">Active log</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ATTENDANCE_DATA}>
                <defs>
                  <linearGradient id="colorPresence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={brandColor} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={brandColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255, 255, 255, 0.3)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="rgba(255, 255, 255, 0.3)" fontSize={11} domain={[85, 100]} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
                  itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Area type="monotone" dataKey="percentage" stroke={brandColor} strokeWidth={3} fillOpacity={1} fill="url(#colorPresence)" activeDot={{ r: 6, strokeWidth: 0, fill: brandColor, style: { filter: `drop-shadow(0px 0px 8px ${brandColor})` } }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Fees Collections stacked BarChart */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white leading-tight mb-1">Fee Collections</h3>
              <p className="text-xs text-slate-500 font-medium">Structured collections indices</p>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
              <Wallet className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FEE_COLLECTION_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                <XAxis dataKey="term" stroke="rgba(255, 255, 255, 0.3)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="rgba(255, 255, 255, 0.3)" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
                  itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Bar dataKey="collected" stackId="a" fill={brandColor} radius={[0, 0, 6, 6]} />
                <Bar dataKey="pending" stackId="a" fill="rgba(99, 102, 241, 0.2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;
