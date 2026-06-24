import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { User, Lock, ArrowRight, ShieldCheck, Mail, Palette } from 'lucide-react';
import confetti from 'canvas-confetti';

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#ef4444', // Red
];

const Register = () => {
  const navigate = useNavigate();
  const loginStore = useStore((state) => state.login);

  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [themeColor, setThemeColor] = useState('#3b82f6');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName || !schoolCode || !username || !password || !firstName || !lastName) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/register-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName,
          schoolCode,
          themeColor,
          username,
          password,
          email: email || undefined,
          firstName,
          lastName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Trigger high-end onboarding confetti celebration
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: [themeColor, '#ffffff', '#1e293b']
        });

        // Authenticate
        loginStore(data.data.user, data.data.school, data.data.token);
        setTimeout(() => {
          navigate('/dashboard/home');
        }, 1500);
      } else {
        setError(data.message || 'Error creating school tenancy');
      }
    } catch (err) {
      setError('Failed to reach backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 py-16 overflow-y-auto">
      {/* Background glowing rings */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[150px]" />
      <div 
        className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] transition-colors duration-500"
        style={{ backgroundColor: `${themeColor}08` }}
      />

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl glass mb-3 animate-pulse">
            <Palette className="w-8 h-8" style={{ color: themeColor }} />
          </div>
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-white mb-2">
            Establish School <span className="text-gradient">Tenancy</span>
          </h1>
          <p className="text-sm text-slate-400">Initialize a completely separate SaaS environment in seconds</p>
        </div>

        {/* Multi-step/Layout styled glass card */}
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/5">
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl p-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: School Details */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-2 border-b border-slate-900 pb-2">
                  1. Organization Config
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Official School Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oakridge International School"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400/50 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Unique School Code *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. OAK001 (Unique key)"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Theme Palette selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Primary Brand Theme Color
                  </label>
                  <div className="flex items-center gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setThemeColor(c)}
                        className="w-8 h-8 rounded-full border-2 transition-all duration-300 transform hover:scale-110 active:scale-95"
                        style={{
                          backgroundColor: c,
                          borderColor: themeColor === c ? '#ffffff' : 'transparent',
                          boxShadow: themeColor === c ? `0 0 15px ${c}` : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Admin Details */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-2 border-b border-slate-900 pb-2">
                  2. Master Admin Key
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400/50 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Master Username *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="admin, principal_root, etc."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Credentials Access Code *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      placeholder="•••••••• (Min 6 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      pattern=".+@gmail\.com"
                      title="Must be a @gmail.com address"
                      placeholder="Email (@gmail.com)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Launch button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform active:scale-95 disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, ${themeColor}, ${themeColor}d4)`,
                  boxShadow: `0 8px 30px ${themeColor}1c`,
                }}
              >
                {loading ? 'Bootstrapping School Environment...' : 'Deploy Tenant & Launch ERP'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          {/* Go back */}
          <div className="mt-6 text-center">
            <span className="text-xs text-slate-400">Already established? </span>
            <Link to="/" className="text-xs font-bold text-sky-400 hover:text-sky-300 hover:underline">
              Enter Operations Console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
