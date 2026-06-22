import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyProfile, updateMyProfile } from '../api/endpoints/patient';
import api from '../api/axios';
import { Button, Input, Card, CardContent, Spinner } from '../components/ui';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [genders, setGenders] = useState([]);
  const [form, setForm] = useState({
    dateOfBirth: '', gender: '', bloodGroup: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    emergencyContact: { name: '', phone: '', relation: '' },
    allergies: '',
  });

  useEffect(() => {
    Promise.all([getMyProfile(), api.get('/api/v1/config/constants')])
      .then(([profileRes, configRes]) => {
        const p = profileRes.data;
        setForm({
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
          gender: p.gender || '', bloodGroup: p.bloodGroup || '',
          address: p.address || { street: '', city: '', state: '', zipCode: '' },
          emergencyContact: p.emergencyContact || { name: '', phone: '', relation: '' },
          allergies: p.allergies?.join(', ') || '',
        });
        setBloodGroups(configRes.data?.bloodGroups || []);
        setGenders(configRes.data?.genders || []);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({ ...form, allergies: form.allergies ? form.allergies.split(',').map((a) => a.trim()).filter(Boolean) : [] });
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner size="lg" />;

  const selectClass = "w-full px-3.5 py-2.5 bg-white border border-[#E8E5DE] rounded-[10px] text-sm transition-all duration-200 hover:border-[#36565F]/30 focus:outline-none focus:ring-2 focus:ring-[#36565F]/20 focus:border-[#36565F]";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-serif font-semibold text-[#1e293b]">My Profile</h1>
        <p className="text-sm text-[#64748b] mt-0.5">Manage your medical and personal information</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div>
              <h3 className="text-sm font-semibold text-[#1e293b] mb-3 uppercase tracking-wider">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Gender</label>
                  <select className={selectClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Select</option>
                    {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Blood Group</label>
                  <select className={selectClass} value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                    <option value="">Select</option>
                    {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold text-[#1e293b] mb-3 uppercase tracking-wider">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Street" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
                <Input label="City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
                <Input label="State" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
                <Input label="Zip Code" value={form.address.zipCode} onChange={(e) => setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })} />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-sm font-semibold text-[#1e293b] mb-3 uppercase tracking-wider">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Name" value={form.emergencyContact.name} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} />
                <Input label="Phone" value={form.emergencyContact.phone} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })} />
                <Input label="Relation" value={form.emergencyContact.relation} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, relation: e.target.value } })} />
              </div>
            </div>

            {/* Medical */}
            <div>
              <h3 className="text-sm font-semibold text-[#1e293b] mb-3 uppercase tracking-wider">Medical Info</h3>
              <Input label="Allergies (comma separated)" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="e.g. penicillin, peanuts" />
            </div>

            <Button type="submit" size="lg" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
