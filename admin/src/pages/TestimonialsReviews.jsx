import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getReviews,
  approveReview,
  rejectReview,
} from '../api/endpoints/testimonials';

const TABS = ['Testimonials', 'Reviews'];
const STATUS_OPTIONS = ['all', 'pending', 'approved', 'rejected'];

function StarRating({ rating, max = 5, interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type={interactive ? 'button' : undefined}
          disabled={!interactive}
          onClick={() => interactive && onChange?.(i + 1)}
          className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          aria-label={`${i + 1} star`}
        >
          <span className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

export default function TestimonialsReviews() {
  const [activeTab, setActiveTab] = useState('Testimonials');

  // Testimonials state
  const [testimonials, setTestimonials] = useState([]);
  const [tLoading, setTLoading] = useState(true);
  const [form, setForm] = useState({ authorName: '', text: '', rating: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ authorName: '', text: '', rating: '' });
  const [submitting, setSubmitting] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [rLoading, setRLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch testimonials
  const fetchTestimonials = async () => {
    setTLoading(true);
    try {
      const data = await getTestimonials();
      setTestimonials(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load testimonials');
    } finally {
      setTLoading(false);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    setRLoading(true);
    try {
      const res = await getReviews(statusFilter === 'all' ? '' : statusFilter);
      setReviews(res.data || res.reviews || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load reviews');
    } finally {
      setRLoading(false);
    }
  };

  useEffect(() => { fetchTestimonials(); }, []);
  useEffect(() => { fetchReviews(); }, [statusFilter]);

  // Testimonial handlers
  const handleAddTestimonial = async (e) => {
    e.preventDefault();
    if (!form.authorName.trim() || !form.text.trim()) {
      toast.error('Author name and text are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { authorName: form.authorName.trim(), text: form.text.trim() };
      if (form.rating) payload.rating = Number(form.rating);
      await addTestimonial(payload);
      toast.success('Testimonial added');
      setForm({ authorName: '', text: '', rating: '' });
      fetchTestimonials();
    } catch (err) {
      toast.error(err.message || 'Failed to add testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTestimonial = async (tid) => {
    if (!editForm.authorName.trim() || !editForm.text.trim()) {
      toast.error('Author name and text are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { authorName: editForm.authorName.trim(), text: editForm.text.trim() };
      if (editForm.rating) payload.rating = Number(editForm.rating);
      else payload.rating = null;
      await updateTestimonial(tid, payload);
      toast.success('Testimonial updated');
      setEditingId(null);
      fetchTestimonials();
    } catch (err) {
      toast.error(err.message || 'Failed to update testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTestimonial = async (tid) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await deleteTestimonial(tid);
      toast.success('Testimonial deleted');
      fetchTestimonials();
    } catch (err) {
      toast.error(err.message || 'Failed to delete testimonial');
    }
  };

  const startEdit = (t) => {
    setEditingId(t._id);
    setEditForm({ authorName: t.authorName || '', text: t.text || '', rating: t.rating || '' });
  };

  // Review handlers
  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await approveReview(id);
      toast.success('Review approved');
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'Failed to approve review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await rejectReview(id);
      toast.success('Review rejected');
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'Failed to reject review');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-[#64748b]">Manage your testimonials and moderate patient reviews</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-[#E8E5DE]/60 p-1 shadow-[0_1px_3px_rgba(37,89,70,0.04)] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-[#273d71] text-white shadow-sm' : 'text-[#64748b] hover:text-[#273d71] hover:bg-gray-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Testimonials Tab */}
      {activeTab === 'Testimonials' && (
        <div className="space-y-4">
          {/* Add Form */}
          <div className="bg-white rounded-xl border border-[#E8E5DE]/60 p-5 shadow-[0_1px_3px_rgba(37,89,70,0.04)]">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Add Testimonial</h3>
            <form onSubmit={handleAddTestimonial} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Author name"
                  value={form.authorName}
                  onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71]"
                />
                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71] text-[#64748b]"
                >
                  <option value="">Rating (optional)</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Testimonial text..."
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71] resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#273d71] text-white text-sm font-medium rounded-lg hover:bg-[#1e2f58] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Testimonial'}
              </button>
            </form>
          </div>

          {/* Testimonials List */}
          <div className="bg-white rounded-xl border border-[#E8E5DE]/60 shadow-[0_1px_3px_rgba(37,89,70,0.04)]">
            {tLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#273d71] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : testimonials.length === 0 ? (
              <div className="text-center py-12 text-[#64748b] text-sm">
                No testimonials yet. Add one above.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {testimonials.map((t) => (
                  <div key={t._id} className="p-4">
                    {editingId === t._id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editForm.authorName}
                            onChange={(e) => setEditForm({ ...editForm, authorName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71]"
                          />
                          <select
                            value={editForm.rating}
                            onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71]"
                          >
                            <option value="">No rating</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          value={editForm.text}
                          onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71] resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateTestimonial(t._id)}
                            disabled={submitting}
                            className="px-3 py-1.5 bg-[#273d71] text-white text-xs font-medium rounded-lg hover:bg-[#1e2f58] transition-colors disabled:opacity-50"
                          >
                            {submitting ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 bg-gray-100 text-[#64748b] text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-[#1e293b]">{t.authorName}</span>
                            {t.rating && <StarRating rating={t.rating} />}
                          </div>
                          <p className="text-sm text-[#64748b] whitespace-pre-wrap">{t.text}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEdit(t)}
                            className="p-1.5 text-[#64748b] hover:text-[#273d71] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteTestimonial(t._id)}
                            className="p-1.5 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'Reviews' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="bg-white rounded-xl border border-[#E8E5DE]/60 p-4 shadow-[0_1px_3px_rgba(37,89,70,0.04)]">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-[#1e293b]">Filter:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#273d71]/20 focus:border-[#273d71]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-xl border border-[#E8E5DE]/60 shadow-[0_1px_3px_rgba(37,89,70,0.04)]">
            {rLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#273d71] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-[#64748b] text-sm">
                No reviews found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reviews.map((r) => (
                  <div key={r._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-[#1e293b]">
                            {r.patientName || r.patientId?.name || 'Anonymous'}
                          </span>
                          {r.rating && <StarRating rating={r.rating} />}
                          <StatusBadge status={r.status} />
                        </div>
                        <p className="text-sm text-[#64748b] whitespace-pre-wrap">{r.text || r.comment || r.review}</p>
                        {r.createdAt && (
                          <p className="text-xs text-[#94a3b8] mt-1">
                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      {r.status === 'pending' && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(r._id)}
                            disabled={actionLoading === r._id}
                            className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 border border-green-200"
                          >
                            {actionLoading === r._id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(r._id)}
                            disabled={actionLoading === r._id}
                            className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200"
                          >
                            {actionLoading === r._id ? '...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
