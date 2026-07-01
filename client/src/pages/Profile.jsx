import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateMyProfile, createProfile } from '../api/endpoints/patient';
import { getMyAppointments } from '../api/endpoints/appointment';
import api from '../api/axios';
import { Input, Spinner } from '../components/ui';
import { LogOut, Pencil, X, Check, User, MapPin, Phone, Droplets, Calendar, Activity } from 'lucide-react';

const calculateAge = (dobString) => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatAddress = (addr) => {
  if (!addr) return '';
  return [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ');
};

function InfoRow({ label, value, colSpan }) {
  return (
    <div style={{ gridColumn: colSpan ? `span ${colSpan}` : undefined }}>
      <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B7C84', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px', margin: '0 0 3px' }}>{label}</p>
      <p style={{ fontSize: '14px', fontWeight: 600, color: value ? '#253a5a' : '#6B7C84', opacity: value ? 1 : 0.35, margin: 0 }}>{value || '—'}</p>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [genders, setGenders] = useState([]);

  const [form, setForm] = useState({
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    emergencyContact: { name: '', phone: '', relation: '' },
    allergies: '',
  });

  const selectStyle = {
    width: '100%', padding: '10px 14px', background: '#ffffff',
    border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px',
    color: '#253a5a', outline: 'none', fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box',
  };

  useEffect(() => {
    Promise.all([
      getMyProfile().catch((err) => {
        if (err.response?.status === 404) return createProfile({}).then(() => getMyProfile());
        throw err;
      }),
      api.get('/api/v1/config/constants'),
      getMyAppointments({ limit: 50 }).catch(() => ({ data: [] })),
    ])
      .then(([profileRes, configRes, apptRes]) => {
        const p = profileRes.data;
        setProfileData(p);
        setForm({
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
          gender: p.gender || '',
          bloodGroup: p.bloodGroup || '',
          address: p.address || { street: '', city: '', state: '', zipCode: '' },
          emergencyContact: p.emergencyContact || { name: '', phone: '', relation: '' },
          allergies: p.allergies?.join(', ') || '',
        });
        setBloodGroups(configRes.data?.bloodGroups || []);
        setGenders(configRes.data?.genders || []);
        if (apptRes?.data) setAppointments(apptRes.data);
      })
      .catch(() => { toast.error('Failed to load profile'); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        allergies: form.allergies ? form.allergies.split(',').map((a) => a.trim()).filter(Boolean) : [],
      };
      const res = await updateMyProfile(payload);
      setProfileData(res.data);
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profileData) {
      setForm({
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
        gender: profileData.gender || '',
        bloodGroup: profileData.bloodGroup || '',
        address: profileData.address || { street: '', city: '', state: '', zipCode: '' },
        emergencyContact: profileData.emergencyContact || { name: '', phone: '', relation: '' },
        allergies: profileData.allergies?.join(', ') || '',
      });
    }
    setIsEditing(false);
  };

  const initials = profileData?.userId?.name
    ? profileData.userId.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PT';
  const age = calculateAge(profileData?.dateOfBirth);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{
      background: '#f0f4f8',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
      padding: '28px 28px 0',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: "'Figtree', sans-serif", fontSize: '26px', fontWeight: 800, color: '#253a5a', margin: 0, letterSpacing: '-0.02em' }}>
            My Profile
          </h1>
          <p style={{ fontSize: '13px', color: '#6B7C84', marginTop: '3px', fontWeight: 500 }}>
            View and manage your personal medical information
          </p>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            border: '1px solid #fca5a5', borderRadius: '999px',
            padding: '8px 18px', background: 'transparent',
            color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          <LogOut size={14} /> Log Out
        </button>
      </div>

      {/* Main two-column layout — fills remaining space, no outer scroll */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', paddingBottom: '28px' }}>

        {/* LEFT: Profile Card */}
        <div style={{ width: '264px', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', border: '1px solid #eaedf1',
            padding: '24px 20px', boxShadow: '0 4px 20px rgba(54,86,95,0.04)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          }}>
            {/* Avatar with upload */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #d4e8ec 0%, #b8d8df 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px', fontWeight: 900, color: '#36565F',
                fontFamily: "'Figtree', sans-serif",
                border: '3px solid #ffffff',
                boxShadow: '0 4px 16px rgba(54,86,95,0.15)',
                overflow: 'hidden',
              }}>
                {profileData?.userId?.avatar ? (
                  <img src={profileData.userId.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : initials}
              </div>
              <label style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#253a5a', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                  const formData = new FormData();
                  formData.append('avatar', file);
                  try {
                    const baseUrl = import.meta.env.VITE_API_URL || '';
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${baseUrl}/api/v1/auth/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
                    const data = await res.json();
                    if (data.success) {
                      setProfileData(prev => ({ ...prev, userId: { ...prev.userId, avatar: data.data.avatar } }));
                      toast.success('Profile picture updated!');
                    } else toast.error(data.message || 'Upload failed');
                  } catch { toast.error('Failed to upload'); }
                  e.target.value = '';
                }} />
              </label>
            </div>

            {/* Name & email */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontFamily: "'Figtree', sans-serif", fontSize: '16px', fontWeight: 800, color: '#253a5a', margin: 0 }}>
                {profileData?.userId?.name || 'Patient'}
              </h3>
              <p style={{ fontSize: '11px', color: '#6B7C84', marginTop: '3px', fontWeight: 500 }}>
                {profileData?.userId?.email}
              </p>
            </div>

            {/* Badge */}
            <span style={{
              background: '#e2f0f0', color: '#36565F', fontSize: '9px', fontWeight: 800,
              letterSpacing: '0.07em', textTransform: 'uppercase', borderRadius: '6px', padding: '3px 10px',
            }}>
              Patient Member
            </span>

            <div style={{ width: '100%', height: '1px', background: '#eaedf1' }} />

            {/* Quick stats */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {[
                { icon: <Calendar size={13} />, label: 'Date of Birth', value: profileData?.dateOfBirth ? formatDate(profileData.dateOfBirth) : '—' },
                { icon: <User size={13} />, label: 'Age', value: age !== null ? `${age} years` : '—' },
                { icon: <Droplets size={13} />, label: 'Blood Group', value: profileData?.bloodGroup || '—' },
                { icon: <Activity size={13} />, label: 'Appointments', value: String(appointments.length) },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#6B7C84' }}>
                    {icon}
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>{label}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#253a5a' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ width: '100%', height: '1px', background: '#eaedf1' }} />

            {/* Edit button */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  background: '#36565F', color: '#ffffff', border: 'none',
                  borderRadius: '10px', padding: '10px 0', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Pencil size={13} /> Edit Profile
              </button>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  form="profile-form"
                  type="submit"
                  disabled={saving}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    background: '#36565F', color: '#ffffff', border: 'none',
                    borderRadius: '10px', padding: '10px 0', fontSize: '13px', fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                  }}
                >
                  <Check size={13} /> {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    background: 'transparent', color: '#6B7C84', border: '1px solid #eaedf1',
                    borderRadius: '10px', padding: '9px 0', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <X size={13} /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Profile Particulars — scrolls internally */}
        <div style={{
          flex: 1, minWidth: 0, overflowY: 'auto',
          background: '#ffffff', borderRadius: '20px', border: '1px solid #eaedf1',
          boxShadow: '0 4px 20px rgba(54,86,95,0.04)',
        }}>
          {/* Sticky header */}
          <div style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid #eaedf1',
            position: 'sticky', top: 0, background: '#ffffff', zIndex: 1,
            borderRadius: '20px 20px 0 0',
          }}>
            <h2 style={{ fontFamily: "'Figtree', sans-serif", fontSize: '18px', fontWeight: 800, color: '#253a5a', margin: 0 }}>
              Profile Particulars
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7C84', marginTop: '3px' }}>
              Personal, medical, and contact information
            </p>
          </div>

          <div style={{ padding: '24px 28px' }}>

            {/* VIEW mode */}
            {!isEditing && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '22px 28px' }}>
                <InfoRow label="Full Name" value={profileData?.userId?.name} />
                <InfoRow label="Email" value={profileData?.userId?.email} />
                <InfoRow label="Status" value="Active ✓" />
                <InfoRow label="Gender" value={profileData?.gender} />
                <InfoRow label="Date of Birth" value={formatDate(profileData?.dateOfBirth)} />
                <InfoRow label="Blood Group" value={profileData?.bloodGroup} />

                <div style={{ gridColumn: 'span 3', height: '1px', background: '#eaedf1' }} />

                <InfoRow label="Emergency Contact"
                  value={profileData?.emergencyContact?.name
                    ? `${profileData.emergencyContact.name} (${profileData.emergencyContact.relation || 'Relation'})`
                    : null}
                />
                <InfoRow label="Emergency Phone" value={profileData?.emergencyContact?.phone} />
                <InfoRow label="Registered Since" value={formatDate(profileData?.createdAt)} />

                <div style={{ gridColumn: 'span 3', height: '1px', background: '#eaedf1' }} />

                <InfoRow label="Allergies"
                  value={profileData?.allergies?.length > 0 ? profileData.allergies.join(', ') : null}
                  colSpan={2}
                />
                <InfoRow label="Address" value={formatAddress(profileData?.address)} colSpan={3} />
              </div>
            )}

            {/* EDIT mode */}
            {isEditing && (
              <form id="profile-form" onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* Personal */}
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px' }}>Personal Details</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                      <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1e293b', marginBottom: '6px' }}>Gender</label>
                        <select style={selectStyle} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                          <option value="">Select</option>
                          {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1e293b', marginBottom: '6px' }}>Blood Group</label>
                        <select style={selectStyle} value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                          <option value="">Select</option>
                          {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{ borderTop: '1px solid #eaedf1', paddingTop: '20px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={12} /> Residential Address
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                      <Input label="Street Address" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
                      <Input label="City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
                      <Input label="State" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
                      <Input label="Zip Code" value={form.address.zipCode} onChange={(e) => setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })} />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div style={{ borderTop: '1px solid #eaedf1', paddingTop: '20px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Phone size={12} /> Emergency Contact
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                      <Input label="Contact Name" value={form.emergencyContact.name} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} />
                      <Input label="Contact Phone" value={form.emergencyContact.phone} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })} />
                      <Input label="Relation" value={form.emergencyContact.relation} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, relation: e.target.value } })} />
                    </div>
                  </div>

                  {/* Allergies */}
                  <div style={{ borderTop: '1px solid #eaedf1', paddingTop: '20px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px' }}>Medical Notes</p>
                    <Input label="Allergies (comma-separated)" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
                  </div>

                </div>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
