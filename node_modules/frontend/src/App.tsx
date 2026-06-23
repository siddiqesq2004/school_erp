import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import SIS from './pages/SIS';
import HR from './pages/HR';
import Academics from './pages/Academics';
import Attendance from './pages/Attendance';
import Exams from './pages/Exams';
import Fees from './pages/Fees';
import Payroll from './pages/Payroll';
import TeachingOps from './pages/TeachingOps';
import Communications from './pages/Communications';
import Transport from './pages/Transport';
import Library from './pages/Library';
import Accounts from './pages/Accounts';
import MIS from './pages/MIS';
import Phase9 from './pages/Phase9';
import Phase10 from './pages/Phase10';
import Phase11 from './pages/Phase11';
import Phase12 from './pages/Phase12';
import TamilNadu from './pages/TamilNadu';
import PortalAccounts from './pages/PortalAccounts';
import Portal from './pages/Portal';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useStore((state) => state.token);
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="sis" element={<SIS />} />
          <Route path="hr" element={<HR />} />
          <Route path="academics" element={<Academics />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="exams" element={<Exams />} />
          <Route path="fees" element={<Fees />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="transport" element={<Transport />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="library" element={<Library />} />
          <Route path="phase9" element={<Phase9 />} />
          <Route path="phase10" element={<Phase10 />} />
          <Route path="phase11" element={<Phase11 />} />
          <Route path="phase12" element={<Phase12 />} />
          <Route path="tamil-nadu" element={<TamilNadu />} />
          <Route path="mis" element={<MIS />} />
          <Route path="teaching" element={<TeachingOps />} />
          <Route path="communications" element={<Communications />} />
          <Route path="portal-accounts" element={<PortalAccounts />} />
          <Route path="portal" element={<Portal />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
