import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const CATEGORIES = ['All', 'lab_report', 'xray', 'scan', 'prescription', 'discharge_summary', 'insurance', 'other'];
const CATEGORY_LABELS = { lab_report: 'Lab Reports', xray: 'X-rays', scan: 'Scans', prescription: 'Prescriptions', discharge_summary: 'Discharge Summary', insurance: 'Insurance', other: 'Other' };

export default function MedicalVault() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'other', description: '', file: null });
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async (category) => {
    setLoading(true);
    try {
      const params = category && category !== 'All' ? { category } : {};
      const res = await api.get('/api/v1/vault/documents', params);
      setDocuments(res.data || []);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocuments(activeCategory === 'All' ? null : activeCategory); }, [activeCategory]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title || !form.file) { toast.error('Title and file are required'); return; }
    setUploading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', form.file);
      formData.append('title', form.title);
      formData.append('category', form.category);
      if (form.description) formData.append('description', form.description);

      const res = await fetch(`${baseUrl}/api/v1/vault/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Document uploaded!');
        setShowModal(false);
        setForm({ title: '', category: 'other', description: '', file: null });
        fetchDocuments(activeCategory === 'All' ? null : activeCategory);
      } else toast.error(data.message || 'Upload failed');
    } catch { toast.error('Failed to upload document'); }
    finally { setUploading(false); }
  };

  const handleView = async (doc) => {
    try {
      const res = await api.get(`/api/v1/vault/documents/${doc._id}/download`);
      if (res.data?.url) window.open(res.data.url, '_blank');
      else toast.error('File not available');
    } catch { toast.error('Failed to open document'); }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/api/v1/vault/documents/${doc._id}/download`);
      if (res.data?.url) {
        const a = document.createElement('a');
        a.href = res.data.url;
        a.download = doc.fileName || doc.title;
        a.target = '_blank';
        a.click();
        toast.success('Downloading...');
      } else toast.error('File not available');
    } catch { toast.error('Failed to download'); }
  };

  const handleDelete = async (doc) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/api/v1/vault/documents/${doc._id}`);
      toast.success('Document deleted');
      setDocuments(prev => prev.filter(d => d._id !== doc._id));
    } catch { toast.error('Failed to delete'); }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#253a5a]">Medical Vault</h1>
          <p className="text-sm text-[#6B7C84] mt-1">Securely store and organize your health records.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2.5 bg-[#253a5a] text-white rounded-[14px] text-sm font-semibold hover:bg-[#36565F] transition-colors flex items-center gap-2 shadow-sm">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12"/></svg>
          Upload Document
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${activeCategory === cat ? 'bg-[#253a5a] text-white' : 'bg-white border border-[#eaedf1] text-[#6B7C84] hover:border-[#253a5a]'}`}>
            {cat === 'All' ? 'All' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-[#36565F] border-t-transparent rounded-full" /></div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-[#eaedf1] p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f0f4f8] flex items-center justify-center">
            <svg width="28" height="28" fill="none" stroke="#36565F" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10l-8-8z"/><path d="M14 2v8h8"/></svg>
          </div>
          <h3 className="text-lg font-semibold text-[#253a5a] mb-1">No documents yet</h3>
          <p className="text-sm text-[#6B7C84] mb-4">Upload your medical reports, prescriptions, and lab results</p>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-[#253a5a] text-white rounded-full text-sm font-semibold hover:bg-[#36565F]">Upload Your First Document</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <div key={doc._id} className="bg-white rounded-[16px] border border-[#eaedf1] p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#f0f4f8] flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" fill="none" stroke="#36565F" strokeWidth="1.5"><path d="M10 1H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-6-6z"/><path d="M10 1v6h6"/></svg>
                </div>
                <span className="text-[10px] font-semibold text-[#6B7C84] bg-[#f0f4f8] px-2 py-1 rounded-full uppercase">{CATEGORY_LABELS[doc.category] || doc.category}</span>
              </div>
              <h4 className="text-sm font-semibold text-[#253a5a] truncate">{doc.title}</h4>
              <p className="text-xs text-[#6B7C84] mt-1">{formatSize(doc.fileSize)} • {doc.fileName}</p>
              <p className="text-xs text-[#94a3b8] mt-1">Uploaded {new Date(doc.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleView(doc)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#f0f4f8] hover:bg-[#E2F0F0] text-[#36565F] text-xs font-semibold transition-colors">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="7" cy="7" r="3"/><path d="M1 7s3-5 6-5 6 5 6 5-3 5-6 5-6-5-6-5z"/></svg>
                  View
                </button>
                <button onClick={() => handleDownload(doc)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#f0f4f8] hover:bg-[#E2F0F0] text-[#36565F] text-xs font-semibold transition-colors">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 2v8m-3-3l3 3 3-3"/><path d="M2 12h10"/></svg>
                  Download
                </button>
                <button onClick={() => handleDelete(doc)} className="px-3 py-2 rounded-[10px] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#C62828] text-xs font-semibold transition-colors">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4h10M5 4V2h4v2M4 4v8a1 1 0 001 1h4a1 1 0 001-1V4"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-[#253a5a]">Upload Document</h2>
              <button onClick={() => setShowModal(false)} className="text-[#6B7C84] hover:text-[#253a5a] text-xl">&times;</button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#253a5a] mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full px-3.5 py-2.5 border border-[#eaedf1] rounded-[10px] text-sm focus:outline-none focus:border-[#36565F]" placeholder="e.g. Blood Test Report" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#253a5a] mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3.5 py-2.5 border border-[#eaedf1] rounded-[10px] text-sm focus:outline-none focus:border-[#36565F]">
                  {CATEGORIES.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#253a5a] mb-1">Description (optional)</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3.5 py-2.5 border border-[#eaedf1] rounded-[10px] text-sm focus:outline-none focus:border-[#36565F]" placeholder="Brief notes..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#253a5a] mb-1">File * (PDF, JPG, PNG — max 25MB)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setForm({ ...form, file: e.target.files?.[0] || null })} required className="w-full text-sm text-[#6B7C84] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#f0f4f8] file:text-[#36565F] hover:file:bg-[#E2F0F0]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-[#eaedf1] rounded-[12px] text-sm text-[#6B7C84] hover:bg-[#f9fafb]">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 px-4 py-2.5 bg-[#253a5a] text-white rounded-[12px] text-sm font-semibold hover:bg-[#36565F] disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
