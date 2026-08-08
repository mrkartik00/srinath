import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import Dashboard from '../pages/Dashboard';
import Doctors from '../pages/Doctors';
import DoctorDetail from '../pages/DoctorDetail';
import Patients from '../pages/Patients';
import Appointments from '../pages/Appointments';
import Prescriptions from '../pages/Prescriptions';
import Analytics from '../pages/Analytics';
import Plans from '../pages/Plans';
import Settings from '../pages/Settings';
import Logs from '../pages/Logs';
import ComingSoon from '../pages/ComingSoon';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'super_admin') return <Navigate to="/login" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/:id" element={<DoctorDetail />} />
            <Route path="patients" element={<Patients />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="plans" element={<Plans />} />
            <Route path="settings" element={<Settings />} />
            <Route path="logs" element={<Logs />} />
            {/* Coming Soon */}
            <Route path="revenue" element={<ComingSoon title="Revenue Dashboard" icon="💰" description="Track subscription revenue, MRR, churn rate, and payment history." />} />
            <Route path="billing" element={<ComingSoon title="Billing Management" icon="🧾" description="Manage invoices, payment methods, and subscription billing cycles." />} />
            <Route path="reminders" element={<ComingSoon title="Reminders Overview" icon="🔔" description="Monitor medicine reminder delivery, adherence rates, and failed notifications." />} />
            <Route path="medical-vault" element={<ComingSoon title="Medical Vault" icon="🗄️" description="Platform-wide document storage metrics and access controls." />} />
            <Route path="ai-chat" element={<ComingSoon title="AI Triage Chat" icon="🤖" description="AI chat configuration, usage analytics, and escalation monitoring." />} />
            <Route path="health-updates" element={<ComingSoon title="Health Updates" icon="💊" description="Manage AI-generated daily health tips and delivery stats." />} />
            <Route path="notifications" element={<ComingSoon title="Notification Center" icon="🔔" description="Configure push notifications, email templates, and delivery settings." />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
