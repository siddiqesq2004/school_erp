import { create } from 'zustand';

interface School {
  id: string;
  name: string;
  code: string;
  themeColor: string;
}

interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'TEACHER' | 'HOD' | 'STAFF' | 'STUDENT' | 'PARENT';
  email?: string;
  profile?: any;
}

interface AuthState {
  token: string | null;
  user: User | null;
  school: School | null;
  login: (user: User, school: School, token: string) => void;
  logout: () => void;
}

export const useStore = create<AuthState>((set) => {
  // Try loading from localStorage
  const savedToken = localStorage.getItem('scl_token');
  const savedUser = localStorage.getItem('scl_user');
  const savedSchool = localStorage.getItem('scl_school');

  return {
    token: savedToken,
    user: savedUser ? JSON.parse(savedUser) : null,
    school: savedSchool ? JSON.parse(savedSchool) : null,
    login: (user, school, token) => {
      localStorage.setItem('scl_token', token);
      localStorage.setItem('scl_user', JSON.stringify(user));
      localStorage.setItem('scl_school', JSON.stringify(school));
      set({ user, school, token });
    },
    logout: () => {
      localStorage.removeItem('scl_token');
      localStorage.removeItem('scl_user');
      localStorage.removeItem('scl_school');
      set({ user: null, school: null, token: null });
    },
  };
});
