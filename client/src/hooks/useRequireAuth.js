import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/**
 * useRequireAuth
 * Returns a `requireAuth(fn)` helper.
 * If user is logged in  → calls fn()
 * If user is a guest    → shows a toast + redirects to /login
 *
 * Usage:
 *   const requireAuth = useRequireAuth();
 *   <button onClick={() => requireAuth(() => navigate('/book-appointment'))}>Book</button>
 */
export default function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (fn) => {
    if (user) {
      fn();
    } else {
      toast.error('Please login to continue', {
        icon: '🔒',
        style: { fontWeight: 600, fontSize: '14px' },
      });
      navigate('/login');
    }
  };
}
