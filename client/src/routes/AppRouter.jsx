import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import PatientLayout from '../components/layout/PatientLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import BookAppointment from '../pages/BookAppointment';
import MyAppointments from '../pages/MyAppointments';
import AppointmentDetail from '../pages/AppointmentDetail';
import MyPrescriptions from '../pages/MyPrescriptions';
import PrescriptionDetail from '../pages/PrescriptionDetail';
import MyReminders from '../pages/MyReminders';
import Chat from '../pages/Chat';
import ComingSoon from '../pages/ComingSoon';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><PatientLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="book-appointment" element={<BookAppointment />} />
            <Route path="appointments" element={<MyAppointments />} />
            <Route path="appointments/:id" element={<AppointmentDetail />} />
            <Route path="prescriptions" element={<MyPrescriptions />} />
            <Route path="prescriptions/:id" element={<PrescriptionDetail />} />
            <Route path="reminders" element={<MyReminders />} />
            {/* Coming Soon */}
            <Route path="medical-vault" element={<ComingSoon title="Medical Vault" icon="🗄️" />} />
            <Route path="chat" element={<Chat />} />
            <Route path="subscription" element={<ComingSoon title="VIP Subscription" icon="💎" />} />
            <Route path="vip-card" element={<ComingSoon title="Digital VIP Card" icon="🪪" />} />
            <Route path="payments" element={<ComingSoon title="My Payments" icon="💳" />} />
            <Route path="health-feed" element={<ComingSoon title="Health Feed" icon="📚" />} />
            <Route path="referrals" element={<ComingSoon title="Refer & Earn" icon="🎁" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
