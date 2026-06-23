import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { CalendarCheck, ClipboardCheck, Loader, Save, Users } from 'lucide-react';

const api = 'http://localhost:5000/api';
const statuses = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'];
const staffStatuses = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'];

const today = new Date().toISOString().slice(0, 10);

const Attendance = () => {
  const { school } = useStore();
  const brandColor = school?.themeColor || '#3b82f6';
  const token = localStorage.getItem('scl_token');
  const headers = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(today);
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const month = Number(date.slice(5, 7));
  const year = Number(date.slice(0, 4));

  const loadClasses = async () => {
    const res = await fetch(`${api}/school/classes`, { headers });
    const data = await res.json();
    if (data.success) {
      setClasses(data.data);
      if (!classId && data.data[0]) setClassId(data.data[0].id);
    }
  };

  const loadStudentAttendance = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const [attendanceRes, reportRes] = await Promise.all([
        fetch(`${api}/attendance/students?classId=${classId}&date=${date}`, { headers }),
        fetch(`${api}/attendance/reports/monthly?classId=${classId}&month=${month}&year=${year}`, { headers }),
      ]);
      const attendanceData = await attendanceRes.json();
      const reportData = await reportRes.json();
      if (attendanceData.success) setStudents(attendanceData.data.map((row: any) => ({ ...row, status: row.status || 'PRESENT' })));
      if (reportData.success) setReport(reportData.data);
    } finally {
      setLoading(false);
    }
  };

  const loadStaffAttendance = async () => {
    const res = await fetch(`${api}/attendance/staff?date=${date}`, { headers });
    const data = await res.json();
    if (data.success) setStaff(data.data.map((row: any) => ({ ...row, status: row.status || 'PRESENT' })));
  };

  useEffect(() => {
    loadClasses();
    loadStaffAttendance();
  }, []);

  useEffect(() => {
    loadStudentAttendance();
    loadStaffAttendance();
  }, [classId, date]);

  const totals = useMemo(() => {
    const present = students.filter((student) => ['PRESENT', 'LATE'].includes(student.status)).length;
    const absent = students.filter((student) => student.status === 'ABSENT').length;
    return { present, absent, total: students.length };
  }, [students]);

  const saveStudents = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${api}/attendance/students`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          classId,
          date,
          records: students.map((student) => ({ studentId: student.studentId, status: student.status, remarks: student.remarks || '' })),
        }),
      });
      const data = await res.json();
      setMessage(data.success ? data.message : data.message || 'Unable to save student attendance');
      if (data.success) loadStudentAttendance();
    } finally {
      setSaving(false);
    }
  };

  const saveStaff = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${api}/attendance/staff`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          date,
          records: staff.map((member) => ({
            staffId: member.staffId,
            status: member.status,
            checkIn: member.checkIn || '',
            checkOut: member.checkOut || '',
          })),
        }),
      });
      const data = await res.json();
      setMessage(data.success ? data.message : data.message || 'Unable to save staff attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            Attendance Management
          </h2>
          <p className="text-xs text-slate-500">Student and staff daily tracking with monthly reports</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={classId} onChange={(event) => setClassId(event.target.value)} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
            {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
          </select>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
        </div>
      </div>

      {message && <div className="glass border border-sky-500/20 text-sky-300 text-xs rounded-xl p-3">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['Students', totals.total, 'text-sky-400'],
          ['Present / Late', totals.present, 'text-emerald-400'],
          ['Absent', totals.absent, 'text-rose-400'],
        ].map(([label, value, color]) => (
          <div key={label as string} className="glass p-5 rounded-2xl border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</p>
            <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-slate-900 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-emerald-400" /> Student Day Register</h3>
          <button onClick={saveStudents} disabled={saving || !students.length} className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 disabled:opacity-50" style={{ background: brandColor }}>
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
        {loading ? (
          <div className="py-16 flex justify-center text-slate-500"><Loader className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/20 text-slate-500 uppercase text-[10px]">
                <tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Admission</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Remarks</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {students.map((student, index) => (
                  <tr key={student.studentId}>
                    <td className="px-5 py-3 text-white font-semibold">{student.firstName} {student.lastName}<span className="ml-2 text-slate-500">{student.section}</span></td>
                    <td className="px-5 py-3 text-slate-400 font-mono">{student.admissionNo}</td>
                    <td className="px-5 py-3">
                      <select value={student.status} onChange={(event) => setStudents((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, status: event.target.value } : row))} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200">
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3"><input value={student.remarks || ''} onChange={(event) => setStudents((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, remarks: event.target.value } : row))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-slate-900">
            <h3 className="text-sm font-bold text-white">Monthly Student Report</h3>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">P</th><th className="px-5 py-3">A</th><th className="px-5 py-3">%</th></tr></thead>
              <tbody className="divide-y divide-slate-900/60">
                {report.map((row) => <tr key={row.studentId}><td className="px-5 py-3 text-white">{row.firstName} {row.lastName}</td><td className="px-5 py-3 text-emerald-400">{row.present}</td><td className="px-5 py-3 text-rose-400">{row.absent}</td><td className="px-5 py-3 text-slate-300">{row.percentage}%</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-slate-900 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> Staff Attendance</h3>
            <button onClick={saveStaff} disabled={saving || !staff.length} className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50" style={{ background: brandColor }}>Save Staff</button>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Staff</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">In</th><th className="px-5 py-3">Out</th></tr></thead>
              <tbody className="divide-y divide-slate-900/60">
                {staff.map((member, index) => <tr key={member.staffId}><td className="px-5 py-3 text-white">{member.firstName} {member.lastName}</td><td className="px-5 py-3"><select value={member.status} onChange={(event) => setStaff((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, status: event.target.value } : row))} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200">{staffStatuses.map((status) => <option key={status}>{status}</option>)}</select></td><td className="px-5 py-3"><input value={member.checkIn || ''} onChange={(event) => setStaff((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, checkIn: event.target.value } : row))} className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300" placeholder="09:00" /></td><td className="px-5 py-3"><input value={member.checkOut || ''} onChange={(event) => setStaff((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, checkOut: event.target.value } : row))} className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300" placeholder="16:00" /></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
