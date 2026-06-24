import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Users, 
  Search, 
  UserPlus, 
  Filter, 
  X,
  Loader,
  Briefcase,
  Trash2
} from 'lucide-react';

const HR = () => {
  const { school } = useStore();
  const brandColor = school?.themeColor || '#3b82f6';

  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'TEACHER' | 'HOD' | 'STAFF'>('TEACHER');

  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const token = localStorage.getItem('scl_token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/school/staff', { headers });
      const data = await res.json();
      if (data.success) {
        setStaff(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/school/staff/${id}`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
      });
      const data = await res.json();
      if (data.success) {
        loadStaff();
      } else {
        alert(data.message || 'Error deleting staff');
      }
    } catch (err) {
      alert('Error deleting staff');
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !firstName || !lastName || !employeeCode) {
      setFormError('Please fill in all required fields marked with *');
      return;
    }

    setFormError('');
    try {
      const res = await fetch('http://localhost:5000/api/school/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          password,
          email: email || undefined,
          firstName,
          lastName,
          employeeCode,
          designation: designation || undefined,
          department: department || undefined,
          phone: phone || undefined,
          role
        })
      });

      const data = await res.json();
      if (data.success) {
        setAdding(false);
        // Reset fields
        setUsername('');
        setPassword('');
        setEmail('');
        setFirstName('');
        setLastName('');
        setEmployeeCode('');
        setDesignation('');
        setDepartment('');
        setPhone('');
        loadStaff();
      } else {
        setFormError(data.message || 'Error creating staff profile');
      }
    } catch (err) {
      setFormError('Failed to connect to backend server');
    }
  };

  const filteredStaff = staff.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || s.employeeCode.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === '' || s.user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            Human Resources Management (HR)
          </h2>
          <p className="text-xs text-slate-500">Track and manage complete faculty, department, and administration profiles</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-semibold rounded-xl transition-all duration-300 transform active:scale-95 shadow-md shadow-sky-500/10"
          style={{ background: brandColor }}
        >
          <UserPlus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, employee code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-400/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-400/40"
          >
            <option value="">All Roles</option>
            <option value="TEACHER">Teachers</option>
            <option value="HOD">HODs</option>
            <option value="STAFF">Office Staff</option>
          </select>
        </div>
      </div>

      {/* Staff directory grid */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader className="w-8 h-8 text-sky-400 animate-spin" />
            <span className="text-xs">Accessing Employee Ledger...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <Briefcase className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold">No faculty members registered yet</p>
            <p className="text-xs text-slate-600 mt-1">Hire staff by utilizing the Add button above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Employee Profile</th>
                  <th className="px-6 py-4">Employee Code</th>
                  <th className="px-6 py-4">Role Key</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Contact Phone</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50 text-xs text-slate-300">
                {filteredStaff.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          {st.firstName.charAt(0)}{st.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{st.firstName} {st.lastName}</p>
                          <span className="text-[10px] text-slate-500">@{st.user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{st.employeeCode}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md font-semibold text-[10px]">
                        {st.user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{st.designation || 'N/A'}</td>
                    <td className="px-6 py-4">{st.department || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-400">{st.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(st.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Popup Modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="glass rounded-3xl w-full max-w-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  Register Staff / Faculty Member
                </h3>
                <p className="text-[11px] text-slate-500">Sets up a credentials portal for employees</p>
              </div>
              <button onClick={() => setAdding(false)} className="p-1 rounded-lg glass text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl p-3">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Auth Setup */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-900 pb-1">
                    System Identity
                  </h4>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Credentials Password *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Role / Privilege Map
                    </label>
                    <select
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="TEACHER">Teacher</option>
                      <option value="HOD">HOD</option>
                      <option value="STAFF">Office Staff</option>
                    </select>
                  </div>
                </div>

                {/* Profile details */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-900 pb-1">
                    Faculty details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Employee Code *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-01"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Designation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Science Teacher"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Academics"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    pattern="[0-9]{10}"
                    maxLength={10}
                    minLength={10}
                    title="10-digit Phone Number"
                    placeholder="10-digit Phone Number"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    pattern=".+@gmail\.com"
                    title="Must be a @gmail.com address"
                    placeholder="Email (@gmail.com)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-xs font-semibold rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white text-xs font-semibold rounded-xl shadow-md transition-all duration-300 transform active:scale-95"
                  style={{ background: brandColor }}
                >
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HR;
