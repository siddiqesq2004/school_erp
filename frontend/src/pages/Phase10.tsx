import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  Video, 
  HelpCircle, 
  Home as HomeIcon, 
  Coffee, 
  Trophy, 
  Heart, 
  Plus, 
  Users, 
  Calendar, 
  CheckCircle2, 
  ShoppingCart, 
  Trash2, 
  Printer, 
  Search, 
  Activity, 
  UserCheck,
  PlusCircle
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const Phase10 = () => {
  const token = useStore((s) => s.token);
  const school = useStore((s) => s.school);
  const brandColor = school?.themeColor || '#3b82f6';
  
  const [activeTab, setActiveTab] = useState<'lms' | 'hostel' | 'canteen' | 'sports' | 'health'>('lms');
  
  // Data States
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [hostels, setHostels] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [medicalVisits, setMedicalVisits] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Selection & UI States
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedHostel, setSelectedHostel] = useState<any>(null);
  
  // Cart State (Canteen POS)
  const [cart, setCart] = useState<Array<{ item: any; qty: number }>>([]);
  const [selectedCartStudent, setSelectedCartStudent] = useState<string>('');
  const [latestReceipt, setLatestReceipt] = useState<any>(null);
  
  // Feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(true);

  // Search Filter
  const [healthSearch, setHealthSearch] = useState('');

  // Form Field States
  // Course
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseClassId, setCourseClassId] = useState('');
  // Lesson
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonUrl, setLessonUrl] = useState('');
  const [lessonDur, setLessonDur] = useState('');
  // Quiz
  const [quizTitle, setQuizTitle] = useState('');
  // Quiz Question
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionOpts, setQuestionOpts] = useState('');
  const [questionAns, setQuestionAns] = useState('');
  // Hostel
  const [hostelName, setHostelName] = useState('');
  const [hostelAddress, setHostelAddress] = useState('');
  // Room
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [roomCap, setRoomCap] = useState('4');
  // Allocate Hostel
  const [allocRoomId, setAllocRoomId] = useState('');
  const [allocStudentId, setAllocStudentId] = useState('');
  const [allocFrom, setAllocFrom] = useState('');
  // Menu Item
  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  // Sport
  const [sportName, setSportName] = useState('');
  // Team
  const [teamSportId, setTeamSportId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  // Match
  const [matchSportId, setMatchSportId] = useState('');
  const [matchTeamA, setMatchTeamA] = useState('');
  const [matchTeamB, setMatchTeamB] = useState('');
  const [matchDate, setMatchDate] = useState('');
  // Health Record
  const [healthStudentId, setHealthStudentId] = useState('');
  const [healthAllergies, setHealthAllergies] = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  // Medical Visit
  const [visitStudentId, setVisitStudentId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitDiagnosis, setVisitDiagnosis] = useState('');
  const [visitPrescription, setVisitPrescription] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [
        coursesRes,
        lessonsRes,
        quizzesRes,
        hostelsRes,
        menuRes,
        ordersRes,
        sportsRes,
        teamsRes,
        matchesRes,
        healthRes,
        visitsRes,
        studentsRes,
        classesRes
      ] = await Promise.all([
        fetch(`${API_BASE}/api/phase10/courses`, { headers }),
        fetch(`${API_BASE}/api/phase10/lessons`, { headers }),
        fetch(`${API_BASE}/api/phase10/quizzes`, { headers }),
        fetch(`${API_BASE}/api/phase10/hostels`, { headers }),
        fetch(`${API_BASE}/api/phase10/menu`, { headers }),
        fetch(`${API_BASE}/api/phase10/orders`, { headers }),
        fetch(`${API_BASE}/api/phase10/sports`, { headers }),
        fetch(`${API_BASE}/api/phase10/teams`, { headers }),
        fetch(`${API_BASE}/api/phase10/matches`, { headers }),
        fetch(`${API_BASE}/api/phase10/health-records`, { headers }),
        fetch(`${API_BASE}/api/phase10/medical-visits`, { headers }),
        fetch(`${API_BASE}/api/school/students`, { headers }),
        fetch(`${API_BASE}/api/school/classes`, { headers }),
      ]);

      const cData = await coursesRes.json();
      const lData = await lessonsRes.json();
      const qData = await quizzesRes.json();
      const hData = await hostelsRes.json();
      const mData = await menuRes.json();
      const oData = await ordersRes.json();
      const sData = await sportsRes.json();
      const tData = await teamsRes.json();
      const maData = await matchesRes.json();
      const heData = await healthRes.json();
      const vData = await visitsRes.json();
      const stData = await studentsRes.json();
      const clData = await classesRes.json();

      setCourses(cData.data || []);
      setLessons(lData.data || []);
      setQuizzes(qData.data || []);
      setHostels(hData.data || []);
      setMenuItems(mData.data || []);
      setOrders(oData.data || []);
      setSports(sData.data || []);
      setTeams(tData.data || []);
      setMatches(maData.data || []);
      setHealthRecords(heData.data || []);
      setMedicalVisits(vData.data || []);
      setStudents(stData.data || []);
      setClasses(clData.data || []);

      if (cData.data && cData.data.length > 0 && !selectedCourse) {
        setSelectedCourse(cData.data[0]);
      }
      if (hData.data && hData.data.length > 0 && !selectedHostel) {
        setSelectedHostel(hData.data[0]);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading Campus Services data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  // POS CART ACTIONS
  const addToCart = (item: any) => {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.item.id === item.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].qty += 1;
        return copy;
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateCartQty = (itemId: string, change: number) => {
    setCart((prev) => {
      return prev.map((x) => {
        if (x.item.id === itemId) {
          const nQty = x.qty + change;
          return { ...x, qty: nQty > 0 ? nQty : 1 };
        }
        return x;
      }).filter((x) => x.qty > 0);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((x) => x.item.id !== itemId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return showToast('Cart is empty', 'error');
    const student = students.find((s) => s.id === selectedCartStudent);

    try {
      const res = await fetch(`${API_BASE}/api/phase10/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          studentId: selectedCartStudent || undefined,
          items: cart.map((c) => ({ itemId: c.item.id, qty: c.qty }))
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast('POS Order created successfully!', 'success');
        confetti({ particleCount: 100, spread: 60 });
        
        // Generate a beautiful mock print receipt object
        const receiptData = {
          invoiceId: `INV-${json.data.id.slice(0, 8).toUpperCase()}`,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Guest Visitor',
          admissionNo: student ? student.admissionNo : 'N/A',
          items: cart.map((c) => ({ name: c.item.name, qty: c.qty, price: c.item.price, sub: c.item.price * c.qty })),
          subtotal: json.data.total,
          tax: (json.data.total * 0.05).toFixed(2),
          total: (json.data.total * 1.05).toFixed(2),
          date: new Date().toLocaleString()
        };
        setLatestReceipt(receiptData);
        setCart([]);
        loadAllData();
      } else {
        showToast(json.message || 'Checkout failed', 'error');
      }
    } catch (err) {
      showToast('Connection failed', 'error');
    }
  };

  // LMS QUIZ PLAYER
  const selectQuizOption = (questionId: string, value: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitQuizAnswers = () => {
    if (!activeQuiz) return;
    let score = 0;
    activeQuiz.questions.forEach((q: any) => {
      const selected = quizAnswers[q.id];
      if (selected === q.answer) {
        score += 1;
      }
    });
    setQuizScore(score);
    confetti({ particleCount: 150, spread: 80, colors: ['#a78bfa', '#ec4899', '#3b82f6'] });
    showToast(`Quiz completed! Score: ${score}/${activeQuiz.questions.length}`, 'success');
  };

  // SUBMIT HANDLERS
  // ===================== API SUBMISSIONS =====================

  const handleCreateCourse = async () => {
    if (!courseTitle) return showToast('Course title required', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/courses`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: courseTitle, description: courseDesc, classId: courseClassId || undefined })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Course Created');
        setCourses([data.data, ...courses]);
        setCourseTitle('');
        setCourseDesc('');
        setCourseClassId('');
        if (!selectedCourse) setSelectedCourse(data.data);
      } else showToast(data.message, 'error');
    } catch (e) { showToast('Error', 'error'); }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle || !lessonUrl || !selectedCourse) return showToast('Fill all fields', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          title: lessonTitle,
          videoUrl: lessonUrl,
          duration: lessonDur ? parseInt(lessonDur) : undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Lesson "${lessonTitle}" added!`, 'success');
        setLessonTitle('');
        setLessonUrl('');
        setLessonDur('');
        loadAllData();
      } else {
        showToast(json.message || 'Error saving lesson', 'error');
      }
    } catch (err) {
      showToast('Error saving lesson', 'error');
    }
  };

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle || !selectedCourse) return showToast('Fields missing', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ courseId: selectedCourse.id, title: quizTitle })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Quiz "${quizTitle}" created!`, 'success');
        setQuizTitle('');
        loadAllData();
      }
    } catch (err) {
      showToast('Error saving quiz', 'error');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizId || !questionText || !questionOpts || !questionAns) return showToast('Fill all fields', 'error');
    const options = questionOpts.split(',').map((o) => o.trim());
    try {
      const res = await fetch(`${API_BASE}/api/phase10/quiz-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ quizId: selectedQuizId, question: questionText, options, answer: questionAns })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Question added to quiz!', 'success');
        setQuestionText('');
        setQuestionOpts('');
        setQuestionAns('');
        loadAllData();
      }
    } catch (err) {
      showToast('Error saving question', 'error');
    }
  };

  const handleAddHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelName) return showToast('Name is required', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/hostels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name: hostelName, address: hostelAddress })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Hostel "${hostelName}" added!`, 'success');
        setHostelName('');
        setHostelAddress('');
        loadAllData();
      }
    } catch (err) {
      showToast('Error saving hostel', 'error');
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostelId || !roomNo) return showToast('Missing fields', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/hostel-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ hostelId: selectedHostelId, roomNo, capacity: parseInt(roomCap) })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Room ${roomNo} added!`, 'success');
        setRoomNo('');
        loadAllData();
      }
    } catch (err) {
      showToast('Error saving room', 'error');
    }
  };

  const handleAllocateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocRoomId || !allocStudentId || !allocFrom) return showToast('Fill required fields', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/hostel-allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ roomId: allocRoomId, studentId: allocStudentId, fromDate: allocFrom })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Student allocated to room successfully!', 'success');
        setAllocRoomId('');
        setAllocStudentId('');
        setAllocFrom('');
        loadAllData();
      } else {
        showToast(json.message || 'Allocation failed', 'error');
      }
    } catch (err) {
      showToast('Connection failed', 'error');
    }
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName || !menuPrice) return showToast('Fill required fields', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name: menuName, price: parseFloat(menuPrice) })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Canteen item "${menuName}" created!`, 'success');
        setMenuName('');
        setMenuPrice('');
        loadAllData();
      }
    } catch (err) {
      showToast('Error adding menu item', 'error');
    }
  };

  const handleAddSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sportName) return showToast('Sport name required', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/sports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name: sportName })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Sport "${sportName}" registered!`, 'success');
        setSportName('');
        loadAllData();
      }
    } catch (err) {
      showToast('Error registering sport', 'error');
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamSportId || !teamName) return showToast('Sport & Team name required', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ sportId: teamSportId, name: teamName, members: teamMembers })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Team "${teamName}" created!`, 'success');
        setTeamName('');
        setTeamMembers([]);
        loadAllData();
      }
    } catch (err) {
      showToast('Error creating team', 'error');
    }
  };

  const handleScheduleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchSportId || !matchTeamA || !matchTeamB || !matchDate) return showToast('Fill all fields', 'error');
    if (matchTeamA === matchTeamB) return showToast('Teams must be different', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ sportId: matchSportId, teamAId: matchTeamA, teamBId: matchTeamB, date: matchDate })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Match scheduled!', 'success');
        setMatchDate('');
        loadAllData();
      }
    } catch (err) {
      showToast('Error scheduling match', 'error');
    }
  };

  const handleAddHealth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthStudentId) return showToast('Select a student', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/health-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ studentId: healthStudentId, allergies: healthAllergies, medicalNotes: healthNotes })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Health record saved!', 'success');
        setHealthAllergies('');
        setHealthNotes('');
        loadAllData();
      }
    } catch (err) {
      showToast('Error saving health record', 'error');
    }
  };

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitStudentId || !visitDate) return showToast('Fields missing', 'error');
    try {
      const res = await fetch(`${API_BASE}/api/phase10/medical-visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ studentId: visitStudentId, visitDate, diagnosis: visitDiagnosis, prescription: visitPrescription, notes: visitNotes })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Infirmary visit recorded!', 'success');
        setVisitDiagnosis('');
        setVisitPrescription('');
        setVisitNotes('');
        loadAllData();
      }
    } catch (err) {
      showToast('Error saving visit log', 'error');
    }
  };

  // Filtered Health
  const filteredHealth = healthRecords.filter(h => {
    const studentName = `${h.student?.firstName || ''} ${h.student?.lastName || ''}`.toLowerCase();
    const searchVal = healthSearch.toLowerCase();
    return studentName.includes(searchVal) || (h.allergies && h.allergies.toLowerCase().includes(searchVal));
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl bg-slate-900 border-white/10">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toast.type === 'error' && <Trash2 className="w-5 h-5 text-rose-400" />}
          {toast.type === 'info' && <Activity className="w-5 h-5 text-sky-400" />}
          <span className="text-xs font-semibold text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-sky-400 animate-pulse" />
            Learning & Campus Management System
          </h2>
          <p className="text-xs text-slate-500 font-sans">Manage LMS, hostels, POS canteen orders, co-curricular sports, and student health checkups</p>
        </div>
      </div>

      {/* Navigation sub-tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['lms', 'hostel', 'canteen', 'sports', 'health'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 font-semibold uppercase tracking-wider text-[10px] ${
                isActive 
                  ? 'border-sky-500/30 bg-sky-500/10 text-white shadow-lg shadow-sky-500/5' 
                  : 'border-white/5 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {tab === 'lms' && <BookOpen className={`w-5 h-5 ${isActive ? 'text-sky-400' : ''}`} />}
              {tab === 'hostel' && <HomeIcon className={`w-5 h-5 ${isActive ? 'text-sky-400' : ''}`} />}
              {tab === 'canteen' && <Coffee className={`w-5 h-5 ${isActive ? 'text-sky-400' : ''}`} />}
              {tab === 'sports' && <Trophy className={`w-5 h-5 ${isActive ? 'text-sky-400' : ''}`} />}
              {tab === 'health' && <Heart className={`w-5 h-5 ${isActive ? 'text-sky-400' : ''}`} />}
              {tab}
            </button>
          );
        })}
      </div>

      {/* Primary Tab Panels */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-sky-400 animate-spin" />
          <span className="text-xs">Accessing campus registers...</span>
        </div>
      ) : (
        <div className="animate-fadeIn">
          {/* TAB 1: LEARNING MANAGEMENT SYSTEM (LMS) */}
          {activeTab === 'lms' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Courses Grid & Lessons Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Courses list */}
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="font-bold text-white text-sm">Course Directory</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {courses.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 col-span-2 text-center">No LMS courses created.</p>
                    ) : (
                      courses.map((c) => {
                        const courseLessons = lessons.filter((l) => l.courseId === c.id);
                        const courseQuizzes = quizzes.filter((q) => q.courseId === c.id);
                        const isSelected = selectedCourse?.id === c.id;
                        return (
                          <div 
                            key={c.id}
                            onClick={() => setSelectedCourse(c)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-32 ${
                              isSelected ? 'border-sky-500/50 bg-sky-500/5' : 'border-white/5 bg-slate-950/20 hover:border-white/10'
                            }`}
                          >
                            <div>
                              <h5 className="font-bold text-slate-100 text-xs line-clamp-1">{c.title}</h5>
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{c.description || 'No description provided.'}</p>
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-3">
                              <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-sky-400" /> {courseLessons.length} Videos</span>
                              <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-pink-400" /> {courseQuizzes.length} Quizzes</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Course Details (Videos & Quizzes list) */}
                {selectedCourse && (
                  <div className="glass p-6 rounded-2xl border border-white/5 space-y-6">
                    <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{selectedCourse.title} Details</h4>
                        <p className="text-[10px] text-slate-500">{selectedCourse.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Video Lectures */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Video Lessons</span>
                        <div className="space-y-2">
                          {lessons.filter(l => l.courseId === selectedCourse.id).length === 0 ? (
                            <p className="text-[10px] text-slate-600 italic">No video lessons uploaded.</p>
                          ) : (
                            lessons.filter(l => l.courseId === selectedCourse.id).map(l => (
                              <div key={l.id} className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-bold text-slate-300">{l.title}</p>
                                  <a href={l.videoUrl} target="_blank" rel="noreferrer" className="text-[9px] text-sky-400 underline line-clamp-1">{l.videoUrl}</a>
                                </div>
                                {l.duration && <span className="text-[9px] text-slate-500 font-semibold">{l.duration}m</span>}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Quizzes */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Course Quizzes</span>
                        <div className="space-y-2">
                          {quizzes.filter(q => q.courseId === selectedCourse.id).length === 0 ? (
                            <p className="text-[10px] text-slate-600 italic">No quizzes created.</p>
                          ) : (
                            quizzes.filter(q => q.courseId === selectedCourse.id).map(q => (
                              <div key={q.id} className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-bold text-slate-300">{q.title}</p>
                                  <span className="text-[9px] text-slate-500 font-semibold">{q.questions?.length || 0} Questions</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveQuiz(q);
                                    setQuizAnswers({});
                                    setQuizScore(null);
                                  }}
                                  className="px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-[10px] font-extrabold uppercase tracking-wide"
                                >
                                  Play
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* LMS Creator Tools Forms */}
              <div className="space-y-6">
                <div className="glass p-5 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Plus className="w-4 h-4 text-emerald-400" /> Create LMS Course
                  </h4>
                  <form onSubmit={(e) => { e.preventDefault(); handleCreateCourse(); }} className="space-y-3 mt-3">
                    <input
                      placeholder="Course Title"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <select
                      value={courseClassId}
                      onChange={(e) => setCourseClassId(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="">All Classes (Optional Target)</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input
                      placeholder="Description"
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <button type="submit" className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors">
                      Save Course
                    </button>
                  </form>
                </div>

                {selectedCourse && (
                  <>
                    <div className="glass p-5 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <Video className="w-4 h-4 text-sky-400" /> Add Video Lesson
                      </h4>
                      <p className="text-[10px] text-slate-500">Add lesson to "{selectedCourse.title}"</p>
                      <form onSubmit={handleAddLesson} className="space-y-3 mt-3">
                        <input
                          placeholder="Lesson Title"
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                        />
                        <input
                          placeholder="Video URL (HTTPS)"
                          value={lessonUrl}
                          onChange={(e) => setLessonUrl(e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                        />
                        <input
                          placeholder="Duration in Minutes"
                          type="number"
                          value={lessonDur}
                          onChange={(e) => setLessonDur(e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                        />
                        <button type="submit" className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-colors">
                          Add Video Lesson
                        </button>
                      </form>
                    </div>

                    <div className="glass p-5 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <HelpCircle className="w-4 h-4 text-purple-400" /> Create Course Quiz
                      </h4>
                      <form onSubmit={handleAddQuiz} className="space-y-3 mt-3">
                        <input
                          placeholder="Quiz Title"
                          value={quizTitle}
                          onChange={(e) => setQuizTitle(e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                        />
                        <button type="submit" className="w-full py-2 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold rounded-xl transition-colors">
                          Add Quiz Structure
                        </button>
                      </form>
                    </div>

                    {quizzes.filter(q => q.courseId === selectedCourse.id).length > 0 && (
                      <div className="glass p-5 rounded-2xl border border-white/5">
                        <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <PlusCircle className="w-4 h-4 text-pink-400" /> Add Quiz Question
                        </h4>
                        <form onSubmit={handleAddQuestion} className="space-y-3 mt-3">
                          <select
                            value={selectedQuizId}
                            onChange={(e) => setSelectedQuizId(e.target.value)}
                            className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="">Select Quiz Target</option>
                            {quizzes.filter(q => q.courseId === selectedCourse.id).map(q => (
                              <option key={q.id} value={q.id}>{q.title}</option>
                            ))}
                          </select>
                          <input
                            placeholder="Question text?"
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                          />
                          <input
                            placeholder="Options (comma separated)"
                            value={questionOpts}
                            onChange={(e) => setQuestionOpts(e.target.value)}
                            className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                          />
                          <input
                            placeholder="Correct Answer (Exact string)"
                            value={questionAns}
                            onChange={(e) => setQuestionAns(e.target.value)}
                            className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                          />
                          <button type="submit" className="w-full py-2 bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold rounded-xl transition-colors">
                            Insert Question
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HOSTEL SERVICES */}
          {activeTab === 'hostel' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hostels & Room Allocations View */}
              <div className="lg:col-span-2 space-y-6">
                {/* Hostels Card Grid */}
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="font-bold text-white text-sm">Residential Buildings</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hostels.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 col-span-2 text-center">No hostels registered yet.</p>
                    ) : (
                      hostels.map((h) => {
                        const isSelected = selectedHostel?.id === h.id;
                        const totalRooms = h.rooms?.length || 0;
                        const occupiedBeds = h.rooms?.reduce((acc: number, r: any) => acc + (r.allocations?.length || 0), 0) || 0;
                        const totalBeds = h.rooms?.reduce((acc: number, r: any) => acc + r.capacity, 0) || 0;
                        const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
                        return (
                          <div
                            key={h.id}
                            onClick={() => setSelectedHostel(h)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-36 ${
                              isSelected ? 'border-sky-500/50 bg-sky-500/5' : 'border-white/5 bg-slate-950/20 hover:border-white/10'
                            }`}
                          >
                            <div>
                              <h5 className="font-bold text-slate-100 text-xs">{h.name}</h5>
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{h.address || 'No address'}</p>
                            </div>
                            <div className="mt-4 space-y-1.5">
                              <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                <span>Rooms: {totalRooms}</span>
                                <span>Beds occupied: {occupiedBeds}/{totalBeds} ({occupancyRate}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${occupancyRate}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Rooms and Allocations */}
                {selectedHostel && (
                  <div className="glass p-6 rounded-2xl border border-white/5 space-y-6">
                    <h4 className="font-bold text-white text-sm">{selectedHostel.name} — Rooms & Allocations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Rooms capacity grids */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Beds layout</span>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedHostel.rooms?.length === 0 ? (
                            <p className="text-[10px] text-slate-600 italic col-span-2">No rooms created.</p>
                          ) : (
                            selectedHostel.rooms.map((r: any) => {
                              const spots = Array.from({ length: r.capacity });
                              return (
                                <div key={r.id} className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-300">Room {r.roomNo}</span>
                                    <span className="text-[10px] text-slate-500">{r.allocations?.length || 0}/{r.capacity}</span>
                                  </div>
                                  <div className="flex gap-1.5">
                                    {spots.map((_, i) => {
                                      const isOccupied = i < (r.allocations?.length || 0);
                                      return (
                                        <div
                                          key={i}
                                          className={`w-3.5 h-3.5 rounded-sm border ${
                                            isOccupied ? 'bg-rose-500/30 border-rose-500/50' : 'bg-emerald-500/10 border-emerald-500/30'
                                          }`}
                                          title={isOccupied ? `Occupied by: ${r.allocations[i].student?.firstName}` : 'Empty bed'}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Active Allocations logs */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active Allocations</span>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {selectedHostel.rooms?.flatMap((r: any) => r.allocations || []).length === 0 ? (
                            <p className="text-[10px] text-slate-600 italic">No students allocated yet.</p>
                          ) : (
                            selectedHostel.rooms.flatMap((r: any) => r.allocations || []).map((a: any) => (
                              <div key={a.id} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-900 flex items-center justify-between text-xs text-slate-300">
                                <div>
                                  <p className="font-bold text-slate-200">{a.student?.firstName} {a.student?.lastName}</p>
                                  <span className="text-[9px] text-slate-500">From: {a.fromDate}</span>
                                </div>
                                <span className="px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded text-[9px] font-extrabold uppercase">
                                  Room {selectedHostel.rooms.find((rm: any) => rm.id === a.roomId)?.roomNo}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Hostel Forms Panel */}
              <div className="space-y-6">
                <div className="glass p-5 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Plus className="w-4 h-4 text-emerald-400" /> Create Hostel Building
                  </h4>
                  <form onSubmit={handleAddHostel} className="space-y-3 mt-3">
                    <input
                      placeholder="Hostel Name (e.g. Boys Block A)"
                      value={hostelName}
                      onChange={(e) => setHostelName(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <input
                      placeholder="Address Location"
                      value={hostelAddress}
                      onChange={(e) => setHostelAddress(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <button type="submit" className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors">
                      Save Hostel
                    </button>
                  </form>
                </div>

                <div className="glass p-5 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <PlusCircle className="w-4 h-4 text-sky-400" /> Add Hostel Room
                  </h4>
                  <form onSubmit={handleAddRoom} className="space-y-3 mt-3">
                    <select
                      value={selectedHostelId}
                      onChange={(e) => setSelectedHostelId(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="">Select Hostel Building</option>
                      {hostels.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                    <input
                      placeholder="Room Number (e.g. 101)"
                      value={roomNo}
                      onChange={(e) => setRoomNo(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <div>
                      <label className="block text-[9px] text-slate-500 font-extrabold uppercase tracking-wide mb-1">Room Capacity (Beds)</label>
                      <select
                        value={roomCap}
                        onChange={(e) => setRoomCap(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="1">1 Bed (Single)</option>
                        <option value="2">2 Beds (Double)</option>
                        <option value="4">4 Beds (Dormitory)</option>
                        <option value="6">6 Beds (Dormitory)</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-colors">
                      Save Room
                    </button>
                  </form>
                </div>

                {hostels.some(h => h.rooms?.length > 0) && (
                  <div className="glass p-5 rounded-2xl border border-white/5">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                      <UserCheck className="w-4 h-4 text-amber-500" /> Allocate Room Bed
                    </h4>
                    <form onSubmit={handleAllocateHostel} className="space-y-3 mt-3">
                      <select
                        value={allocRoomId}
                        onChange={(e) => setAllocRoomId(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="">Select Room</option>
                        {hostels.flatMap(h => h.rooms || []).map(r => {
                          const h = hostels.find(x => x.id === r.hostelId);
                          return (
                            <option key={r.id} value={r.id}>{h?.name} — Room {r.roomNo}</option>
                          );
                        })}
                      </select>
                      <select
                        value={allocStudentId}
                        onChange={(e) => setAllocStudentId(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="">Select Student</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
                        ))}
                      </select>
                      <div>
                        <label className="block text-[9px] text-slate-500 font-extrabold uppercase tracking-wide mb-1">Check-in Date</label>
                        <input
                          type="date"
                          value={allocFrom}
                          onChange={(e) => setAllocFrom(e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                        />
                      </div>
                      <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-xl transition-colors">
                        Complete Check-in
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CANTEEN POS & CART */}
          {activeTab === 'canteen' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* POS Menu Grid */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white text-sm">Canteen Menu / Point-of-Sale (POS)</h4>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold">Fast Ordering Terminal</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {menuItems.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 col-span-3 text-center">No menu items created.</p>
                    ) : (
                      menuItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl flex flex-col justify-between h-32 hover:border-white/10 hover:bg-slate-950/30 transition-all group"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xl">🍔</span>
                              <span className="text-xs font-bold text-emerald-400">₹{item.price}</span>
                            </div>
                            <h5 className="font-bold text-slate-200 text-xs mt-2 line-clamp-1">{item.name}</h5>
                          </div>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-full py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-[9px] font-extrabold uppercase tracking-wide transition-all duration-300 transform active:scale-95 mt-2"
                            style={{ backgroundColor: brandColor }}
                          >
                            Add to Cart
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Past Orders logs */}
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl">
                  <h4 className="font-bold text-white text-sm">Canteen Order History ({orders.length})</h4>
                  <div className="overflow-x-auto">
                    {orders.length === 0 ? (
                      <p className="text-center py-4 text-slate-600 text-xs">No orders recorded yet.</p>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-900">
                            <th className="pb-2">Order ID</th>
                            <th className="pb-2">Account</th>
                            <th className="pb-2">Items Count</th>
                            <th className="pb-2">Total Total</th>
                            <th className="pb-2">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/50 text-slate-300">
                          {orders.map((o) => (
                            <tr key={o.id}>
                              <td className="py-2 font-mono text-[10px] text-slate-500">#{o.id.slice(0, 8).toUpperCase()}</td>
                              <td className="py-2 text-slate-300 font-semibold">
                                {o.student ? `${o.student.firstName} ${o.student.lastName}` : 'Guest User'}
                              </td>
                              <td className="py-2 text-slate-400">
                                {JSON.parse(o.items || '[]').reduce((acc: number, item: any) => acc + item.qty, 0)} items
                              </td>
                              <td className="py-2 text-emerald-400 font-black">₹{o.total}</td>
                              <td className="py-2 text-[10px] text-slate-500">{new Date(o.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* POS Cart Sidebar & Menu Creator */}
              <div className="space-y-6">
                {/* Checkout Cart */}
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between min-h-[300px] shadow-2xl relative">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-900 pb-2.5">
                      <ShoppingCart className="w-5 h-5 text-sky-400" /> Active Order Cart
                    </h4>

                    <div className="space-y-3 mt-3 max-h-48 overflow-y-auto pr-1">
                      {cart.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-6 text-center">Cart is empty.</p>
                      ) : (
                        cart.map((c) => (
                          <div key={c.item.id} className="flex items-center justify-between gap-3 text-xs bg-slate-950 p-2 rounded-xl border border-slate-900">
                            <div className="flex-1">
                              <p className="font-bold text-slate-200">{c.item.name}</p>
                              <span className="text-[10px] text-emerald-400 font-bold">₹{c.item.price} each</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateCartQty(c.item.id, -1)} className="w-5 h-5 bg-slate-800 text-white rounded text-center font-bold">-</button>
                              <span className="font-bold text-slate-300">{c.qty}</span>
                              <button onClick={() => updateCartQty(c.item.id, 1)} className="w-5 h-5 bg-slate-800 text-white rounded text-center font-bold">+</button>
                              <button onClick={() => removeFromCart(c.item.id)} className="p-1 text-slate-500 hover:text-rose-400 ml-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-900">
                    <select
                      value={selectedCartStudent}
                      onChange={(e) => setSelectedCartStudent(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="">Order Account: Guest Visitor</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
                      ))}
                    </select>

                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between"><span>Subtotal:</span><span className="text-slate-200">₹{cart.reduce((a, c) => a + (c.item.price * c.qty), 0)}</span></div>
                      <div className="flex justify-between"><span>GST (5%):</span><span className="text-slate-200">₹{(cart.reduce((a, c) => a + (c.item.price * c.qty), 0) * 0.05).toFixed(1)}</span></div>
                      <div className="flex justify-between border-t border-slate-900 pt-2 font-black text-sm text-white">
                        <span>Total Payable:</span>
                        <span className="text-emerald-400">₹{(cart.reduce((a, c) => a + (c.item.price * c.qty), 0) * 1.05).toFixed(1)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                      className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                      style={{ background: brandColor }}
                    >
                      Complete Checkout
                    </button>
                  </div>
                </div>

                {/* Add Canteen Item */}
                <div className="glass p-5 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Plus className="w-4 h-4 text-emerald-400" /> Create Menu Item
                  </h4>
                  <form onSubmit={handleAddMenu} className="space-y-3 mt-3">
                    <input
                      placeholder="Item Name (e.g. Veg Burger)"
                      value={menuName}
                      onChange={(e) => setMenuName(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <input
                      placeholder="Price in INR"
                      type="number"
                      value={menuPrice}
                      onChange={(e) => setMenuPrice(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <button type="submit" className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors">
                      Save Menu Item
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SPORTS & ACTIVITIES */}
          {activeTab === 'sports' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Roster & Matches Cards Deck */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="font-bold text-white text-sm">Sports & Co-Curricular Catalog</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sports.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 col-span-2 text-center">No co-curricular sports added.</p>
                    ) : (
                      sports.map((sport) => {
                        const sportTeams = teams.filter(t => t.sportId === sport.id);
                        const sportMatches = matches.filter(m => m.sportId === sport.id);
                        return (
                          <div key={sport.id} className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl space-y-3 hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                                <Trophy className="w-4 h-4 text-amber-400" /> {sport.name}
                              </h5>
                              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Active Discipline</span>
                            </div>
                            <div className="flex gap-4 text-[10px] text-slate-400 font-semibold pt-1">
                              <span>Teams: {sportTeams.length}</span>
                              <span>Matches: {sportMatches.length}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Match schedules */}
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl">
                  <h4 className="font-bold text-white text-sm">Match Schedules & Leaderboard</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {matches.length === 0 ? (
                      <p className="text-center py-6 text-slate-600 text-xs col-span-2">No match fixtures scheduled yet.</p>
                    ) : (
                      matches.map((m) => {
                        const sName = sports.find(sp => sp.id === m.sportId)?.name || 'Sport';
                        const tA = teams.find(t => t.id === m.teamAId)?.name || 'Team A';
                        const tB = teams.find(t => t.id === m.teamBId)?.name || 'Team B';
                        return (
                          <div key={m.id} className="p-4 bg-slate-950 rounded-xl border border-slate-900 flex flex-col justify-between gap-3 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-1 px-2.5 bg-slate-900 border-l border-b border-slate-800 text-[8px] font-bold text-slate-500 rounded-bl uppercase">
                              {sName}
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 font-bold block mb-1">{m.date}</span>
                              <div className="flex items-center justify-between gap-2 mt-2">
                                <span className="font-bold text-slate-200 text-xs flex-1 line-clamp-1">{tA}</span>
                                <span className="text-[9px] font-black text-indigo-400 px-1.5 py-0.5 bg-indigo-500/10 rounded">VS</span>
                                <span className="font-bold text-slate-200 text-xs flex-1 text-right line-clamp-1">{tB}</span>
                              </div>
                            </div>
                            <div className="text-center border-t border-slate-900/50 pt-2 text-[10px] font-extrabold text-slate-400">
                              {m.score ? `Result: ${m.score}` : 'Fixture Scheduled'}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Sports Forms */}
              <div className="space-y-6">
                <div className="glass p-5 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Plus className="w-4 h-4 text-emerald-400" /> Create Sport Discipline
                  </h4>
                  <form onSubmit={handleAddSport} className="space-y-3 mt-3">
                    <input
                      placeholder="Sport Name (e.g. Football)"
                      value={sportName}
                      onChange={(e) => setSportName(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <button type="submit" className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors">
                      Register Sport
                    </button>
                  </form>
                </div>

                {sports.length > 0 && (
                  <>
                    <div className="glass p-5 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <Users className="w-4 h-4 text-sky-400" /> Setup Team Roster
                      </h4>
                      <form onSubmit={handleAddTeam} className="space-y-3 mt-3">
                        <select
                          value={teamSportId}
                          onChange={(e) => setTeamSportId(e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="">Select Sport</option>
                          {sports.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <input
                          placeholder="Team Roster Name (e.g. Phoenix FC)"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                        />
                        <div>
                          <label className="block text-[9px] text-slate-500 font-extrabold uppercase tracking-wide mb-1">Select Squad Members</label>
                          <select
                            multiple
                            value={teamMembers}
                            onChange={(e) => {
                              const opts = Array.from(e.target.selectedOptions, (option) => option.value);
                              setTeamMembers(opts);
                            }}
                            className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-350 focus:outline-none h-24"
                          >
                            {students.map(s => (
                              <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                            ))}
                          </select>
                        </div>
                        <button type="submit" className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-colors">
                          Create Team
                        </button>
                      </form>
                    </div>

                    {teams.length >= 2 && (
                      <div className="glass p-5 rounded-2xl border border-white/5">
                        <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <Calendar className="w-4 h-4 text-amber-500" /> Schedule Match Fixture
                        </h4>
                        <form onSubmit={handleScheduleMatch} className="space-y-3 mt-3">
                          <select
                            value={matchSportId}
                            onChange={(e) => {
                              setMatchSportId(e.target.value);
                              setMatchTeamA('');
                              setMatchTeamB('');
                            }}
                            className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="">Select Sport Discipline</option>
                            {sports.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>

                          {matchSportId && (
                            <>
                              <select
                                value={matchTeamA}
                                onChange={(e) => setMatchTeamA(e.target.value)}
                                className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                              >
                                <option value="">Select Team A</option>
                                {teams.filter(t => t.sportId === matchSportId).map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>

                              <select
                                value={matchTeamB}
                                onChange={(e) => setMatchTeamB(e.target.value)}
                                className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                              >
                                <option value="">Select Team B</option>
                                {teams.filter(t => t.sportId === matchSportId).map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </>
                          )}

                          <input
                            type="date"
                            value={matchDate}
                            onChange={(e) => setMatchDate(e.target.value)}
                            className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                          />
                          <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-xl transition-colors">
                            Schedule Fixture
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: HEALTH & medical record tracker */}
          {activeTab === 'health' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Health Records Logs */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5"><Heart className="w-5 h-5 text-rose-500" /> Student Health Records</h4>
                    {/* Search filter */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search student or allergy..."
                        value={healthSearch}
                        onChange={(e) => setHealthSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredHealth.length === 0 ? (
                      <p className="text-center py-6 text-slate-600 text-xs">No matching health records.</p>
                    ) : (
                      filteredHealth.map((h) => (
                        <div key={h.id} className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">{h.student?.firstName} {h.student?.lastName}</span>
                            {h.allergies && (
                              <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[9px] font-black uppercase">
                                Allergy: {h.allergies}
                              </span>
                            )}
                          </div>
                          {h.medicalNotes && <p className="text-xs text-slate-400 font-sans mt-1">{h.medicalNotes}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Medical Infirmary Visits */}
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl">
                  <h4 className="font-bold text-white text-sm">Daily Sick Bay Visit Logs</h4>
                  <div className="overflow-x-auto">
                    {medicalVisits.length === 0 ? (
                      <p className="text-center py-4 text-slate-600 text-xs">No sick bay visits logged today.</p>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-900">
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Student</th>
                            <th className="pb-2">Diagnosis</th>
                            <th className="pb-2">Prescription</th>
                            <th className="pb-2">Clinic Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/50 text-slate-300">
                          {medicalVisits.map((v) => (
                            <tr key={v.id}>
                              <td className="py-2.5 text-[10px] text-slate-500">{v.visitDate}</td>
                              <td className="py-2.5 font-bold text-slate-300">{v.student?.firstName} {v.student?.lastName}</td>
                              <td className="py-2.5 text-rose-400 font-semibold">{v.diagnosis || 'N/A'}</td>
                              <td className="py-2.5 text-slate-400 italic">{v.prescription || 'N/A'}</td>
                              <td className="py-2.5 text-[10px] text-slate-500 max-w-[150px] truncate">{v.notes || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* Health Registry forms */}
              <div className="space-y-6">
                <div className="glass p-5 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Heart className="w-4 h-4 text-rose-400 animate-pulse" /> Register Health Profile
                  </h4>
                  <form onSubmit={handleAddHealth} className="space-y-3 mt-3">
                    <select
                      value={healthStudentId}
                      onChange={(e) => setHealthStudentId(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="">Select Student</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
                      ))}
                    </select>
                    <input
                      placeholder="Known Allergies (e.g. Peanuts, Penicillin)"
                      value={healthAllergies}
                      onChange={(e) => setHealthAllergies(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <textarea
                      placeholder="General Medical & Fitness Notes"
                      value={healthNotes}
                      onChange={(e) => setHealthNotes(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none h-16"
                    />
                    <button type="submit" className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors">
                      Save Health Record
                    </button>
                  </form>
                </div>

                <div className="glass p-5 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Activity className="w-4 h-4 text-sky-400 animate-pulse" /> Record Sick Bay Visit
                  </h4>
                  <form onSubmit={handleAddVisit} className="space-y-3 mt-3">
                    <select
                      value={visitStudentId}
                      onChange={(e) => setVisitStudentId(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="">Select Student</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <input
                      placeholder="Diagnosis / Symptom (e.g. Mild Fever)"
                      value={visitDiagnosis}
                      onChange={(e) => setVisitDiagnosis(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <input
                      placeholder="Prescription / Treatment (e.g. Paracetamol 500mg)"
                      value={visitPrescription}
                      onChange={(e) => setVisitPrescription(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                    <textarea
                      placeholder="Clinical/Nurse Notes"
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none h-16"
                    />
                    <button type="submit" className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-colors">
                      Log Sick Bay Visit
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUIZ PLAYER INTERACTIVE MODAL */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass rounded-3xl w-full max-w-xl border border-white/10 shadow-2xl p-6 relative flex flex-col justify-between max-h-[85vh]">
            <div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
                <div>
                  <h4 className="font-extrabold text-sm text-purple-400 uppercase tracking-widest">Active Quiz Player</h4>
                  <h3 className="font-bold text-white text-base mt-0.5">{activeQuiz.title}</h3>
                </div>
                <button 
                  onClick={() => setActiveQuiz(null)}
                  className="px-2 py-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg text-xs"
                >
                  Close
                </button>
              </div>

              {quizScore === null ? (
                <div className="space-y-6 overflow-y-auto max-h-[50vh] pr-1">
                  {activeQuiz.questions?.length === 0 ? (
                    <p className="text-center py-6 text-slate-500 text-xs">This quiz has no questions yet.</p>
                  ) : (
                    activeQuiz.questions.map((q: any, qIdx: number) => {
                      const options: string[] = JSON.parse(q.options || '[]');
                      return (
                        <div key={q.id} className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-900">
                          <p className="text-xs font-bold text-slate-200">Q{qIdx + 1}. {q.question}</p>
                          <div className="grid grid-cols-1 gap-2">
                            {options.map((opt) => {
                              const isChecked = quizAnswers[q.id] === opt;
                              return (
                                <label 
                                  key={opt}
                                  className={`flex items-center gap-3 px-3 py-2 border rounded-xl cursor-pointer text-xs transition-all ${
                                    isChecked 
                                      ? 'border-purple-500/50 bg-purple-500/5 text-white font-semibold' 
                                      : 'border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`q-${q.id}`}
                                    value={opt}
                                    checked={isChecked}
                                    onChange={() => selectQuizOption(q.id, opt)}
                                    className="hidden"
                                  />
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isChecked ? 'border-purple-400' : 'border-slate-700'}`}>
                                    {isChecked && <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />}
                                  </div>
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-4xl">
                    🏆
                  </div>
                  <div>
                    <h5 className="text-lg font-black text-white">Quiz Completed!</h5>
                    <p className="text-xs text-slate-400 mt-1">You scored <span className="text-purple-400 font-extrabold text-sm">{quizScore} / {activeQuiz.questions.length}</span></p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setQuizAnswers({});
                        setQuizScore(null);
                      }}
                      className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>

            {quizScore === null && activeQuiz.questions?.length > 0 && (
              <div className="border-t border-slate-900 pt-4 mt-4 flex justify-end">
                <button
                  onClick={submitQuizAnswers}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/10 transition-all active:scale-95"
                >
                  Submit Answers
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POS THERMAL RECEIPT MODAL */}
      {latestReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative border border-slate-200">
            {/* Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-800">Aegis Canteen POS</h3>
              <p className="text-[10px] text-slate-500">{school?.name || 'Aegis Academic Center'}</p>
              <p className="text-[9px] text-slate-400">{latestReceipt.date}</p>
            </div>

            {/* Metadata */}
            <div className="py-3 text-[10px] text-slate-600 border-b border-dashed border-slate-300 space-y-1 font-mono">
              <div className="flex justify-between"><span>Receipt No:</span><span className="font-bold">{latestReceipt.invoiceId}</span></div>
              <div className="flex justify-between"><span>Account Name:</span><span className="font-bold">{latestReceipt.studentName}</span></div>
              <div className="flex justify-between"><span>Admission No:</span><span className="font-bold">{latestReceipt.admissionNo}</span></div>
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2 font-mono text-[10px] text-slate-700">
              {latestReceipt.items.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start gap-2">
                  <div className="flex-1 truncate">{it.name} <span className="text-slate-400 text-[9px]">x{it.qty}</span></div>
                  <span>₹{it.sub.toFixed(1)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-3 space-y-1 font-mono text-[10px] text-slate-700">
              <div className="flex justify-between"><span>Subtotal:</span><span>₹{latestReceipt.subtotal.toFixed(1)}</span></div>
              <div className="flex justify-between"><span>CGST + SGST (5%):</span><span>₹{parseFloat(latestReceipt.tax).toFixed(1)}</span></div>
              <div className="flex justify-between border-t border-dashed border-slate-300 pt-2 font-black text-sm text-slate-850">
                <span>Amount Paid:</span>
                <span>₹{parseFloat(latestReceipt.total).toFixed(1)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center space-y-2 border-t border-dashed border-slate-300 pt-4 mt-2">
              <span className="text-[10px] font-bold text-slate-800 uppercase block tracking-wider">Paid via Card/Meal Card</span>
              <p className="text-[9px] text-slate-400 italic">Thank you for dining with us! Have a wonderful day.</p>
              
              <div className="flex gap-2 justify-center pt-3 no-print">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[10px] font-bold shadow-md transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
                <button
                  onClick={() => setLatestReceipt(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold transition-colors"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase10;
