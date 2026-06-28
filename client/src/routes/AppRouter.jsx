import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Layout
import MainLayout from '../components/layout/MainLayout';

// Auth pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyOtp from '../pages/VerifyOtp';
import ForgotPassword from '../pages/ForgotPassword';

// Public pages
import HomePage from '../pages/Home';
import AboutPage from '../pages/About';
import ServicesPage from '../pages/Services';
import ContactPage from '../pages/Contact';
import DoctorDetailPage from '../pages/DoctorDetail';

// Flattened Dashboard pages
import AppointmentsPage from '../pages/Appointments';
import AppointmentDetailPage from '../pages/Appointments/Detail';
import BookAppointmentPage from '../pages/BookAppointment';
import ProfilePage from '../pages/Profile';
import PrescriptionsPage from '../pages/Prescriptions';
import PrescriptionDetailPage from '../pages/Prescriptions/Detail';
import RemindersPage from '../pages/Reminders';
import MedicalRecordsPage from '../pages/MedicalRecords';
import ChatPage from '../pages/Chat';
import PaymentsPage from '../pages/Payments';
import VIPPage from '../pages/VIP';
import HealthFeedPage from '../pages/HealthFeed';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route element={<MainLayout />}>
            {/* ─── Public Routes ─── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/doctors/:id" element={<DoctorDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* ─── Auth Routes ─── */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ─── Protected Routes (Flattened) ─── */}
            <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
            <Route path="/appointments/:id" element={<ProtectedRoute><AppointmentDetailPage /></ProtectedRoute>} />
            <Route path="/book-appointment" element={<ProtectedRoute><BookAppointmentPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/prescriptions" element={<ProtectedRoute><PrescriptionsPage /></ProtectedRoute>} />
            <Route path="/prescriptions/:id" element={<ProtectedRoute><PrescriptionDetailPage /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
            <Route path="/medical-records" element={<ProtectedRoute><MedicalRecordsPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
            <Route path="/vip" element={<ProtectedRoute><VIPPage /></ProtectedRoute>} />
            <Route path="/health-feed" element={<ProtectedRoute><HealthFeedPage /></ProtectedRoute>} />

            {/* ─── Catch-all ─── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
