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
        <h1 className="text-xl font-bold text-[#1e293b]">Subscription Plans</h1>
        <button onClick={() => showForm ? resetForm() : setShowForm(true)} className="px-4 py-2 bg-[#273d71] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f58] transition">
          {showForm ? 'Cancel' : '+ New Plan'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-[#64748b] mb-1">Plan Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1e293b] placeholder:text-gray-400 focus:outline-none focus:border-[#273d71]" placeholder="e.g. Professional" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Price (₹) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1e293b] placeholder:text-gray-400 focus:outline-none focus:border-[#273d71]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Billing Interval</label>
              <select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1e293b] focus:outline-none focus:border-[#273d71]">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Plan Type</label>
              <select value={form.planType} onChange={(e) => setForm({ ...form, planType: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1e293b] focus:outline-none focus:border-[#273d71]">
                <option value="doctor">Doctor Plan</option>
                <option value="patient">Patient Plan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Max Patients</label>
              <input type="number" value={form.maxPatients} onChange={(e) => setForm({ ...form, maxPatients: e.target.value })} min="1" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1e293b] focus:outline-none focus:border-[#273d71]" disabled={form.planType === 'patient'} />
              {form.planType === 'patient' && <p className="text-[10px] text-gray-400 mt-1">Not applicable for patient plans</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1e293b] focus:outline-none focus:border-[#273d71]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1e293b] placeholder:text-gray-400 focus:outline-none focus:border-[#273d71]" placeholder="Short plan description" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-2">Features (select what's included)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableFeatures.map((f) => (
                <label key={f} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${form.features.includes(f) ? 'bg-[#f4f5f9] border-[#273d71]/30 text-[#1e293b]' : 'bg-white border-gray-100 text-[#64748b] hover:border-gray-200'}`}>
                  <input type="checkbox" checked={form.features.includes(f)} onChange={() => toggleFeature(f)} className="sr-only" />
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${form.features.includes(f) ? 'bg-[#273d71] border-[#273d71] text-white' : 'border-gray-200'}`}>
                    {form.features.includes(f) && '✓'}
                  </span>
                  <span className={`text-xs ${form.features.includes(f) ? 'font-medium' : ''}`}>{FEATURE_LABELS[f] || f}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#273d71] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f58] transition disabled:opacity-50">
            {loading ? 'Saving...' : editingId ? 'Update Plan' : 'Create Plan'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div key={p._id} className={`bg-white rounded-2xl border shadow-sm p-6 transition-all ${p.isActive ? 'border-gray-100 hover:border-[#273d71]/20 hover:shadow-md' : 'border-red-100 opacity-75'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[#1e293b]">{p.name}</h3>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${p.planType === 'doctor' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {p.planType}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${p.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            {p.description && <p className="text-xs text-[#64748b] mb-4 line-clamp-2">{p.description}</p>}
            
            <div className="mb-4">
              <span className="text-3xl font-bold text-[#1e293b]">₹{p.price.toLocaleString()}</span>
              <span className="text-sm text-[#94a3b8] font-medium">/{p.interval}</span>
            </div>
            
            {p.planType === 'doctor' && (
              <p className="text-xs font-medium text-[#64748b] mb-4 bg-[#f4f5f9] inline-block px-2 py-1 rounded">
                Max {p.maxPatients >= 10000 ? 'Unlimited' : p.maxPatients} patients
              </p>
            )}

            {p.features?.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-gray-50 pt-4">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-medium text-[#64748b]">{FEATURE_LABELS[f] || f}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2">
              <button onClick={() => openEdit(p)} className="px-4 py-2 text-xs font-medium bg-gray-50 hover:bg-gray-100 text-[#1e293b] rounded-lg transition">Edit</button>
              <button onClick={() => handleToggle(p._id)} className={`px-4 py-2 text-xs font-medium rounded-lg transition ${p.isActive ? 'bg-orange-50 hover:bg-orange-100 text-orange-600' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}>
                {p.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => handleDelete(p._id)} className="px-4 py-2 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition ml-auto">Delete</button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <p className="col-span-full text-center text-[#64748b] text-sm py-12 bg-white rounded-xl border border-gray-100 border-dashed">No plans created yet</p>}
      </div>
    </div>
  );
}
