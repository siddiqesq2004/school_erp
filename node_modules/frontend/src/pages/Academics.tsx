import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  BookOpen, 
  Plus, 
  Loader, 
  LayoutGrid
} from 'lucide-react';

const Academics = () => {
  const { school } = useStore();
  const brandColor = school?.themeColor || '#3b82f6';

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [targetClassId, setTargetClassId] = useState('');

  const [classError, setClassError] = useState('');
  const [sectionError, setSectionError] = useState('');

  const token = localStorage.getItem('scl_token');

  const loadAcademics = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:5000/api/school/classes', { headers });
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademics();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    setClassError('');
    try {
      const res = await fetch('http://localhost:5000/api/school/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: className.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setClassName('');
        loadAcademics();
      } else {
        setClassError(data.message || 'Error creating class');
      }
    } catch (err) {
      console.error('Create Class Error:', err);
      setClassError('Failed to connect to backend server');
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim() || !targetClassId) return;

    setSectionError('');
    try {
      const res = await fetch('http://localhost:5000/api/school/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ classId: targetClassId, name: sectionName.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setSectionName('');
        setTargetClassId('');
        loadAcademics();
      } else {
        setSectionError(data.message || 'Error creating section');
      }
    } catch (err) {
      console.error('Create Section Error:', err);
      setSectionError('Failed to connect to backend server');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          Academic Configurations Panel
        </h2>
        <p className="text-xs text-slate-500">Configure standard organizational classes and custom segment sections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Setup Forms */}
        <div className="space-y-6 lg:col-span-1">
          {/* Create Class Card */}
          <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              Establish Grade Class
            </h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              {classError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl p-3">
                  {classError}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Grade Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Class 10, LKG"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-400/40"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-white text-xs font-semibold rounded-xl transition-all duration-300 transform active:scale-95 shadow-md shadow-sky-500/10"
                style={{ background: brandColor }}
              >
                Create Grade Class
              </button>
            </form>
          </div>

          {/* Create Section Card */}
          <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Create Class Section
            </h3>
            <form onSubmit={handleCreateSection} className="space-y-4">
              {sectionError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl p-3">
                  {sectionError}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Parent Grade Class
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-400/40"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Section Segment Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Section A, B"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-400/40"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-white text-xs font-semibold rounded-xl transition-all duration-300 transform active:scale-95 shadow-md shadow-sky-500/10"
                style={{ background: brandColor }}
              >
                Assemble Section
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Visual Mapped Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-sky-400" />
                Active Class & Section Grid
              </h3>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                Total Classes: {classes.length}
              </span>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader className="w-8 h-8 text-sky-400 animate-spin" />
                <span className="text-xs">Fetching school configurations...</span>
              </div>
            ) : classes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20 text-center">
                <BookOpen className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-semibold">No classes configured yet</p>
                <p className="text-xs text-slate-600 mt-1">Configure classes and sections using the side forms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <div key={cls.id} className="glass bg-slate-900/20 p-5 rounded-2xl border border-slate-900 relative group overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 group-hover:h-full h-1/2" 
                      style={{ backgroundColor: brandColor }}
                    />
                    <h4 className="font-bold text-white mb-3 text-sm">{cls.name}</h4>
                    
                    {/* Section tags */}
                    <div className="flex flex-wrap gap-2">
                      {cls.sections.length === 0 ? (
                        <span className="text-[10px] text-slate-600 italic">No sections configured</span>
                      ) : (
                        cls.sections.map((sec: any) => (
                          <span 
                            key={sec.id}
                            className="px-2.5 py-1 bg-white/5 border border-white/10 hover:border-slate-800 text-[10px] rounded-lg font-semibold text-slate-300"
                          >
                            Sec {sec.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Academics;
