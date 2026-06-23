import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { BarChart3, FileSpreadsheet, Loader, Plus, Save } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const api = 'http://localhost:5000/api';

const Exams = () => {
  const { school } = useStore();
  const brandColor = school?.themeColor || '#3b82f6';
  const token = localStorage.getItem('scl_token');
  const headers = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [marksGrid, setMarksGrid] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [examForm, setExamForm] = useState({ name: '', type: 'UNIT_TEST', startDate: '', endDate: '' });
  const [subjectForm, setSubjectForm] = useState({ examId: '', classId: '', subjectName: '', maxMarks: 100, passMarks: 35, examDate: '' });

  const selectedSubject = useMemo(() => exams.flatMap((exam) => exam.subjects.map((subject: any) => ({ ...subject, examName: exam.name, examId: exam.id }))).find((subject) => subject.id === selectedSubjectId), [exams, selectedSubjectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classRes, examRes] = await Promise.all([
        fetch(`${api}/school/classes`, { headers }),
        fetch(`${api}/exams`, { headers }),
      ]);
      const classData = await classRes.json();
      const examData = await examRes.json();
      if (classData.success) setClasses(classData.data);
      if (examData.success) {
        setExams(examData.data);
        if (!subjectForm.examId && examData.data[0]) setSubjectForm((form) => ({ ...form, examId: examData.data[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMarksGrid = async (subjectId: string) => {
    if (!subjectId) return;
    const res = await fetch(`${api}/exams/subjects/${subjectId}/marks`, { headers });
    const data = await res.json();
    if (data.success) setMarksGrid(data.data.rows);
  };

  const loadAnalysis = async (examId: string) => {
    if (!examId) return;
    const res = await fetch(`${api}/exams/analysis?examId=${examId}`, { headers });
    const data = await res.json();
    if (data.success) setAnalysis(data.data.subjectAnalysis);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMarksGrid(selectedSubjectId);
    if (selectedSubject?.examId) loadAnalysis(selectedSubject.examId);
  }, [selectedSubjectId]);

  const createExam = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const res = await fetch(`${api}/exams`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(examForm) });
    const data = await res.json();
    setMessage(data.success ? 'Exam created' : data.message || 'Unable to create exam');
    if (data.success) {
      setExamForm({ name: '', type: 'UNIT_TEST', startDate: '', endDate: '' });
      loadData();
    }
  };

  const createSubject = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const res = await fetch(`${api}/exams/subjects`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(subjectForm) });
    const data = await res.json();
    setMessage(data.success ? 'Subject schedule added' : data.message || 'Unable to create subject');
    if (data.success) {
      setSubjectForm((form) => ({ ...form, subjectName: '', examDate: '' }));
      setSelectedSubjectId(data.data.id);
      loadData();
    }
  };

  const saveMarks = async () => {
    if (!selectedSubjectId) return;
    setMessage('');
    const res = await fetch(`${api}/exams/marks`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        examSubjectId: selectedSubjectId,
        records: marksGrid.map((row) => ({
          studentId: row.studentId,
          isAbsent: row.isAbsent,
          marksObtained: row.isAbsent || row.marksObtained === '' ? null : Number(row.marksObtained),
          remarks: row.remarks || '',
        })),
      }),
    });
    const data = await res.json();
    setMessage(data.success ? data.message : data.message || 'Unable to save marks');
    if (data.success) {
      loadMarksGrid(selectedSubjectId);
      if (selectedSubject?.examId) loadAnalysis(selectedSubject.examId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-amber-400" />
          Examination & Assessment
        </h2>
        <p className="text-xs text-slate-500">Exam scheduling, marks entry, result analysis, and report card data</p>
      </div>

      {message && <div className="glass border border-amber-500/20 text-amber-300 text-xs rounded-xl p-3">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={createExam} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-amber-400" /> Create Exam</h3>
          <input value={examForm.name} onChange={(event) => setExamForm({ ...examForm, name: event.target.value })} placeholder="Quarterly Exam" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <select value={examForm.type} onChange={(event) => setExamForm({ ...examForm, type: event.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
            <option value="UNIT_TEST">Unit Test</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="HALF_YEARLY">Half-Yearly</option>
            <option value="ANNUAL">Annual</option>
            <option value="BOARD_PRACTICAL">Board Practical</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={examForm.startDate} onChange={(event) => setExamForm({ ...examForm, startDate: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <input type="date" value={examForm.endDate} onChange={(event) => setExamForm({ ...examForm, endDate: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          </div>
          <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Create Exam</button>
        </form>

        <form onSubmit={createSubject} className="glass p-5 rounded-2xl border border-white/5 space-y-4 xl:col-span-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-sky-400" /> Schedule Subject</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={subjectForm.examId} onChange={(event) => setSubjectForm({ ...subjectForm, examId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required>
              <option value="">Select Exam</option>
              {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
            </select>
            <select value={subjectForm.classId} onChange={(event) => setSubjectForm({ ...subjectForm, classId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required>
              <option value="">Select Class</option>
              {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
            <input value={subjectForm.subjectName} onChange={(event) => setSubjectForm({ ...subjectForm, subjectName: event.target.value })} placeholder="Mathematics" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="number" value={subjectForm.maxMarks} onChange={(event) => setSubjectForm({ ...subjectForm, maxMarks: Number(event.target.value) })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <input type="number" value={subjectForm.passMarks} onChange={(event) => setSubjectForm({ ...subjectForm, passMarks: Number(event.target.value) })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <input type="date" value={subjectForm.examDate} onChange={(event) => setSubjectForm({ ...subjectForm, examDate: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
            <button className="rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Add Subject</button>
          </div>
        </form>
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">Marks Entry Grid</h3>
          <select value={selectedSubjectId} onChange={(event) => setSelectedSubjectId(event.target.value)} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
            <option value="">Select subject</option>
            {exams.map((exam) => exam.subjects.map((subject: any) => <option key={subject.id} value={subject.id}>{exam.name} - {subject.class.name} - {subject.subjectName}</option>))}
          </select>
        </div>
        {loading ? <div className="py-16 flex justify-center text-slate-500"><Loader className="w-6 h-6 animate-spin" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/20 text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Admission</th><th className="px-5 py-3">Marks</th><th className="px-5 py-3">Absent</th><th className="px-5 py-3">Grade</th><th className="px-5 py-3">Remarks</th></tr></thead>
              <tbody className="divide-y divide-slate-900/60">
                {marksGrid.map((row, index) => <tr key={row.studentId}><td className="px-5 py-3 text-white font-semibold">{row.firstName} {row.lastName}<span className="ml-2 text-slate-500">{row.section}</span></td><td className="px-5 py-3 text-slate-400 font-mono">{row.admissionNo}</td><td className="px-5 py-3"><input type="number" disabled={row.isAbsent} value={row.marksObtained} onChange={(event) => setMarksGrid((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, marksObtained: event.target.value } : item))} className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 disabled:opacity-40" /></td><td className="px-5 py-3"><input type="checkbox" checked={row.isAbsent} onChange={(event) => setMarksGrid((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, isAbsent: event.target.checked } : item))} /></td><td className="px-5 py-3 text-amber-300">{row.grade || '-'}</td><td className="px-5 py-3"><input value={row.remarks || ''} onChange={(event) => setMarksGrid((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, remarks: event.target.value } : item))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300" /></td></tr>)}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-slate-900 flex justify-end">
          <button onClick={saveMarks} disabled={!selectedSubjectId || !marksGrid.length} className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 disabled:opacity-50" style={{ background: brandColor }}><Save className="w-4 h-4" /> Save Marks</button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/5 p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-5"><BarChart3 className="w-4 h-4 text-emerald-400" /> Result Analysis</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="subjectName" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 8 }} />
              <Bar dataKey="average" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="passPercentage" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Exams;
