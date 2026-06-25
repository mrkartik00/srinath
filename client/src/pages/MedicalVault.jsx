import { useState } from 'react';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Lab Reports', 'X-rays', 'Scans', 'Prescriptions', 'Discharge Summary', 'Insurance', 'Other'];

const CATEGORY_ICONS = {
  'Lab Reports': '🧪', 'X-rays': '🦴', 'Scans': '🔬', 'Prescriptions': '💊',
  'Discharge Summary': '📋', 'Insurance': '🛡️', 'Other': '📄',
};

export default function MedicalVault() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [documents] = useState([]);
  const [form, setForm] = useState({ title: '', category: 'Lab Reports', description: '', file: null });

  const filtered = activeCategory === 'All' ? documents : documents.filter(d => d.category === activeCategory);

  const handleUpload = () => {
    toast.error('Backend coming soon — upload not available yet.');
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#255946]">Medical Vault</h1>
        <button onClick={() => setShowModal(true)} className="bg-[#255946] text-white px-4 py-2 rounded-lg hover:bg-[#1e4a3a] transition">
          Upload Document
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${activeCategory === cat ? 'bg-[#255946] text-white border-[#255946]' : 'bg-white text-gray-600 border-[#E8E5DE] hover:border-[#255946]'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Document Grid / Empty State */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <span className="text-5xl mb-4">📂</span>
          <p className="text-lg">No documents yet.</p>
          <p className="text-sm">Upload your first medical document.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc._id} className="bg-white border border-[#E8E5DE] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{CATEGORY_ICONS[doc.category] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()} • {doc.fileSize}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-[#E8E5DE]">
                <button className="text-xs text-[#255946] hover:underline">View</button>
                <button className="text-xs text-[#255946] hover:underline">Download</button>
                <button className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#255946]">Upload Document</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                <input type="file" onChange={e => setForm({ ...form, file: e.target.files[0] })}
                  className="w-full text-sm border border-[#E8E5DE] rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-[#E8E5DE] rounded-lg p-2 text-sm">
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Document title" className="w-full border border-[#E8E5DE] rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description" rows={3} className="w-full border border-[#E8E5DE] rounded-lg p-2 text-sm resize-none" />
              </div>
              <div className="relative group">
                <button onClick={handleUpload} disabled
                  className="w-full bg-[#255946] text-white py-2 rounded-lg opacity-50 cursor-not-allowed">
                  Upload
                </button>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  Backend coming soon
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
