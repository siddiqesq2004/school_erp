import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { BookOpen, Book, ArrowDownRight } from 'lucide-react';

interface LibraryBook {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  category?: string;
  totalCopies: number;
  availableCopies: number;
}

interface LibraryIssue {
  id: string;
  book: LibraryBook;
  student?: { firstName?: string; lastName?: string };
  staff?: { firstName?: string; lastName?: string };
  issueType: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
}

const Library = () => {
  const token = useStore((state) => state.token);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [issues, setIssues] = useState<LibraryIssue[]>([]);
  const [summary, setSummary] = useState({ bookCount: 0, activeIssues: 0, totalIssues: 0 });
  const [form, setForm] = useState({ title: '', author: '', isbn: '', publisher: '', category: '', totalCopies: 1 });
  const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '', staffId: '', dueDate: '' });
  const [message, setMessage] = useState<string>('');

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [booksRes, issuesRes, summaryRes] = await Promise.all([
        fetch('http://localhost:5000/api/library/books', { headers }),
        fetch('http://localhost:5000/api/library/issues', { headers }),
        fetch('http://localhost:5000/api/library/summary', { headers }),
      ]);

      const booksJson = await booksRes.json();
      const issuesJson = await issuesRes.json();
      const summaryJson = await summaryRes.json();

      if (booksJson.success) setBooks(booksJson.data);
      if (issuesJson.success) setIssues(issuesJson.data);
      if (summaryJson.success) setSummary(summaryJson.data);
    } catch (error) {
      console.error(error);
      setMessage('Unable to load library details.');
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleCreateBook = async () => {
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch('http://localhost:5000/api/library/books', {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Book added successfully');
        setForm({ title: '', author: '', isbn: '', publisher: '', category: '', totalCopies: 1 });
        fetchData();
      } else {
        setMessage(json.message || 'Unable to add book');
      }
    } catch (error) {
      console.error(error);
      setMessage('Unable to add book.');
    }
  };

  const handleIssueBook = async () => {
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch('http://localhost:5000/api/library/issues', {
        method: 'POST',
        headers,
        body: JSON.stringify(issueForm),
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Book issued successfully');
        setIssueForm({ bookId: '', studentId: '', staffId: '', dueDate: '' });
        fetchData();
      } else {
        setMessage(json.message || 'Unable to issue book');
      }
    } catch (error) {
      console.error(error);
      setMessage('Unable to issue book.');
    }
  };

  const handleReturnBook = async (issueId: string) => {
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch('http://localhost:5000/api/library/issues/return', {
        method: 'POST',
        headers,
        body: JSON.stringify({ issueId }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Book returned successfully');
        fetchData();
      } else {
        setMessage(json.message || 'Unable to return book');
      }
    } catch (error) {
      console.error(error);
      setMessage('Unable to return book.');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.6fr] gap-6">
        <div className="glass p-6 rounded-3xl border border-white/5 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Library Management</h2>
              <p className="text-sm text-slate-400 mt-1">Add books, issue copies, and manage returns across the school library.</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-850 flex items-center justify-center text-sky-400">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass rounded-3xl p-5 border border-white/5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Titles</p>
              <h3 className="text-3xl font-black text-white">{summary.bookCount}</h3>
              <p className="text-[11px] text-slate-400 mt-2">Total books catalogued.</p>
            </div>
            <div className="glass rounded-3xl p-5 border border-white/5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Issued</p>
              <h3 className="text-3xl font-black text-white">{summary.activeIssues}</h3>
              <p className="text-[11px] text-slate-400 mt-2">Currently checked out.</p>
            </div>
            <div className="glass rounded-3xl p-5 border border-white/5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Transactions</p>
              <h3 className="text-3xl font-black text-white">{summary.totalIssues}</h3>
              <p className="text-[11px] text-slate-400 mt-2">Total issue records.</p>
            </div>
          </div>

          {message && <div className="text-sm text-emerald-300 mb-4">{message}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="glass rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 mb-4">Add New Book</h3>
              <div className="space-y-4">
                {[
                  { label: 'Title', key: 'title' },
                  { label: 'Author', key: 'author' },
                  { label: 'ISBN', key: 'isbn' },
                  { label: 'Publisher', key: 'publisher' },
                  { label: 'Category', key: 'category' },
                ].map((field) => (
                  <input
                    key={field.key}
                    value={(form as any)[field.key]}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                    placeholder={field.label}
                    className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
                  />
                ))}
                <input
                  type="number"
                  min={1}
                  value={form.totalCopies}
                  onChange={(event) => setForm({ ...form, totalCopies: Number(event.target.value) })}
                  placeholder="Total copies"
                  className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
                />
                <button
                  onClick={handleCreateBook}
                  className="w-full py-3 rounded-3xl bg-sky-500 text-white font-semibold hover:bg-sky-400 transition-colors"
                >
                  Add Book
                </button>
              </div>
            </section>

            <section className="glass rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 mb-4">Issue Book</h3>
              <div className="space-y-4">
                <select
                  value={issueForm.bookId}
                  onChange={(event) => setIssueForm({ ...issueForm, bookId: event.target.value })}
                  className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
                >
                  <option value="">Select a book</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} ({book.availableCopies} available)
                    </option>
                  ))}
                </select>
                <input
                  value={issueForm.studentId}
                  onChange={(event) => setIssueForm({ ...issueForm, studentId: event.target.value, staffId: '' })}
                  placeholder="Student ID"
                  className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
                />
                <input
                  value={issueForm.staffId}
                  onChange={(event) => setIssueForm({ ...issueForm, staffId: event.target.value, studentId: '' })}
                  placeholder="Staff ID"
                  className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
                />
                <input
                  type="date"
                  value={issueForm.dueDate}
                  onChange={(event) => setIssueForm({ ...issueForm, dueDate: event.target.value })}
                  className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-400"
                />
                <button
                  onClick={handleIssueBook}
                  className="w-full py-3 rounded-3xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors"
                >
                  Issue Book
                </button>
              </div>
            </section>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-300">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Library snapshot</h3>
              <p className="text-sm text-slate-400">Live counts and the latest issue queue.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="glass rounded-3xl p-4 border border-white/5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Books available</p>
              <h3 className="text-3xl font-black text-white">{books.reduce((sum, book) => sum + book.availableCopies, 0)}</h3>
            </div>
            <div className="glass rounded-3xl p-4 border border-white/5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Recent issue records</p>
              <div className="space-y-3">
                {issues.slice(0, 3).map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between gap-3 rounded-3xl bg-slate-950/70 p-4 border border-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-white">{issue.book.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{issue.issueType} • due {issue.dueDate}</p>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{issue.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="glass rounded-3xl p-6 border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Library Inventory</h3>
            <p className="text-sm text-slate-400">Review all book copies and manage current loan status.</p>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest first</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                  <td className="px-4 py-3 text-white font-medium">{book.title}</td>
                  <td className="px-4 py-3 text-slate-300">{book.author || 'N/A'}</td>
                  <td className="px-4 py-3 text-slate-300">{book.category || 'General'}</td>
                  <td className="px-4 py-3 text-emerald-300">{book.availableCopies}</td>
                  <td className="px-4 py-3 text-slate-300">{book.totalCopies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass rounded-3xl p-6 border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Active Loans</h3>
            <p className="text-sm text-slate-400">Return books directly from the dashboard.</p>
          </div>
        </div>
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="glass rounded-3xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{issue.book.title}</p>
                <p className="text-xs text-slate-500">{issue.issueType} • due {issue.dueDate}</p>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <span>{issue.student ? `${issue.student.firstName ?? ''} ${issue.student.lastName ?? ''}` : issue.staff ? `${issue.staff.firstName ?? ''} ${issue.staff.lastName ?? ''}` : 'Unknown'}</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-950/70 text-[11px] uppercase tracking-[0.2em] text-slate-400">{issue.status}</span>
              </div>
              {issue.status === 'ISSUED' && (
                <button
                  onClick={() => handleReturnBook(issue.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
                >
                  <ArrowDownRight className="w-4 h-4" /> Return
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Library;
