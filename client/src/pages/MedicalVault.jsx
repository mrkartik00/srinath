import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Folder,
  PlusSquare,
  Trash2,
  Eye,
  Download,
  X,
  FileText,
  Shield,
  Activity,
  Bone,
  Stethoscope,
  Pill
} from 'lucide-react';

const CATEGORIES = ['All', 'Lab Reports', 'X-rays', 'Scans', 'Prescriptions', 'Discharge Summary', 'Insurance', 'Other'];

export default function MedicalVault() {
  const vaultKey = 'medical_vault_docs';
  const [activeCategory, setActiveCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Lab Reports', description: '', file: null });
  const [documents, setDocuments] = useState([]);

  // Load persisted documents from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(vaultKey);
      if (saved) setDocuments(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load vault documents:', e);
    }
  }, []);

  const filtered = activeCategory === 'All' ? documents : documents.filter(d => d.category === activeCategory);

  const saveAndSet = (docs) => {
    setDocuments(docs);
    localStorage.setItem(vaultKey, JSON.stringify(docs));
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!form.title) {
      toast.error('Please enter a title');
      return;
    }

    const persist = (fileBase64 = null) => {
      const newDoc = {
        _id: `doc-${Date.now()}`,
        title: form.title,
        category: form.category,
        description: form.description,
        fileSize: form.file ? `${(form.file.size / (1024 * 1024)).toFixed(1)} MB` : null,
        fileName: form.file ? form.file.name : null,
        mimeType: form.file ? form.file.type : null,
        fileData: fileBase64,
        createdAt: new Date().toISOString(),
      };
      saveAndSet([newDoc, ...documents]);
      setShowModal(false);
      setForm({ title: '', category: 'Lab Reports', description: '', file: null });
      toast.success('Document saved to your vault.');
    };

    if (form.file) {
      const reader = new FileReader();
      reader.onload = (ev) => persist(ev.target.result);
      reader.onerror = () => toast.error('Could not read file.');
      reader.readAsDataURL(form.file);
    } else {
      persist();
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      saveAndSet(documents.filter(d => d._id !== id));
      toast.success('Document deleted.');
    }
  };

  const handleView = (doc) => {
    if (doc.fileData) {
      const w = window.open();
      if (w) {
        w.document.write(`<iframe src="${doc.fileData}" style="border:0;width:100%;height:100%;"></iframe>`);
        w.document.title = doc.title;
      } else {
        toast.error('Popup blocked — please allow popups to preview files.');
      }
    } else {
      toast.error('No file attached to this record.');
    }
  };

  const handleDownload = (doc) => {
    if (doc.fileData) {
      const a = document.createElement('a');
      a.href = doc.fileData;
      a.download = doc.fileName || `${doc.title.replace(/\s+/g, '_')}`;
      a.click();
      toast.success(`Downloading: ${doc.title}`);
    } else {
      toast.error('No file attached to this record.');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Lab Reports': return <Activity size={20} className="text-[#36565F]" />;
      case 'X-rays': return <Bone size={20} className="text-[#36565F]" />;
      case 'Scans': return <Stethoscope size={20} className="text-[#36565F]" />;
      case 'Prescriptions': return <Pill size={20} className="text-[#36565F]" />;
      case 'Discharge Summary': return <FileText size={20} className="text-[#36565F]" />;
      case 'Insurance': return <Shield size={20} className="text-[#36565F]" />;
      default: return <Folder size={20} className="text-[#36565F]" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 bg-[#f8fafb] min-h-screen font-['Figtree'] w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-[#eaedf1]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#253a5a] tracking-tight">
            Medical Vault
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Securely store and organize your health records and medical documents.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm uppercase tracking-wider flex items-center gap-2"
        >
          <PlusSquare size={14} /> Upload Document
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${activeCategory === cat
                ? 'bg-[#253a5a] text-white border-transparent shadow-xs'
                : 'bg-white text-slate-600 border-[#eaedf1] hover:bg-slate-50 hover:text-[#253a5a]'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Document Grid / Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#eaedf1] rounded-[24px] p-12 flex flex-col items-center justify-center text-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] animate-[fadeIn_0.2s_ease-out]">
          <div className="w-16 h-16 rounded-full bg-[#E6F2F5] flex items-center justify-center text-[#253a5a]">
            <Folder size={32} />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="text-[17px] font-bold text-[#253a5a] font-['Figtree']">No documents found</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              No medical records found in this category. Upload lab reports, prescriptions, scan files, or other medical records to access them securely.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 border border-[#253a5a] text-[#253a5a] hover:bg-slate-50 font-bold text-xs px-5 py-3 rounded-full transition-all flex items-center gap-1.5"
          >
            <PlusSquare size={14} /> Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.2s_ease-out]">
          {filtered.map(doc => (
            <div
              key={doc._id}
              className="bg-white border border-[#eaedf1] rounded-[24px] p-5 flex flex-col gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.02)] transition-all duration-300"
            >
              <div className="flex gap-4 items-start">
                {/* Icon Box */}
                <div className="w-12 h-12 rounded-2xl bg-[#E6F2F5] text-[#253a5a] flex items-center justify-center flex-shrink-0">
                  {getCategoryIcon(doc.category)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-[#EFF6FF] text-[#3B82F6] text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {doc.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {doc.fileSize}
                    </span>
                  </div>
                  <h3 className="font-bold text-[15px] text-[#253a5a] font-['Figtree'] leading-snug mt-2 truncate" title={doc.title}>
                    {doc.title}
                  </h3>
                  {doc.description && (
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 font-semibold mt-2.5">
                    Uploaded {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Action Row */}
              <div className="flex gap-2 items-center mt-auto pt-3 border-t border-slate-50">
                <button
                  onClick={() => handleView(doc)}
                  className="border border-[#eaedf1] text-slate-700 hover:bg-slate-50 font-bold text-[11px] py-2 px-4 rounded-xl transition-all flex-1 flex items-center justify-center gap-1.5"
                >
                  <Eye size={12} className="text-slate-400" /> View
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  className="border border-[#eaedf1] text-slate-700 hover:bg-slate-50 font-bold text-[11px] py-2 px-4 rounded-xl transition-all flex-1 flex items-center justify-center gap-1.5"
                >
                  <Download size={12} className="text-slate-400" /> Download
                </button>
                <button
                  onClick={() => handleDelete(doc._id)}
                  className="border border-red-100 hover:border-red-200 text-red-500 hover:bg-red-50/50 font-bold text-[11px] p-2.5 rounded-xl transition-all flex-shrink-0 flex items-center justify-center"
                  title="Delete Document"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-xl border border-slate-100/50 flex flex-col gap-5 animate-[scaleIn_0.15s_ease-out]">
            <div className="flex items-center justify-between border-b border-[#eaedf1] pb-4">
              <h2 className="text-lg font-bold text-[#253a5a] font-['Figtree']">Upload Document</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-[#253a5a] p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#36565F] uppercase tracking-wider mb-1.5">File</label>
                <input
                  type="file"
                  onChange={e => setForm({ ...form, file: e.target.files[0], title: form.title || (e.target.files[0] ? e.target.files[0].name.replace(/\.[^/.]+$/, "") : '') })}
                  className="w-full text-xs border border-[#eaedf1] rounded-xl p-3 focus:outline-none focus:border-[#253a5a] transition-colors file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-[#E6F2F5] file:text-[#253a5a] hover:file:bg-[#253a5a] hover:file:text-white file:transition-all cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#36565F] uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-white border border-[#eaedf1] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#253a5a] placeholder-slate-400 focus:outline-none focus:border-[#253a5a] transition-colors"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#36565F] uppercase tracking-wider mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Lab Report June 2026"
                  className="w-full bg-white border border-[#eaedf1] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#253a5a] placeholder-slate-400 focus:outline-none focus:border-[#253a5a] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#36565F] uppercase tracking-wider mb-1.5">Description (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Standard health checkup results."
                  rows={3}
                  className="w-full bg-white border border-[#eaedf1] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#253a5a] placeholder-slate-400 focus:outline-none focus:border-[#253a5a] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border border-[#eaedf1] text-slate-700 hover:bg-slate-50 font-bold text-xs px-5 py-3 rounded-xl transition-all flex-1 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#253a5a] hover:bg-[#1a2c44] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all flex-1 text-center shadow-sm uppercase tracking-wider"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

