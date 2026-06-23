import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { UserPlus, Shield, Key, Mail, CheckCircle2, AlertCircle, Trash2, Users } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const PortalAccounts = () => {
  const { token, school } = useStore();
  const headers = { Authorization: `Bearer ${token}` };

  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    role: 'STUDENT',
    studentId: '',
  });
  
  const [users, setUsers] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/portal-users`, { headers });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/school/students`, { headers });
      const json = await res.json();
      if (json.success) {
        setStudentsList(json.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStudents();
  }, []);

  const createAccount = async () => {
    if (!form.username || !form.password || !form.studentId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/create-portal-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message, 'success');
        setForm({ username: '', password: '', email: '', role: 'STUDENT', studentId: '' });
        fetchUsers();
      } else {
        showToast(json.message || 'Error creating account', 'error');
      }
    } catch (err) {
      showToast('Connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/portal-user/${id}`, {
        method: 'DELETE',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message, 'success');
        fetchUsers();
      } else {
        showToast(json.message || 'Error deleting account', 'error');
      }
    } catch (err) {
      showToast('Connection failed', 'error');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 blur-3xl -z-10 rounded-full" />
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 flex items-center gap-3">
          <Users className="text-sky-400" size={32} /> Portal Accounts
        </h1>
        <p className="text-slate-400 text-sm mt-2 font-medium">
          Create and manage login credentials for Students and Parents.
        </p>
      </div>

      {toast && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Account Form */}
        <div className="lg:col-span-1 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl h-fit">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <UserPlus size={20} className="text-sky-400" /> New Account
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Link to Student</label>
              <select
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="">-- Select Student --</option>
                {studentsList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.firstName} {st.lastName} (Roll: {st.rollNo || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserPlus className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. john_doe"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Secure password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={createAccount}
              disabled={!form.username || !form.password || !form.studentId || loading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating...' : 'Create Account'} <Shield size={18} />
            </button>
          </div>
        </div>

        {/* Existing Accounts List */}
        <div className="lg:col-span-2 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users size={20} className="text-emerald-400" /> Existing Accounts
            </h2>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students Only</option>
              <option value="PARENT">Parents Only</option>
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.filter(u => roleFilter === 'ALL' || u.role === roleFilter).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No portal accounts found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  users.filter(u => roleFilter === 'ALL' || u.role === roleFilter).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">{u.username}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          u.role === 'STUDENT' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-sm">{u.email || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteAccount(u.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PortalAccounts;
