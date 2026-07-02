import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DoctorProfile() {
  const [form, setForm] = useState(null);
  const [slots, setSlots] = useState(DAYS.map((_, i) => ({ day: i, enabled: false, startTime: "09:00", endTime: "17:00" })));
  const [maxPatients, setMaxPatients] = useState(20);
  const [isOnline, setIsOnline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    api.get("/api/v1/doctor/profile").then(({ data }) => {
      const { user, profile } = data;
      setAvatar(user.avatar || null);
      setForm({
        name: user.name, specialization: profile.specialization || "",
        qualification: profile.qualification || "", licenseNumber: profile.licenseNumber || "",
        experience: profile.experience || "", consultationFee: profile.consultationFee || "",
        clinicName: profile.clinicName || "", clinicAddress: profile.clinicAddress || "",
        aboutMe: profile.aboutMe || "",
      });
      setMaxPatients(profile.maxPatientsPerDay || 20);
      setIsOnline(profile.isOnline || false);
      if (profile.availableSlots?.length) {
        setSlots(DAYS.map((_, i) => {
          const s = profile.availableSlots.find(sl => sl.day === i);
          return s ? { day: i, enabled: true, startTime: s.startTime, endTime: s.endTime }
                   : { day: i, enabled: false, startTime: "09:00", endTime: "17:00" };
        }));
      }
    }).catch(() => toast.error("Failed to load profile"));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/api/v1/doctor/profile", {
        ...form,
        availableSlots: slots.filter(s => s.enabled).map(({ day, startTime, endTime }) => ({ day, startTime, endTime })),
        maxPatientsPerDay: maxPatients,
        isOnline,
      });
      toast.success("Profile updated");
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (!form) return (
    <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
      <div className="animate-spin h-8 w-8 border-4 border-[#273d71] border-t-transparent rounded-full" />
    </div>
  );

  const Field = ({ label, field, type = "text" }) => (
    <div>
      <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type} value={form[field]}
        onChange={e => setForm({ ...form, [field]: e.target.value })}
        className="w-full px-3 py-2 bg-[#f8fafc] border border-[#E8E5DE] rounded-lg text-xs text-[#1e293b] outline-none focus:border-[#273d71] focus:bg-white transition-colors"
      />
    </div>
  );

  const toggleSlot = (i) => { const s = [...slots]; s[i] = { ...s[i], enabled: !s[i].enabled }; setSlots(s); };
  const updateSlot = (i, key, val) => { const s = [...slots]; s[i] = { ...s[i], [key]: val }; setSlots(s); };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-[#1e293b]">My Profile</h1>
        <button
          onClick={handleSave} disabled={saving}
          className="px-5 py-2 bg-[#273d71] text-white text-sm font-semibold rounded-lg hover:bg-[#1e2f58] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* LEFT PANEL */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-4">

          {/* Avatar card */}
          <div className="bg-white border border-[#E8E5DE] rounded-xl p-5 flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#dce8f5] to-[#b8d0e8] border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-2xl font-bold text-[#273d71]">
                {avatar ? <img src={avatar} alt="Profile" className="w-full h-full object-cover" /> : (form.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "DR")}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#273d71] border-2 border-white flex items-center justify-center cursor-pointer shadow hover:bg-[#1e2f58] transition-colors">
                {avatarUploading
                  ? <svg className="animate-spin w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/></svg>
                  : <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M6.5 1v11M1 6.5h11"/></svg>
                }
                <input type="file" accept="image/*" className="hidden" disabled={avatarUploading} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
                  setAvatarUploading(true);
                  const fd = new FormData(); fd.append("avatar", file);
                  try {
                    const baseUrl = import.meta.env.VITE_API_URL || "";
                    const token = localStorage.getItem("token");
                    const res = await fetch(`${baseUrl}/api/v1/auth/avatar`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
                    const d = await res.json();
                    if (d.success) { setAvatar(d.data.avatar); toast.success("Photo updated!"); }
                    else toast.error(d.message || "Upload failed");
                  } catch { toast.error("Failed to upload"); }
                  finally { setAvatarUploading(false); e.target.value = ""; }
                }} />
              </label>
            </div>
            <h3 className="text-sm font-bold text-[#1e293b] leading-tight">{form.name}</h3>
            <p className="text-xs text-[#64748b] mt-0.5">{form.specialization || "Doctor"}</p>
            <p className="text-[10px] text-[#94a3b8] mt-2">Click + to change photo</p>
          </div>

          {/* Status & Settings card */}
          <div className="bg-white border border-[#E8E5DE] rounded-xl p-5 flex flex-col gap-4 flex-1">
            <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wide">Status & Settings</p>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#1e293b]">Online</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94a3b8]">{isOnline ? "Active" : "Offline"}</span>
                <button
                  onClick={() => setIsOnline(!isOnline)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${isOnline ? "bg-[#273d71]" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${isOnline ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1e293b]">Max Patients/Day</span>
                <span className="text-xs font-bold text-[#273d71] bg-[#EFF6FF] px-2 py-0.5 rounded-md">{maxPatients}</span>
              </div>
              <input type="range" min={1} max={50} value={maxPatients} onChange={e => setMaxPatients(+e.target.value)} className="w-full accent-[#273d71]" />
              <div className="flex justify-between text-[10px] text-[#94a3b8] mt-1"><span>1</span><span>50</span></div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">

          {/* Profile fields */}
          <div className="bg-white border border-[#E8E5DE] rounded-xl p-5 flex-shrink-0">
            <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-3">Profile Information</p>
            <div className="grid grid-cols-4 gap-3">
              <Field label="Full Name" field="name" />
              <Field label="Specialization" field="specialization" />
              <Field label="Qualification" field="qualification" />
              <Field label="License No." field="licenseNumber" />
              <Field label="Experience (yrs)" field="experience" type="number" />
              <Field label="Fee (₹)" field="consultationFee" type="number" />
              <Field label="Clinic Name" field="clinicName" />
              <Field label="Clinic Address" field="clinicAddress" />
            </div>
            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">About Me</label>
              <textarea
                value={form.aboutMe} onChange={e => setForm({ ...form, aboutMe: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-[#f8fafc] border border-[#E8E5DE] rounded-lg text-xs text-[#1e293b] outline-none focus:border-[#273d71] focus:bg-white resize-none transition-colors"
              />
            </div>
          </div>

          {/* Weekly Availability — compact 2-col */}
          <div className="bg-white border border-[#E8E5DE] rounded-xl p-5 flex-1">
            <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-3">Weekly Availability</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {slots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 w-10 flex-shrink-0 cursor-pointer select-none">
                    <input type="checkbox" checked={slot.enabled} onChange={() => toggleSlot(i)} className="accent-[#273d71] w-3.5 h-3.5" />
                    <span className={`text-xs font-semibold ${slot.enabled ? "text-[#273d71]" : "text-[#94a3b8]"}`}>{DAYS[i]}</span>
                  </label>
                  <input type="time" value={slot.startTime} disabled={!slot.enabled} onChange={e => updateSlot(i, "startTime", e.target.value)}
                    className="px-2 py-1 text-xs border border-[#E8E5DE] rounded-md bg-white disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:border-[#273d71] flex-1" />
                  <span className="text-[10px] text-[#94a3b8]">–</span>
                  <input type="time" value={slot.endTime} disabled={!slot.enabled} onChange={e => updateSlot(i, "endTime", e.target.value)}
                    className="px-2 py-1 text-xs border border-[#E8E5DE] rounded-md bg-white disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:border-[#273d71] flex-1" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
