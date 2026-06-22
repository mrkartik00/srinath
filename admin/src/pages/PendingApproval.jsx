import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export default function PendingApproval() {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const isRejected = user?.approvalStatus === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0] px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#255946]/10 flex items-center justify-center text-4xl">
          {isRejected ? '❌' : '⏳'}
        </div>
        <h1 className="text-2xl font-serif font-semibold text-[#1e293b] mb-2">
          {isRejected ? 'Registration Rejected' : 'Approval Pending'}
        </h1>
        <p className="text-[#64748b] text-sm mb-8">
          {isRejected
            ? 'Your registration was not approved. Please contact support for more information.'
            : 'Your registration is under review. You will be able to access the dashboard once the admin approves your account.'}
        </p>
        <Button variant="secondary" onClick={logout}>Logout</Button>
      </div>
    </div>
  );
}
