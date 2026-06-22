import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register as registerApi } from '../api/endpoints/auth';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', specialization: '', qualification: '', licenseNumber: '', experience: '', clinicName: '', clinicAddress: '', aboutMe: '', consultationFee: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerApi({ ...form, experience: +form.experience, consultationFee: +form.consultationFee || 0 });
      login(res.data.accessToken, res.data.user);
      toast.success('Registration submitted! Awaiting approval.');
      navigate('/pending-approval');
    } catch (err) { toast.error(err.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-[#255946] via-[#1e4d3d] to-[#0f2a20] relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-bold text-sm">S+</div>
            <span className="text-xl font-serif font-bold">SurgiRise</span>
          </div>
          <div>
            <h2 className="text-4xl font-serif font-semibold leading-tight mb-4">Join Our Platform</h2>
            <p className="text-white/60 text-base max-w-sm">Register as a doctor to manage patients, prescriptions, and grow your practice digitally.</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <span>🔒 Secure</span><span>•</span><span>⚡ Fast Approval</span><span>•</span><span>🏥 Clinical</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-[#F8F6F0] px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-semibold text-[#1e293b]">Doctor Registration</h1>
            <p className="text-sm text-[#64748b] mt-1">Fill your details to register. Admin will review and approve.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name *" value={form.name} onChange={set('name')} placeholder="Dr. John Smith" required />
              <Input label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="doctor@example.com" required />
              <Input label="Password *" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required />
              <Input label="Phone *" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" required />
              <Input label="Specialization *" value={form.specialization} onChange={set('specialization')} placeholder="Orthopedics" required />
              <Input label="Qualification *" value={form.qualification} onChange={set('qualification')} placeholder="MBBS, MS" required />
              <Input label="License Number *" value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="MCI-12345" required />
              <Input label="Experience (years) *" type="number" value={form.experience} onChange={set('experience')} placeholder="5" required />
              <Input label="Clinic Name" value={form.clinicName} onChange={set('clinicName')} placeholder="City Hospital" />
              <Input label="Consultation Fee (₹)" type="number" value={form.consultationFee} onChange={set('consultationFee')} placeholder="500" />
            </div>
            <Input label="Clinic Address" value={form.clinicAddress} onChange={set('clinicAddress')} placeholder="123 Main St, City" />
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1.5">About Me</label>
              <textarea value={form.aboutMe} onChange={set('aboutMe')} placeholder="Brief description about your practice..." rows={3} className="w-full px-3.5 py-2.5 bg-white border border-[#E8E5DE] rounded-[10px] text-sm placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#255946]/20 focus:border-[#255946] hover:border-[#255946]/30 transition-all" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? 'Submitting...' : 'Register'}</Button>
            <p className="text-center text-sm text-[#64748b]">Already have an account? <Link to="/login" className="text-[#255946] font-medium hover:underline">Sign In</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
}
