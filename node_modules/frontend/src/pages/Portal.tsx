import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { BookOpen, Video, Award, CheckCircle2, PlayCircle, FileText, Calendar, GraduationCap, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const Portal = () => {
  const { user, school, token } = useStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/academic-ops/portal`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to fetch portal data');
        }
      } catch (err) {
        setError('Connection error');
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, [token]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium">Loading your portal...</div>;
  }

  if (error || !data?.student) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-10 bg-slate-800/80 border border-slate-700 rounded-2xl text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Portal Access Incomplete</h2>
        <p className="text-slate-400">{error || 'This account is not linked to any specific student profile. Please contact the administrator to link your account to a student.'}</p>
      </div>
    );
  }

  const { student, attendance, marks, homework, circulars, courses } = data;

  // Calculate overall attendance percentage
  const totalDays = attendance?.length || 0;
  const presentDays = attendance?.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length || 0;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // Recent marks
  const recentMarks = marks?.slice(0, 5) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 relative p-8 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-indigo-600 -z-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full" />
        
        <div className="flex flex-col md:flex-row justify-between items-center relative z-10 text-white">
          <div>
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
              Welcome, {student.firstName} {student.lastName}!
            </h1>
            <p className="text-sky-100 font-medium text-lg flex items-center gap-2">
              <GraduationCap /> My Portal • {school?.name}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4 bg-black/20 p-4 rounded-2xl backdrop-blur-md">
            <div>
              <p className="text-sky-200 text-sm font-semibold uppercase">Overall Attendance</p>
              <p className="text-3xl font-bold text-emerald-400">{attendancePercentage}%</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-emerald-400 flex items-center justify-center bg-emerald-400/20">
              <Calendar className="text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Academic Overview */}
        <div className="space-y-8">
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Award className="text-amber-400" /> Recent Performance
            </h2>
            <div className="space-y-4">
              {recentMarks.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No recent marks published.</p>
              ) : (
                recentMarks.map((mark: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                    <div>
                      <p className="text-white font-semibold">{mark.examSubject?.subject || 'Subject'}</p>
                      <p className="text-slate-400 text-sm">{mark.examSubject?.exam?.name || 'Assessment'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">{mark.marksObtained}/{mark.examSubject?.maxMarks}</p>
                      {mark.grade && <p className="text-amber-400 text-sm font-bold">Grade {mark.grade}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Middle & Right Column: LMS / Homework */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Homework & Assignments */}
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="text-sky-400" /> Homework & Assignments
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {homework?.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No assignments pending.</p>
              ) : (
                homework?.slice(0, 4).map((hw: any, i: number) => {
                  const submission = hw.submissions?.[0];
                  const isSubmitted = submission?.status === 'SUBMITTED' || submission?.status === 'GRADED';
                  
                  return (
                    <div key={i} className="p-5 bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-xl relative overflow-hidden group hover:border-sky-500/40 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-white">{hw.title}</h3>
                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${isSubmitted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {isSubmitted ? 'Submitted' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{hw.description}</p>
                      <div className="flex gap-4 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1"><Calendar size={14} /> Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* School Circulars / Announcements */}
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BookOpen className="text-indigo-400" /> Recent Circulars
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {circulars?.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No recent circulars.</p>
              ) : (
                circulars?.map((circ: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-400">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold group-hover:text-indigo-400 transition-colors">{circ.title}</h3>
                        <p className="text-slate-400 text-sm">Published {new Date(circ.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {circ.attachmentUrl && (
                      <button className="px-4 py-2 bg-slate-700 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors">
                        Download
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Third Row: LMS Course Materials */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Video className="text-pink-400" /> Course Materials & Videos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!courses || courses.length === 0 ? (
                <p className="text-slate-400 text-sm py-4 col-span-3 text-center">No video lessons assigned to this class yet.</p>
              ) : (
                courses.map((course: any, i: number) => (
                  <div key={i} className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden group">
                    <div className="p-5 border-b border-slate-700/50">
                      <h3 className="text-lg font-bold text-white truncate">{course.title}</h3>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2">{course.description || 'No description'}</p>
                    </div>
                    <div className="p-3 bg-slate-950 max-h-48 overflow-y-auto space-y-2">
                      {!course.lessons || course.lessons.length === 0 ? (
                        <p className="text-slate-500 text-xs text-center py-2 italic">No videos in this course.</p>
                      ) : (
                        course.lessons.map((lesson: any, j: number) => (
                          <a 
                            key={j} 
                            href={lesson.videoUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group/lesson"
                          >
                            <PlayCircle className="w-8 h-8 text-sky-500/70 group-hover/lesson:text-sky-400 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-slate-300 group-hover/lesson:text-white line-clamp-1">{lesson.title}</p>
                              {lesson.duration && <p className="text-[10px] text-slate-500">{lesson.duration} mins</p>}
                            </div>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Portal;
