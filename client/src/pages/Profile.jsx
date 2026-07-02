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

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      padding: isMobile ? '16px 16px 0' : '28px 28px 0',
      boxSizing: 'border-box',
      overflow: isMobile ? 'auto' : 'hidden',
    }}>

      {/* Page Header */}
      <div style={{ marginBottom: '24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontFamily: "'Figtree', sans-serif", fontSize: '28px', fontWeight: 800, color: '#253a5a', margin: 0, letterSpacing: '-0.02em' }}>
            My Profile
          </h1>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              border: '1px solid #fca5a5', borderRadius: '999px',
              padding: '8px 16px', background: '#fef2f2',
              color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
        <p style={{ fontSize: '14px', color: '#6B7C84', marginTop: '6px', fontWeight: 500 }}>
          View and manage your personal medical information
        </p>
      </div>

      {/* Main two-column layout */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '20px', flex: isMobile ? 'none' : 1, overflow: isMobile ? 'visible' : 'hidden', paddingBottom: '24px' }}>

        {/* LEFT: Profile Card */}
        <div style={{ width: isMobile ? '100%' : '280px', flexShrink: 0, overflowY: isMobile ? 'visible' : 'auto' }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', border: '1px solid #eaedf1',
            padding: '24px 20px', boxShadow: '0 4px 24px rgba(54,86,95,0.06)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          }}>
            {/* Avatar with upload */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #d4e8ec 0%, #b8d8df 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 900, color: '#36565F',
                fontFamily: "'Figtree', sans-serif",
                border: '3px solid #ffffff',
                boxShadow: '0 4px 12px rgba(54,86,95,0.12)',
                overflow: 'hidden',
              }}>
                {profileData?.userId?.avatar ? (
                  <img src={profileData.userId.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : initials}
              </div>
              <label style={{
                position: 'absolute', bottom: '0px', right: '0px',
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#253a5a', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M6 2v8M2 6h8"/></svg>
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
            <div style={{ textAlign: 'center', width: '100%' }}>
              <h3 style={{ fontFamily: "'Figtree', sans-serif", fontSize: '18px', fontWeight: 800, color: '#253a5a', margin: '0 0 2px 0' }}>
                {profileData?.userId?.name || 'Patient'}
              </h3>
              <p style={{ fontSize: '12px', color: '#6B7C84', margin: 0, fontWeight: 500, wordBreak: 'break-all' }}>
                {profileData?.userId?.email}
              </p>
            </div>

            {/* Badge */}
            <span style={{
              background: '#e2f0f0', color: '#36565F', fontSize: '9px', fontWeight: 800,
              letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '6px', padding: '3px 10px',
            }}>
              Patient Member
            </span>

            <div style={{ width: '100%', height: '1px', background: '#eaedf1', margin: '4px 0' }} />

            {/* Quick stats */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: <Calendar size={14} />, label: 'Date of Birth', value: profileData?.dateOfBirth ? formatDate(profileData.dateOfBirth) : '—' },
                { icon: <User size={14} />, label: 'Age', value: age !== null ? `${age} years` : '—' },
                { icon: <Droplets size={14} />, label: 'Blood Group', value: profileData?.bloodGroup || '—' },
                { icon: <Activity size={14} />, label: 'Appointments', value: String(appointments.length) },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8db5c4' }}>
                    {icon}
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7C84' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#253a5a' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ width: '100%', height: '1px', background: '#eaedf1', margin: '4px 0' }} />

            {/* Edit button (Desktop) */}
            {!isMobile && (
              !isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    background: '#253a5a', color: '#ffffff', border: 'none',
                    borderRadius: '10px', padding: '10px 0', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    transition: 'background 0.2s',
                    boxShadow: '0 4px 10px rgba(37,58,90,0.2)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#36565F'}
                  onMouseLeave={e => e.currentTarget.style.background = '#253a5a'}
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
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      background: '#253a5a', color: '#ffffff', border: 'none',
                      borderRadius: '10px', padding: '10px 0', fontSize: '13px', fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                      transition: 'background 0.2s',
                    }}
                  >
                    <Check size={13} /> {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      background: 'transparent', color: '#6B7C84', border: '1.5px solid #eaedf1',
                      borderRadius: '10px', padding: '9px 0', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#253a5a'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7C84'; }}
                  >
                    <X size={13} /> Cancel
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* RIGHT: Profile Particulars */}
        <div style={{
          flex: isMobile ? 'none' : 1, minWidth: 0, overflowY: isMobile ? 'visible' : 'auto',
          background: '#ffffff', borderRadius: '20px', border: '1px solid #eaedf1',
          boxShadow: '0 4px 20px rgba(54,86,95,0.04)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Sticky header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #eaedf1',
            position: 'sticky', top: 0, background: '#ffffff', zIndex: 1,
            borderRadius: '20px 20px 0 0',
          }}>
            <h2 style={{ fontFamily: "'Figtree', sans-serif", fontSize: '18px', fontWeight: 800, color: '#253a5a', margin: 0 }}>
              Profile Particulars
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7C84', marginTop: '2px' }}>
              Personal, medical, and contact information
            </p>
          </div>

          <div style={{ padding: '20px 24px', flex: 1 }}>

            {/* VIEW mode */}
            {!isEditing && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px 32px' }}>
                
                {/* LEFT COLUMN: Personal + Allergies */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px' }}>Personal Details</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <InfoRow label="Full Name" value={profileData?.userId?.name} colSpan={2} />
                      <InfoRow label="Email" value={profileData?.userId?.email} colSpan={2} />
                      <InfoRow label="Status" value="Active ✓" />
                      <InfoRow label="Registered" value={formatDate(profileData?.createdAt)} />
                      <InfoRow label="Gender" value={profileData?.gender} />
                      <InfoRow label="Blood Group" value={profileData?.bloodGroup} />
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '1px', background: '#eaedf1' }} />

                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px' }}>Medical Notes (Allergies)</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {profileData?.allergies?.length > 0 ? (
                        profileData.allergies.map((allergy, i) => (
                          <span key={i} style={{ background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: '1px solid #fecaca' }}>
                            {allergy}
                          </span>
                        ))
                      ) : (
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#6B7C84', opacity: 0.5, margin: 0 }}>None reported</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Address + Emergency */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> Residential Address
                    </p>
                    <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: profileData?.address?.street ? '#253a5a' : '#6B7C84', opacity: profileData?.address?.street ? 1 : 0.5, margin: 0 }}>
                        {formatAddress(profileData?.address) || 'No address provided'}
                      </p>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '1px', background: '#eaedf1' }} />

                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> Emergency Contact
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      <InfoRow label="Contact Name"
                        value={profileData?.emergencyContact?.name
                          ? `${profileData.emergencyContact.name} (${profileData.emergencyContact.relation || 'Relation'})`
                          : null}
                      />
                      <InfoRow label="Emergency Phone" value={profileData?.emergencyContact?.phone} />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* EDIT mode */}
            {isEditing && (
              <form id="profile-form" onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px 32px' }}>
                  
                  {/* LEFT COLUMN: Personal + Allergies */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px' }}>Personal Details</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                        <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#1e293b', marginBottom: '6px' }}>Gender</label>
                            <select style={{ ...selectStyle, padding: '8px 12px' }} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                              <option value="">Select</option>
                              {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#1e293b', marginBottom: '6px' }}>Blood Group</label>
                            <select style={{ ...selectStyle, padding: '8px 12px' }} value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                              <option value="">Select</option>
                              {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #eaedf1', paddingTop: '16px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px' }}>Medical Notes</p>
                      <Input label="Allergies (comma-separated)" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Address + Emergency */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> Residential Address
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                        <Input label="Street Address" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                          <Input label="City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
                          <Input label="State" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
                        </div>
                        <Input label="Zip Code" value={form.address.zipCode} onChange={(e) => setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })} />
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #eaedf1', paddingTop: '16px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#36565F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> Emergency Contact
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <Input label="Contact Name" value={form.emergencyContact.name} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} />
                        </div>
                        <Input label="Contact Phone" value={form.emergencyContact.phone} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })} />
                        <Input label="Relation" value={form.emergencyContact.relation} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, relation: e.target.value } })} />
                      </div>
                    </div>
                  </div>

                </div>
              </form>
            )}

          </div>

          {/* Edit button (Mobile) */}
          {isMobile && (
            <div style={{ borderTop: '1px solid #eaedf1', padding: '20px 24px', background: '#f8fafc', borderRadius: '0 0 20px 20px' }}>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    background: '#253a5a', color: '#ffffff', border: 'none',
                    borderRadius: '10px', padding: '12px 0', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(37,58,90,0.2)',
                  }}
                >
                  <Pencil size={14} /> Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    form="profile-form"
                    type="submit"
                    disabled={saving}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      background: '#253a5a', color: '#ffffff', border: 'none',
                      borderRadius: '10px', padding: '12px 0', fontSize: '14px', fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                    }}
                  >
                    <Check size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      background: '#ffffff', color: '#6B7C84', border: '1.5px solid #eaedf1',
                      borderRadius: '10px', padding: '11px 0', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
