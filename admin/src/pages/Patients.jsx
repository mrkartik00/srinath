import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatients } from '../api/endpoints/patients';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPatients = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      const res = await getPatients(params);
      setPatients(res.data);
      setMeta(res.meta);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchPatients(1); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-semibold text-[#1e293b]">Patients</h1>
          <p className="text-sm text-[#64748b] mt-0.5">View and manage all registered patients</p>
        </div>
        <Badge variant="success" dot>{meta.total} registered</Badge>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-[#E8E5DE]/60 p-4 shadow-[0_1px_3px_rgba(37,89,70,0.04)]">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); fetchPatients(1); }} className="text-xs text-[#64748b] hover:text-[#C62828]">
              ✕ Clear
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? <Spinner /> : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F6F0]/60">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Blood Group</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DE]/50">
                {patients.map((p) => {
                  const name = p.userId?.name || 'Unknown';
                  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={p._id} className="hover:bg-[#F8F6F0]/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#255946]/10 to-[#255946]/5 border border-[#255946]/10 flex items-center justify-center text-[11px] font-semibold text-[#255946]">
                            {initials}
                          </div>
                          <span className="text-sm font-medium text-[#1e293b]">{name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#64748b]">{p.userId?.email || '—'}</td>
                      <td className="px-6 py-4">
                        {p.bloodGroup ? <Badge>{p.bloodGroup}</Badge> : <span className="text-xs text-[#94a3b8]">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#64748b] capitalize">{p.gender || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/patients/${p._id}`)}>
                          View Details →
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-[#64748b]">
                      <p className="text-base">No patients found</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#64748b]">
            Page <span className="font-medium text-[#1e293b]">{meta.page}</span> of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={meta.page <= 1} onClick={() => fetchPatients(meta.page - 1)}>
              ← Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={meta.page >= meta.totalPages} onClick={() => fetchPatients(meta.page + 1)}>
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
