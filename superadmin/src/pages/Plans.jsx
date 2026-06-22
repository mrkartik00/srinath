import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

const FEATURE_LABELS = {
  appointments: 'Appointments',
  prescriptions: 'Prescriptions',
  reminders: 'Medicine Reminders',
  chat: 'Chat with Patients',
  ai_chat: 'AI Chat Triage',
  health_updates: 'Health Updates',
  vault: 'Medical Vault',
  analytics: 'Analytics Dashboard',
  priority_support: 'Priority Support',
  virtual_consults: 'Virtual Consultations',
  whatsapp_delivery: 'WhatsApp Delivery',
};

const emptyForm = { name: '', description: '', price: '', interval: 'monthly', planType: 'doctor', maxPatients: 100, features: [], sortOrder: 0 };

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchPlans = () => api.get('/api/v1/superadmin/plans').then((r) => setPlans(r.data)).catch(() => {});
  const fetchFeatures = () => api.get('/api/v1/superadmin/plans/features').then((r) => setAvailableFeatures(r.data)).catch(() => {});

  useEffect(() => { fetchPlans(); fetchFeatures(); }, []);

  const toggleFeature = (f) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(f) ? prev.features.filter(x => x !== f) : [...prev.features, f]
    }));
  };

  const openEdit = (plan) => {
    setForm({ name: plan.name, description: plan.description || '', price: plan.price, interval: plan.interval, planType: plan.planType || 'doctor', maxPatients: plan.maxPatients, features: plan.features || [], sortOrder: plan.sortOrder || 0 });
    setEditingId(plan._id);
    setShowForm(true);
  };

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return toast.error('Name and price required');
    setLoading(true);
    try {
      const payload = { ...form, price: +form.price, maxPatients: +form.maxPatients, sortOrder: +form.sortOrder };
      if (editingId) {
        await api.patch(`/api/v1/superadmin/plans/${editingId}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/api/v1/superadmin/plans', payload);
        toast.success('Plan created');
      }
      resetForm();
      fetchPlans();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setLoading(false);
  };

  const handleToggle = async (id) => {
    try { await api.patch(`/api/v1/superadmin/plans/${id}/toggle`); fetchPlans(); } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this plan permanently?')) return;
    try { await api.delete(`/api/v1/superadmin/plans/${id}`); toast.success('Deleted'); fetchPlans(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Subscription Plans</h1>
        <button onClick={() => showForm ? resetForm() : setShowForm(true)} className="px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm hover:bg-[#5558e6] transition">
          {showForm ? 'Cancel' : '+ New Plan'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1e293b] rounded-xl p-6 border border-white/10 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs text-white/50 mb-1">Plan Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]" placeholder="e.g. Professional" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Price (₹) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Billing Interval</label>
              <select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#6366f1]">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Plan Type</label>
              <select value={form.planType} onChange={(e) => setForm({ ...form, planType: e.target.value })} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#6366f1]">
                <option value="doctor">Doctor Plan</option>
                <option value="patient">Patient Plan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Max Patients</label>
              <input type="number" value={form.maxPatients} onChange={(e) => setForm({ ...form, maxPatients: e.target.value })} min="1" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#6366f1]" disabled={form.planType === 'patient'} />
              {form.planType === 'patient' && <p className="text-[10px] text-white/30 mt-1">Not applicable for patient plans</p>}
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#6366f1]" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]" placeholder="Short plan description" />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-2">Features (select what's included)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableFeatures.map((f) => (
                <label key={f} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${form.features.includes(f) ? 'bg-[#6366f1]/20 border-[#6366f1] text-white' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}>
                  <input type="checkbox" checked={form.features.includes(f)} onChange={() => toggleFeature(f)} className="sr-only" />
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${form.features.includes(f) ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'border-white/30'}`}>
                    {form.features.includes(f) && '✓'}
                  </span>
                  <span className="text-xs">{FEATURE_LABELS[f] || f}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#5558e6] transition disabled:opacity-50">
            {loading ? 'Saving...' : editingId ? 'Update Plan' : 'Create Plan'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p._id} className={`bg-[#1e293b] rounded-xl border p-5 transition ${p.isActive ? 'border-white/10' : 'border-red-500/20 opacity-60'}`}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">{p.name}</h3>
              <div className="flex items-center gap-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${p.planType === 'doctor' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {p.planType}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            {p.description && <p className="text-xs text-white/40 mb-3">{p.description}</p>}
            <p className="text-2xl font-bold text-white">₹{p.price.toLocaleString()}<span className="text-xs text-white/40 font-normal">/{p.interval}</span></p>
            {p.planType === 'doctor' && <p className="text-xs text-white/40 mt-1">Max {p.maxPatients >= 10000 ? 'Unlimited' : p.maxPatients} patients</p>}

            {p.features?.length > 0 && (
              <div className="mt-3 space-y-1">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-1.5">
                    <span className="text-green-400 text-xs">✓</span>
                    <span className="text-xs text-white/60">{FEATURE_LABELS[f] || f}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
              <button onClick={() => openEdit(p)} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition">Edit</button>
              <button onClick={() => handleToggle(p._id)} className={`px-3 py-1.5 text-xs rounded-lg transition ${p.isActive ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400' : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'}`}>
                {p.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => handleDelete(p._id)} className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition ml-auto">Delete</button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <p className="col-span-3 text-center text-white/40 text-sm py-10">No plans created yet</p>}
      </div>
    </div>
  );
}
