import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  UserPlus, 
  X,
  Loader
} from 'lucide-react';

const SIS = () => {
  const { school } = useStore();
  const brandColor = school?.themeColor || '#3b82f6';

  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [classId, setClassId] = useState('');
  const [address, setAddress] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const token = localStorage.getItem('scl_token');

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load classes
      const clsRes = await fetch('http://localhost:5000/api/school/classes', { headers });
      const clsData = await clsRes.json();
      if (clsData.success) {
        setClasses(clsData.data);
      }

      // Load students
      const studRes = await fetch('http://localhost:5000/api/school/students', { headers });
      const studData = await studRes.json();
      if (studData.success) {
        setStudents(studData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !firstName || !lastName || !admissionNo || !dateOfBirth) {
      setFormError('Please fill in all required fields marked with *');
      return;
    }

    setFormError('');
    try {
      const res = await fetch('http://localhost:5000/api/school/students', {
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
          admissionNo,
          rollNo: rollNo || undefined,
          dateOfBirth,
          gender,
          address: address || undefined,
          guardianName: guardianName || undefined,
          guardianPhone: guardianPhone || undefined,
          classId: classId || undefined,
        })
      });

      const data = await res.json();
      if (data.success) {
        setAdding(false);
        // Clear fields
        setUsername('');
        setPassword('');
        setEmail('');
        setFirstName('');
        setLastName('');
        setAdmissionNo('');
        setRollNo('');
        setDateOfBirth('');
        setGuardianName('');
        setGuardianPhone('');
        setAddress('');
        // Reload list
        loadData();
      } else {
        setFormError(data.message || 'Error registering student');
      }
    } catch (err) {
      setFormError('Failed to connect to backend server');
    }
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || student.admissionNo.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === '' || student.classId === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-sky-400" />
            Student Information System (SIS)
          </h2>
          <p className="text-xs text-slate-500">Centralized database repository for student registration</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-semibold rounded-xl transition-all duration-300 transform active:scale-95 shadow-md shadow-sky-500/10"
          style={{ background: brandColor }}
        >
          <UserPlus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-400/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-400/40"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Grid/Table */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader className="w-8 h-8 text-sky-400 animate-spin" />
            <span className="text-xs">Accessing Student Vault...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <GraduationCap className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold">No students registered yet</p>
            <p className="text-xs text-slate-600 mt-1">Add students using the prompt button above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Student Profile</th>
                  <th className="px-6 py-4">Admission No</th>
                  <th className="px-6 py-4">Class Structure</th>
                  <th className="px-6 py-4">Date of Birth</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Guardian Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50 text-xs text-slate-300">
                {filteredStudents.map((stud) => (
                  <tr key={stud.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sky-400 font-bold text-xs">
                          {stud.firstName.charAt(0)}{stud.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{stud.firstName} {stud.lastName}</p>
                          <span className="text-[10px] text-slate-500">@{stud.user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{stud.admissionNo}</td>
                    <td className="px-6 py-4">
                      {stud.class ? (
                        <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-md font-semibold text-[10px]">
                          {stud.class.name} {stud.section ? `- ${stud.section.name}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-600">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{stud.dateOfBirth}</td>
                    <td className="px-6 py-4">{stud.gender}</td>
                    <td className="px-6 py-4 text-slate-400">
                      <p className="font-semibold text-slate-300">{stud.guardianName || 'N/A'}</p>
                      <span className="text-[10px] text-slate-500">{stud.guardianPhone || 'N/A'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Popup Modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="glass rounded-3xl w-full max-w-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-sky-400" />
                  Register New Student Profile
                </h3>
                <p className="text-[11px] text-slate-500">Sets up a credentials portal for student & parents</p>
              </div>
              <button onClick={() => setAdding(false)} className="p-1 rounded-lg glass text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl p-3">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Auth Setup */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest border-b border-slate-900 pb-1">
                    Credentials Keys
                  </h4>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-400/40"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Portal Password *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-400/40"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-400/40"
                    />
                  </div>
                </div>

                {/* Personal setup */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest border-b border-slate-900 pb-1">
                    Student Details
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Admission No *
                      </label>
                      <input
                        type="text"
                        value={admissionNo}
                        onChange={(e) => setAdmissionNo(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Roll No
                      </label>
                      <input
                        type="text"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        DOB *
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Class allocation & Guardian details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest border-b border-slate-900 pb-1">
                    Academic Mapping
                  </h4>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Assigned Classroom Room
                    </label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest border-b border-slate-900 pb-1">
                    Family Contact
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Guardian Name
                      </label>
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Guardian Phone
                      </label>
                      <input
                        type="text"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>
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
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SIS;
