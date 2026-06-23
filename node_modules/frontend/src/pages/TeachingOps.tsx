import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { BookMarked, CalendarDays, Check, Edit3, Loader, Plus, Save, Square, CheckSquare, Trash2, X } from 'lucide-react';

const api = 'http://localhost:5000/api';
const today = new Date().toISOString().slice(0, 10);

const TeachingOps = () => {
  const { school } = useStore();
  const brandColor = school?.themeColor || '#3b82f6';
  const token = localStorage.getItem('scl_token');
  const headers = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  const [tab, setTab] = useState<'timetable' | 'lesson' | 'homework' | 'parents'>('timetable');
  const [classes, setClasses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [editingSlot, setEditingSlot] = useState<any>(null);

  const [generator, setGenerator] = useState({ classId: '', sectionId: '', periodsPerDay: 6, subjects: 'English:5\nMaths:5\nScience:4\nSocial:4\nTamil:5' });
  const [lesson, setLesson] = useState({ staffId: '', classId: '', subject: '', weekStart: today, objectives: '', activities: '', resources: '', status: 'SUBMITTED' });
  const [work, setWork] = useState({ staffId: '', classId: '', sectionId: '', subject: '', title: '', description: '', dueDate: today, status: 'PUBLISHED' });
  const [parent, setParent] = useState({ studentId: '', username: '', password: 'parent123', relation: 'Father', name: '', phone: '', email: '' });

  const selectedClass = useMemo(() => classes.find((item) => item.id === generator.classId), [classes, generator.classId]);
  const allSlotsSelected = slots.length > 0 && selectedSlotIds.length === slots.length;

  const loadData = async () => {
    setLoading(true);
    try {
      const [classRes, staffRes, studentRes, slotRes, planRes, homeworkRes] = await Promise.all([
        fetch(`${api}/school/classes`, { headers }),
        fetch(`${api}/school/staff`, { headers }),
        fetch(`${api}/school/students`, { headers }),
        fetch(`${api}/academic-ops/timetable`, { headers }),
        fetch(`${api}/academic-ops/lesson-plans`, { headers }),
        fetch(`${api}/academic-ops/homework`, { headers }),
      ]);
      const [classData, staffData, studentData, slotData, planData, homeworkData] = await Promise.all([classRes.json(), staffRes.json(), studentRes.json(), slotRes.json(), planRes.json(), homeworkRes.json()]);
      if (classData.success) {
        setClasses(classData.data);
        const first = classData.data[0]?.id || '';
        setGenerator((form) => ({ ...form, classId: form.classId || first }));
        setLesson((form) => ({ ...form, classId: form.classId || first }));
        setWork((form) => ({ ...form, classId: form.classId || first }));
      }
      if (staffData.success) {
        setStaff(staffData.data);
        const firstStaff = staffData.data[0]?.id || '';
        setLesson((form) => ({ ...form, staffId: form.staffId || firstStaff }));
        setWork((form) => ({ ...form, staffId: form.staffId || firstStaff }));
      }
      if (studentData.success) {
        setStudents(studentData.data);
        const firstStudent = studentData.data[0];
        if (firstStudent) setParent((form) => ({ ...form, studentId: form.studentId || firstStudent.id, username: form.username || `${firstStudent.admissionNo.toLowerCase()}-parent`, name: form.name || firstStudent.guardianName || '', phone: form.phone || firstStudent.guardianPhone || '' }));
      }
      if (slotData.success) {
        setSlots(slotData.data);
        setSelectedSlotIds((ids) => ids.filter((id) => slotData.data.some((slot: any) => slot.id === id)));
      }
      if (planData.success) setPlans(planData.data);
      if (homeworkData.success) setHomework(homeworkData.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submit = async (url: string, body: any, success: string, method = 'POST') => {
    setMessage('');
    const res = await fetch(`${api}${url}`, { method, headers: jsonHeaders, body: JSON.stringify(body) });
    const data = await res.json();
    setMessage(data.success ? data.message || success : data.message || 'Unable to save');
    if (data.success) loadData();
  };

  const generateTimetable = (event: React.FormEvent) => {
    event.preventDefault();
    const subjects = generator.subjects.split('\n').map((line) => {
      const [subject, periodsPerWeek] = line.split(':');
      return { subject: subject.trim(), periodsPerWeek: Number(periodsPerWeek || 1) };
    }).filter((item) => item.subject);
    submit('/academic-ops/timetable/generate', { classId: generator.classId, sectionId: generator.sectionId || undefined, periodsPerDay: generator.periodsPerDay, subjects }, 'Timetable generated');
  };

  const toggleSlot = (slotId: string) => {
    setSelectedSlotIds((ids) => ids.includes(slotId) ? ids.filter((id) => id !== slotId) : [...ids, slotId]);
  };

  const startEditSlot = (slot: any) => {
    setEditingSlot({
      id: slot.id,
      classId: slot.classId,
      sectionId: slot.sectionId || '',
      staffId: slot.staffId || '',
      dayOfWeek: slot.dayOfWeek,
      periodNo: slot.periodNo,
      subject: slot.subject,
      startTime: slot.startTime || '',
      endTime: slot.endTime || '',
      room: slot.room || '',
    });
  };

  const saveEditedSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingSlot) return;
    const { id, ...payload } = editingSlot;
    await submit(`/academic-ops/timetable/${id}`, { ...payload, sectionId: payload.sectionId || undefined, staffId: payload.staffId || undefined }, 'Timetable slot updated', 'PATCH');
    setEditingSlot(null);
  };

  const deleteSlots = async (ids: string[]) => {
    if (!ids.length) return;
    setMessage('');
    const res = await fetch(`${api}/academic-ops/timetable`, { method: 'DELETE', headers: jsonHeaders, body: JSON.stringify({ ids }) });
    const data = await res.json();
    setMessage(data.success ? data.message : data.message || 'Unable to delete timetable slots');
    if (data.success) {
      setSelectedSlotIds([]);
      setEditingSlot(null);
      loadData();
    }
  };

  if (loading) return <div className="py-24 flex justify-center text-slate-500"><Loader className="w-7 h-7 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><CalendarDays className="w-5 h-5 text-sky-400" /> Teaching Operations</h2>
        <p className="text-xs text-slate-500">Timetable generator, lesson plans, homework, and parent/student portal access</p>
      </div>
      {message && <div className="glass border border-sky-500/20 text-sky-300 text-xs rounded-xl p-3">{message}</div>}
      <div className="flex gap-2 border-b border-slate-900 pb-3 overflow-x-auto">{[['timetable', 'Timetable'], ['lesson', 'Lesson Plans'], ['homework', 'Homework'], ['parents', 'Parent Access']].map(([key, label]) => <button key={key} onClick={() => setTab(key as any)} className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${tab === key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{label}</button>)}</div>

      {tab === 'timetable' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <form onSubmit={generateTimetable} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-sky-400" /> Generate Weekly Timetable</h3>
            <select value={generator.classId} onChange={(event) => setGenerator({ ...generator, classId: event.target.value, sectionId: '' })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">{classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select>
            <select value={generator.sectionId} onChange={(event) => setGenerator({ ...generator, sectionId: event.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"><option value="">All Sections</option>{selectedClass?.sections?.map((section: any) => <option key={section.id} value={section.id}>{section.name}</option>)}</select>
            <input type="number" value={generator.periodsPerDay} onChange={(event) => setGenerator({ ...generator, periodsPerDay: Number(event.target.value) })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <textarea value={generator.subjects} onChange={(event) => setGenerator({ ...generator, subjects: event.target.value })} rows={7} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <button className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Generate</button>
          </form>
          {editingSlot && (
            <form onSubmit={saveEditedSlot} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Edit3 className="w-4 h-4 text-amber-400" /> Edit Slot</h3>
                <button type="button" onClick={() => setEditingSlot(null)} title="Cancel edit" className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={editingSlot.dayOfWeek} onChange={(event) => setEditingSlot({ ...editingSlot, dayOfWeek: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"><option>MONDAY</option><option>TUESDAY</option><option>WEDNESDAY</option><option>THURSDAY</option><option>FRIDAY</option><option>SATURDAY</option></select>
                <input type="number" value={editingSlot.periodNo} onChange={(event) => setEditingSlot({ ...editingSlot, periodNo: Number(event.target.value) })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
              </div>
              <select value={editingSlot.classId} onChange={(event) => setEditingSlot({ ...editingSlot, classId: event.target.value, sectionId: '' })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">{classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select>
              <select value={editingSlot.sectionId} onChange={(event) => setEditingSlot({ ...editingSlot, sectionId: event.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"><option value="">All Sections</option>{classes.find((cls) => cls.id === editingSlot.classId)?.sections?.map((section: any) => <option key={section.id} value={section.id}>{section.name}</option>)}</select>
              <input value={editingSlot.subject} onChange={(event) => setEditingSlot({ ...editingSlot, subject: event.target.value })} placeholder="Subject" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
              <select value={editingSlot.staffId} onChange={(event) => setEditingSlot({ ...editingSlot, staffId: event.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"><option value="">No teacher</option>{staff.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select>
              <div className="grid grid-cols-3 gap-3">
                <input value={editingSlot.startTime} onChange={(event) => setEditingSlot({ ...editingSlot, startTime: event.target.value })} placeholder="Start" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
                <input value={editingSlot.endTime} onChange={(event) => setEditingSlot({ ...editingSlot, endTime: event.target.value })} placeholder="End" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
                <input value={editingSlot.room} onChange={(event) => setEditingSlot({ ...editingSlot, room: event.target.value })} placeholder="Room" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
              </div>
              <button className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2" style={{ background: brandColor }}><Save className="w-4 h-4" /> Save Changes</button>
            </form>
          )}
          <div className="xl:col-span-2 glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-slate-900 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSelectedSlotIds(allSlotsSelected ? [] : slots.map((slot) => slot.id))} className="px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center gap-2">{allSlotsSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />} {allSlotsSelected ? 'Clear All' : 'Select All'}</button>
                <button type="button" onClick={() => deleteSlots(selectedSlotIds)} disabled={!selectedSlotIds.length} className="px-3 py-2 rounded-lg border border-rose-500/20 text-xs text-rose-400 disabled:opacity-40 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete Selected</button>
                <button type="button" onClick={() => deleteSlots(slots.map((slot) => slot.id))} disabled={!slots.length} className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 disabled:opacity-40 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete All</button>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">{selectedSlotIds.length} selected</span>
            </div>
            <table className="w-full text-left text-xs"><thead className="text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Select</th><th className="px-5 py-3">Day</th><th className="px-5 py-3">Period</th><th className="px-5 py-3">Class</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Teacher</th><th className="px-5 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-900/60">{slots.map((slot) => <tr key={slot.id} className={editingSlot?.id === slot.id ? 'bg-sky-500/5' : ''}><td className="px-5 py-3"><button type="button" onClick={() => toggleSlot(slot.id)} title="Select row" className="text-slate-400 hover:text-sky-300">{selectedSlotIds.includes(slot.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}</button></td><td className="px-5 py-3 text-white">{slot.dayOfWeek}</td><td className="px-5 py-3">{slot.periodNo}</td><td className="px-5 py-3">{slot.class.name} {slot.section?.name || ''}</td><td className="px-5 py-3 text-sky-300">{slot.subject}</td><td className="px-5 py-3">{slot.staff ? `${slot.staff.firstName} ${slot.staff.lastName}` : '-'}</td><td className="px-5 py-3"><div className="flex gap-2"><button type="button" onClick={() => startEditSlot(slot)} title="Edit slot" className="p-2 rounded-lg border border-amber-500/20 text-amber-400 hover:bg-amber-500/10"><Edit3 className="w-4 h-4" /></button><button type="button" onClick={() => deleteSlots([slot.id])} title="Delete slot" className="p-2 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button></div></td></tr>)}</tbody></table>
          </div>
        </div>
      )}

      {tab === 'lesson' && (
        <div className="space-y-6">
          <form onSubmit={(event) => { event.preventDefault(); submit('/academic-ops/lesson-plans', lesson, 'Lesson plan saved'); }} className="glass p-5 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={lesson.staffId} onChange={(event) => setLesson({ ...lesson, staffId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">{staff.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select>
            <select value={lesson.classId} onChange={(event) => setLesson({ ...lesson, classId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">{classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select>
            <input value={lesson.subject} onChange={(event) => setLesson({ ...lesson, subject: event.target.value })} placeholder="Subject" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <input type="date" value={lesson.weekStart} onChange={(event) => setLesson({ ...lesson, weekStart: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <input value={lesson.objectives} onChange={(event) => setLesson({ ...lesson, objectives: event.target.value })} placeholder="Learning objectives" className="md:col-span-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <textarea value={lesson.activities} onChange={(event) => setLesson({ ...lesson, activities: event.target.value })} placeholder="Class activities" className="md:col-span-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <button className="rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Save Plan</button>
          </form>
          <div className="glass rounded-2xl border border-white/5 overflow-hidden"><table className="w-full text-left text-xs"><thead className="text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Week</th><th className="px-5 py-3">Class</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Teacher</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-900/60">{plans.map((plan) => <tr key={plan.id}><td className="px-5 py-3 text-white">{plan.weekStart}</td><td className="px-5 py-3">{plan.class.name}</td><td className="px-5 py-3 text-sky-300">{plan.subject}</td><td className="px-5 py-3">{plan.staff.firstName} {plan.staff.lastName}</td><td className="px-5 py-3">{plan.status}</td><td className="px-5 py-3">{plan.status !== 'APPROVED' && <button onClick={() => submit(`/academic-ops/lesson-plans/${plan.id}`, { status: 'APPROVED' }, 'Lesson approved', 'PATCH')} title="Approve" className="p-2 rounded-lg border border-emerald-500/20 text-emerald-400"><Check className="w-4 h-4" /></button>}</td></tr>)}</tbody></table></div>
        </div>
      )}

      {tab === 'homework' && (
        <div className="space-y-6">
          <form onSubmit={(event) => { event.preventDefault(); submit('/academic-ops/homework', work, 'Homework assigned'); }} className="glass p-5 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-3">
            <select value={work.staffId} onChange={(event) => setWork({ ...work, staffId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">{staff.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select>
            <select value={work.classId} onChange={(event) => setWork({ ...work, classId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">{classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select>
            <input value={work.subject} onChange={(event) => setWork({ ...work, subject: event.target.value })} placeholder="Subject" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <input type="date" value={work.dueDate} onChange={(event) => setWork({ ...work, dueDate: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <input value={work.title} onChange={(event) => setWork({ ...work, title: event.target.value })} placeholder="Homework title" className="md:col-span-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <input value={work.description} onChange={(event) => setWork({ ...work, description: event.target.value })} placeholder="Instructions" className="md:col-span-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <button className="rounded-xl py-2.5 text-xs font-semibold text-white" style={{ background: brandColor }}>Assign Homework</button>
          </form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{homework.map((item) => <div key={item.id} className="glass p-5 rounded-2xl border border-white/5"><div className="flex justify-between gap-3"><div><h3 className="text-sm font-bold text-white">{item.title}</h3><p className="text-xs text-slate-500">{item.class.name} - {item.subject} - Due {item.dueDate}</p></div><span className="text-xs text-sky-300">{item.submissions.filter((sub: any) => sub.status !== 'PENDING').length}/{item.submissions.length}</span></div><p className="text-xs text-slate-300 mt-3">{item.description}</p></div>)}</div>
        </div>
      )}

      {tab === 'parents' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form onSubmit={(event) => { event.preventDefault(); submit('/academic-ops/parents', parent, 'Parent login created'); }} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><BookMarked className="w-4 h-4 text-indigo-400" /> Create Parent Portal Access</h3>
            <select value={parent.studentId} onChange={(event) => { const student = students.find((item) => item.id === event.target.value); setParent({ ...parent, studentId: event.target.value, username: `${student?.admissionNo?.toLowerCase() || 'parent'}-parent`, name: student?.guardianName || '', phone: student?.guardianPhone || '' }); }} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">{students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName} - {student.admissionNo}</option>)}</select>
            <div className="grid grid-cols-2 gap-3"><input value={parent.username} onChange={(event) => setParent({ ...parent, username: event.target.value })} placeholder="Username" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" /><input value={parent.password} onChange={(event) => setParent({ ...parent, password: event.target.value })} placeholder="Password" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" /></div>
            <div className="grid grid-cols-2 gap-3"><input value={parent.name} onChange={(event) => setParent({ ...parent, name: event.target.value })} placeholder="Parent name" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" /><input value={parent.phone} onChange={(event) => setParent({ ...parent, phone: event.target.value })} placeholder="Phone" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" /></div>
            <button className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2" style={{ background: brandColor }}><Save className="w-4 h-4" /> Create Login</button>
          </form>
          <div className="glass p-5 rounded-2xl border border-white/5"><h3 className="text-sm font-bold text-white mb-3">Portal Data Now Available</h3><p className="text-xs text-slate-400 leading-6">Student and parent logins can access timetable, homework, attendance, fee ledger, circulars, and exam marks through the `/api/academic-ops/portal` endpoint. This is the backend foundation for the future mobile app.</p></div>
        </div>
      )}
    </div>
  );
};

export default TeachingOps;
