import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import PendingApproval from '../pages/PendingApproval';
import Dashboard from '../pages/Dashboard';
import Patients from '../pages/Patients';
import PatientDetail from '../pages/PatientDetail';
import Appointments from '../pages/Appointments';
import AppointmentDetail from '../pages/AppointmentDetail';
import Prescriptions from '../pages/Prescriptions';
import PrescriptionDetail from '../pages/PrescriptionDetail';
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
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="appointments/:id" element={<AppointmentDetail />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="prescriptions/:id" element={<PrescriptionDetail />} />
            <Route path="reminders" element={<ComingSoon title="Patient Reminders" icon="🔔" />} />
            <Route path="chat" element={<Chat />} />
            <Route path="medical-vault" element={<ComingSoon title="Medical Vault" icon="🗄️" />} />
            <Route path="profile" element={<ComingSoon title="My Profile" icon="👤" />} />
            <Route path="availability" element={<ComingSoon title="Availability Settings" icon="🕐" />} />
            <Route path="subscription" element={<ComingSoon title="My Subscription" icon="💎" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
