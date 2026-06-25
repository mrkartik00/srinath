import { useState, useEffect } from 'react';
import api from '../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b'];
const RANGES = ['7d', '30d', '90d'];

export default function Revenue() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/api/v1/superadmin/analytics/revenue?range=${range}`).then(r => setData(r.data));
  }, [range]);

  if (!data) return <div className="text-white p-6">Loading...</div>;

  const kpis = [
    { label: 'Total Revenue', value: `₹${data.totalRevenue}` },
    { label: 'MRR', value: `₹${data.mrr}` },
    { label: 'Active Subscriptions', value: data.activeSubscriptions },
    { label: 'Failed Payments', value: data.failedPayments },
    { label: 'Avg Revenue/Doctor', value: `₹${data.avgRevenuePerDoctor}` },
    { label: 'Avg Revenue/Patient', value: `₹${data.avgRevenuePerPatient}` },
  ];

  const pieData = Object.entries(data.revenueByType).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Revenue Dashboard</h1>
        <div className="flex gap-2">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1 rounded text-sm ${range === r ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/70'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-yellow-900/30 border border-yellow-500/40 rounded p-3 text-yellow-200 text-sm">
        Revenue tracking will activate once Razorpay payment integration is configured.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-[#1e293b] border border-white/10 rounded-lg p-4">
            <p className="text-white/60 text-xs">{k.label}</p>
            <p className="text-white text-lg font-semibold mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1e293b] border border-white/10 rounded-lg p-4">
          <h2 className="text-white text-sm font-medium mb-3">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.monthlyRevenue}>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1e293b] border border-white/10 rounded-lg p-4">
          <h2 className="text-white text-sm font-medium mb-3">Revenue by Type</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
