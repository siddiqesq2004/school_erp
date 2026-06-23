import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, GraduationCap, LogOut, Menu, X, Bell,
  Search, BookOpen, PieChart, ClipboardCheck, FileSpreadsheet,
  WalletCards, Banknote, MapPin, Building2, Key, LifeBuoy,
  Sparkles, Activity, ChevronRight
} from 'lucide-react';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, school, logout } = useStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const brandColor = school?.themeColor || '#3b82f6';
  const isPortalUser = user?.role === 'STUDENT' || user?.role === 'PARENT';

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) {
        setScrolled(scrollContainer.scrollTop > 20);
      }
    };
    const el = document.getElementById('main-scroll-container');
    el?.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  let menuItems = [
    { name: 'Dashboard Overview', path: '/dashboard/home', icon: LayoutDashboard },
    { name: 'Student Directory (SIS)', path: '/dashboard/sis', icon: GraduationCap },
    { name: 'Human Resources (HR)', path: '/dashboard/hr', icon: Users },
    { name: 'Academic Control', path: '/dashboard/academics', icon: BookOpen },
    { name: 'Attendance', path: '/dashboard/attendance', icon: ClipboardCheck },
    { name: 'Exams & Results', path: '/dashboard/exams', icon: FileSpreadsheet },
    { name: 'Fee Management', path: '/dashboard/fees', icon: WalletCards },
    { name: 'Payroll & Leave', path: '/dashboard/payroll', icon: Banknote },
    { name: 'Transport Management', path: '/dashboard/transport', icon: MapPin },
    { name: 'Accounts & Finance', path: '/dashboard/accounts', icon: PieChart },
    { name: 'Library Services', path: '/dashboard/library', icon: BookOpen },
    { name: 'Compliance & Admissions', path: '/dashboard/phase9', icon: ClipboardCheck },
    { name: 'LMS & Campus Services', path: '/dashboard/phase10', icon: GraduationCap },
    { name: 'Enterprise', path: '/dashboard/phase11', icon: Building2 },
    { name: 'Support & Launch', path: '/dashboard/phase12', icon: LifeBuoy },
    { name: 'Regional Compliance ✨', path: '/dashboard/tamil-nadu', icon: Sparkles },
    { name: 'MIS Dashboard', path: '/dashboard/mis', icon: LayoutDashboard },
    { name: 'Portal Accounts', path: '/dashboard/portal-accounts', icon: Users },
    { name: 'Student/Parent Portal', path: '/dashboard/portal', icon: GraduationCap },
  ];

  if (isPortalUser) {
    menuItems = [
      { name: 'My Portal', path: '/dashboard/portal', icon: GraduationCap },
    ];
  }

  const currentActiveName = menuItems.find((item) => item.path === location.pathname)?.name || 'School ERP';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#030712] flex font-sans text-slate-100 overflow-hidden relative">
      {/* Background Animated Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#030712]/80 backdrop-blur-md lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 glass-panel border-r border-white/5 flex flex-col justify-between transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 lg:static lg:z-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-20 px-6 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                style={{ backgroundColor: brandColor }}
              >
                {school?.name.charAt(0) || 'S'}
              </motion.div>
              <div>
                <h2 className="text-sm font-bold text-white truncate max-w-[150px]">{school?.name}</h2>
                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                  Code: {school?.code}
                </span>
              </div>
            </div>
            <button className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`relative flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group overflow-hidden ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-sidebar-pill"
                      className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full shadow-[0_0_10px_currentColor]"
                      style={{ backgroundColor: brandColor }}
                    />
                  )}
                  <Icon className={`w-4 h-4 z-10 transition-transform duration-300 ${isActive ? 'scale-110 glow-active' : 'group-hover:scale-110'}`} style={{ color: isActive ? brandColor : undefined }} />
                  <span className="truncate z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 shrink-0 bg-slate-900/30">
          <div className="p-3 rounded-2xl glass border border-white/5 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-xs text-sky-400 shadow-inner border border-white/5">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="truncate max-w-[120px]">
                <p className="text-xs font-bold text-white leading-tight">{user?.username}</p>
                <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase">{user?.role}</span>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 font-semibold rounded-xl flex items-center justify-center gap-2 border border-transparent hover:border-rose-500/20 transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className={`h-20 shrink-0 sticky top-0 z-30 transition-all duration-300 flex items-center justify-between px-6 lg:px-10 ${scrolled ? 'glass-panel border-b border-white/5 shadow-xl' : 'bg-transparent'}`}>
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-400">
              <span className="text-sky-400">{school?.name}</span>
              <ChevronRight className="w-3 h-3" />
              <h1 className="text-white font-bold">{currentActiveName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block group">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-64 pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all shadow-inner"
              />
            </div>

            <button className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all relative group">
              <Bell className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            </button>
          </div>
        </header>

        <main id="main-scroll-container" className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
