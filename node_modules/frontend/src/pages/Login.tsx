import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { School, User, Lock, ArrowRight, ShieldCheck, HelpCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const loginStore = useStore((state) => state.login);

  const [schoolCode, setSchoolCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  // Look up school by code to showcase custom school theme
  const handleSchoolCodeBlur = async () => {
    if (schoolCode.trim().length >= 3) {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/school/${schoolCode.trim()}`);
        const data = await res.json();
        if (data.success) {
          setSchoolInfo(data.data);
          setError('');
        } else {
          setSchoolInfo(null);
        }
      } catch (err) {
        console.error('Error fetching school metadata');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolCode || !username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolCode, username, password }),
      });

      const data = await res.json();
      if (data.success) {
        // Authenticate
        loginStore(data.data.user, data.data.school, data.data.token);
        
        if (data.data.user.role === 'STUDENT' || data.data.user.role === 'PARENT') {
          navigate('/dashboard/portal');
        } else {
          navigate('/dashboard/home');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection to backend server failed');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#030712] px-4 py-12 overflow-hidden">
      {/* Background Animated Blobs for premium glassmorphism glow */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[120px]" 
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-500" 
        style={{ backgroundColor: schoolInfo?.themeColor ? `${schoolInfo.themeColor}15` : 'rgba(168, 85, 247, 0.1)' }}
      />

      <div className="relative w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Brand Story */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-col justify-center space-y-8 pr-12"
        >
          <div className="inline-flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500/20 to-purple-500/20 border border-white/10 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
              <School className="w-8 h-8 text-sky-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Aegis <span className="text-gradient">ERP</span>
            </h1>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-medium text-slate-200 leading-tight">
              Intelligent School <br/><span className="text-slate-400">Operating System.</span>
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Experience the next generation of educational management. Streamlined, secure, and incredibly powerful.
            </p>
          </div>
          <div className="flex gap-4 pt-4">
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-full border border-white/5">
                <Sparkles className="w-4 h-4 text-purple-400" /> Premium EdTech
             </div>
          </div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="glass-panel rounded-3xl p-8 sm:p-10 relative overflow-hidden w-full max-w-md mx-auto"
        >
          {schoolInfo && (
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-0 left-0 w-full h-[4px] origin-left" 
              style={{ backgroundColor: schoolInfo.themeColor }}
            />
          )}

          <motion.div variants={itemVariants} className="mb-8 lg:hidden flex flex-col items-center">
            <div className="p-3 rounded-2xl glass mb-3 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              <School className="w-8 h-8 text-sky-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-1">
              Aegis <span className="text-gradient">ERP</span>
            </h1>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-xs text-slate-400 mb-8">
              {schoolInfo ? `Accessing portal for ` : 'Enter your credentials to continue.'}
              {schoolInfo && <span className="font-bold text-sky-400">{schoolInfo.name}</span>}
            </p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl p-3 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">School Code</label>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-sky-400 transition-colors">
                  <School className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. DPS001"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  onBlur={handleSchoolCodeBlur}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all glow-active"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Portal Username</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-sky-400 transition-colors">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="admin, student_01, etc."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all glow-active"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Secret Key</label>
                <a href="#help" className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1 font-semibold">
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-sky-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all glow-active"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all disabled:opacity-50"
                style={{
                  background: schoolInfo?.themeColor
                    ? `linear-gradient(to right, ${schoolInfo.themeColor}, ${schoolInfo.themeColor}cc)`
                    : undefined,
                }}
              >
                {loading ? 'Decrypting Session...' : 'Authenticate Account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </motion.button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 font-medium">Deploying a new school tenancy? </span>
            <Link to="/register" className="text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors">
              Establish Tenancy
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
