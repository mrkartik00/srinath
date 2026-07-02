import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const DAYS = [
  { short: "Sun", full: "Sunday" },
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
];

export default function Availability() {
  const [slots, setSlots] = useState(DAYS.map((_, i) => ({ day: i, enabled: false, startTime: "09:00", endTime: "17:00" })));
  const [maxPatients, setMaxPatients] = useState(20);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/doctor/profile").then(({ data }) => {
      const { profile } = data;
      setMaxPatients(profile.maxPatientsPerDay || 20);
      if (profile.availableSlots?.length) {
        setSlots(DAYS.map((_, i) => {
          const s = profile.availableSlots.find(sl => sl.day === i);
          return s ? { day: i, enabled: true, startTime: s.startTime, endTime: s.endTime }
                   : { day: i, enabled: false, startTime: "09:00", endTime: "17:00" };
        }));
      }
    }).catch(() => toast.error("Failed to load availability"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/api/v1/doctor/profile", {
        availableSlots: slots.filter(s => s.enabled).map(({ day, startTime, endTime }) => ({ day, startTime, endTime })),
        maxPatientsPerDay: maxPatients,
      });
      toast.success("Availability updated");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const toggle = (i) => { const s = [...slots]; s[i] = { ...s[i], enabled: !s[i].enabled }; setSlots(s); };
  const update = (i, key, val) => { const s = [...slots]; s[i] = { ...s[i], [key]: val }; setSlots(s); };

  const enabledCount = slots.filter(s => s.enabled).length;

  if (loading) return (
    <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
      <div className="animate-spin h-8 w-8 border-4 border-[#273d71] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col" style={{ fontFamily: "'Figtree', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#1e293b]">Availability</h1>
          <p className="text-xs text-[#64748b] mt-0.5">{enabledCount} day{enabledCount !== 1 ? "s" : ""} active this week</p>
        </div>
        <button
          onClick={handleSave} disabled={saving}
          className="px-5 py-2 bg-[#273d71] text-white text-sm font-semibold rounded-lg hover:bg-[#1e2f58] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Availability"}
        </button>
      </div>

      {/* Main layout */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* LEFT — Weekly schedule */}
        <div className="flex-1 bg-white border border-[#E8E5DE] rounded-xl p-6 flex flex-col min-h-0">
          <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-4">Weekly Schedule</p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
            {slots.map((slot, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${slot.enabled ? "border-[#273d71]/20 bg-[#EFF6FF]" : "border-[#E8E5DE] bg-[#f8fafc]"}`}>
                {/* Checkbox + Day */}
                <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={() => toggle(i)}
                    className="accent-[#273d71] w-4 h-4"
                  />
                  <span className={`text-sm font-bold w-8 ${slot.enabled ? "text-[#273d71]" : "text-[#94a3b8]"}`}>
                    {DAYS[i].short}
                  </span>
                </label>

                {/* Time pickers */}
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="time"
                    value={slot.startTime}
                    disabled={!slot.enabled}
                    onChange={e => update(i, "startTime", e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-[#E8E5DE] rounded-lg bg-white disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:border-[#273d71] transition-colors min-w-0"
                  />
                  <span className="text-[10px] text-[#94a3b8] flex-shrink-0">–</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    disabled={!slot.enabled}
                    onChange={e => update(i, "endTime", e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-[#E8E5DE] rounded-lg bg-white disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:border-[#273d71] transition-colors min-w-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Settings & quick actions */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">

          {/* Max patients card */}
          <div className="bg-white border border-[#E8E5DE] rounded-xl p-6">
            <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-4">Capacity</p>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#1e293b]">Max Patients/Day</span>
              <span className="text-lg font-bold text-[#273d71] bg-[#EFF6FF] w-10 h-10 rounded-full flex items-center justify-center">
                {maxPatients}
              </span>
            </div>
            <input
              type="range" min={1} max={50} value={maxPatients}
              onChange={e => setMaxPatients(+e.target.value)}
              className="w-full accent-[#273d71]"
            />
            <div className="flex justify-between text-[10px] text-[#94a3b8] mt-1.5">
              <span>1 patient</span><span>50 patients</span>
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-white border border-[#E8E5DE] rounded-xl p-6 flex-1">
            <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-4">This Week</p>
            <div className="space-y-2">
              {slots.map((slot, i) => (
                <div key={i} className={`flex items-center justify-between text-xs rounded-lg px-3 py-2 ${slot.enabled ? "bg-[#EFF6FF] text-[#273d71]" : "bg-[#f8fafc] text-[#94a3b8]"}`}>
                  <span className="font-semibold">{DAYS[i].full}</span>
                  {slot.enabled
                    ? <span className="font-medium">{slot.startTime} – {slot.endTime}</span>
                    : <span className="italic">Off</span>
                  }
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
