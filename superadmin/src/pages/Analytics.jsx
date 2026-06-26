import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api';

const COLORS = ['#273d71', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const RANGES = [{ label: '7 days', value: '7d' }, { label: '30 days', value: '30d' }, { label: '90 days', value: '90d' }];

function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-[#1e293b] mb-4">{title}</h3>
      {children}
    </div>
  );
}

function KPI({ label, value, suffix = '', sub }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-[#1e293b]">{value ?? '—'}{suffix}</p>
      <p className="text-xs text-[#64748b] mt-1">{label}</p>
      {sub && <p className="text-[10px] text-[#94a3b8] mt-0.5">{sub}</p>}
    </div>
  );
}

function RangeSelector({ range, setRange }) {
  return (
    <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-100 shadow-sm">
      {RANGES.map(r => (
        <button 
          key={r.value} 
          onClick={() => setRange(r.value)} 
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${range === r.value ? 'bg-[#273d71] text-white' : 'text-[#64748b] hover:text-[#1e293b]'}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [range, setRange] = useState('30d');
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const endpoints = {
      overview: '/api/v1/superadmin/analytics/overview',
      growth: `/api/v1/superadmin/analytics/growth?range=${range}`,
      appointments: `/api/v1/superadmin/analytics/appointments?range=${range}`,
      prescriptions: `/api/v1/superadmin/analytics/prescriptions?range=${range}`,
      chat: `/api/v1/superadmin/analytics/chat?range=${range}`,
      doctors: `/api/v1/superadmin/analytics/doctors?range=${range}`,
      system: '/api/v1/superadmin/analytics/system',
    };
    Promise.all(Object.entries(endpoints).map(([k, url]) => api.get(url).then(r => [k, r.data]).catch(() => [k, null])))
      .then(results => { setData(Object.fromEntries(results)); setLoading(false); });
  }, [range]);

  if (loading) return <div className="text-[#64748b] text-center py-20">Loading analytics...</div>;

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'growth', label: '📈 Growth' },
    { id: 'appointments', label: '📅 Appointments' },
    { id: 'prescriptions', label: '💊 Prescriptions' },
    { id: 'chat', label: '💬 Chat' },
    { id: 'doctors', label: '👨‍⚕️ Doctors' },
    { id: 'system', label: '⚙️ System' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-[#1e293b]">Analytics</h1>
        <RangeSelector range={range} setRange={setRange} />
      </div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)} 
            className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${tab === t.id ? 'bg-[#273d71] text-white shadow-sm' : 'bg-white border border-gray-100 text-[#64748b] hover:text-[#1e293b] shadow-sm'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab data={data.overview} />}
      {tab === 'growth' && <GrowthTab data={data.growth} />}
      {tab === 'appointments' && <AppointmentsTab data={data.appointments} />}
      {tab === 'prescriptions' && <PrescriptionsTab data={data.prescriptions} />}
      {tab === 'chat' && <ChatTab data={data.chat} />}
      {tab === 'doctors' && <DoctorsTab data={data.doctors} />}
      {tab === 'system' && <SystemTab data={data.system} />}
    </div>
  );
}

function OverviewTab({ data: d }) {
  if (!d) return <Empty />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <StatCard label="Total Doctors" value={d.totalDoctors} icon="👨‍⚕️" />
      <StatCard label="Active Doctors" value={d.activeDoctors} icon="✅" />
      <StatCard label="Pending Approvals" value={d.pendingApprovals} icon="⏳" accent={d.pendingApprovals > 0} />
      <StatCard label="Total Patients" value={d.totalPatients} icon="🏥" />
      <StatCard label="Total Appointments" value={d.totalAppointments} icon="📅" />
      <StatCard label="Today's Appointments" value={d.todayAppointments} icon="📋" />
      <StatCard label="Total Prescriptions" value={d.totalPrescriptions} icon="📝" />
      <StatCard label="Active Prescriptions" value={d.activePrescriptions} icon="💊" />
      <StatCard label="Today's Messages" value={d.todayMessages} icon="💬" />
      <StatCard label="Active Conversations" value={d.activeConversations} icon="🗨️" />
      <StatCard label="Reminders Today" value={d.todayReminders} icon="🔔" />
      <StatCard label="Reminders Sent" value={d.remindersSent} icon="✓" />
    </div>
  );
}

function GrowthTab({ data: d }) {
  if (!d) return <Empty />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label="New Doctors" value={d.doctorsGrowth?.reduce((s, x) => s + x.count, 0)} change={d.doctorsChange} />
        <KPICard label="New Patients" value={d.patientsGrowth?.reduce((s, x) => s + x.count, 0)} change={d.patientsChange} />
        <KPICard label="Approval Rate" value={d.approvalStats?.approved && d.approvalStats?.rejected ? Math.round(d.approvalStats.approved / (d.approvalStats.approved + d.approvalStats.rejected) * 100) : 100} suffix="%" />
        <KPICard label="Avg Approval Time" value={d.avgApprovalTimeHours ?? '—'} suffix="h" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Patient Growth">
          <ChartLine data={d.patientsGrowth} dataKey="count" color="#06b6d4" />
        </Card>
        <Card title="Doctor Growth">
          <ChartLine data={d.doctorsGrowth} dataKey="count" color="#273d71" />
        </Card>
      </div>
    </div>
  );
}

function AppointmentsTab({ data: d }) {
  if (!d) return <Empty />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label="Completion Rate" value={d.completionRate} suffix="%" />
        <KPICard label="Cancellation Rate" value={d.cancellationRate} suffix="%" />
        <KPICard label="No-Show Rate" value={d.noShowRate} suffix="%" />
        <KPICard label="Avg Wait (days)" value={d.avgWaitDays} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Daily Appointments">
          <ChartLine data={d.trend} dataKey="count" color="#10b981" />
        </Card>
        <Card title="Status Breakdown">
          <ChartPie data={d.statusBreakdown?.map(s => ({ name: s._id?.replace('_', ' '), value: s.count }))} />
        </Card>
        <Card title="Type Breakdown">
          <ChartPie data={d.typeBreakdown?.map(s => ({ name: s._id?.replace('_', ' ') || 'unknown', value: s.count }))} />
        </Card>
        <Card title="Top Cancellation Reasons">
          {d.cancellationReasons?.length ? (
            <div className="space-y-2">{d.cancellationReasons.map((r, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0"><span className="text-[#64748b]">{r._id || 'No reason'}</span><span className="text-[#1e293b] font-bold">{r.count}</span></div>
            ))}</div>
          ) : <p className="text-sm text-[#94a3b8]">No cancellations</p>}
        </Card>
      </div>
    </div>
  );
}

function PrescriptionsTab({ data: d }) {
  if (!d) return <Empty />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label="Adherence Rate" value={d.adherenceRate} suffix="%" />
        <KPICard label="Missed Rate" value={d.missedRate} suffix="%" />
        <KPICard label="Avg Medicines/Rx" value={d.avgMedicinesPerPrescription} />
        <KPICard label="Total Reminders" value={d.reminderStats?.total} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Prescriptions Issued">
          <ChartLine data={d.trend} dataKey="count" color="#8b5cf6" />
        </Card>
        <Card title="Adherence Trend">
          <ChartLine data={d.adherenceTrend?.map(x => ({ _id: x._id, count: Math.round(x.avg) }))} dataKey="count" color="#10b981" />
        </Card>
        <Card title="Top Prescribed Medicines">
          <div className="space-y-1.5 max-h-60 overflow-y-auto">{d.topMedicines?.map((m, i) => (
            <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
              <span className="text-xs text-[#94a3b8] w-5">#{i + 1}</span>
              <span className="text-sm text-[#1e293b] flex-1 truncate">{m._id}</span>
              <span className="text-xs font-bold text-[#273d71]">{m.count}</span>
            </div>
          ))}</div>
        </Card>
        <Card title="Reminder Status">
          <ChartPie data={Object.entries(d.reminderStats || {}).filter(([k]) => k !== 'total').map(([k, v]) => ({ name: k, value: v }))} />
        </Card>
      </div>
    </div>
  );
}

function ChatTab({ data: d }) {
  if (!d) return <Empty />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label="Total Conversations" value={d.totalConversations} />
        <KPICard label="Resolution Rate" value={d.resolutionRate} suffix="%" />
        <KPICard label="Avg Response" value={d.avgResponseTimeMinutes ?? '—'} suffix=" min" />
        <KPICard label="Active Now" value={d.topActiveConversations?.length || 0} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Messages Per Day">
          <ChartLine data={d.messageTrend} dataKey="count" color="#ec4899" />
        </Card>
        <Card title="Conversation Status">
          <ChartPie data={d.conversationStatus?.map(s => ({ name: s._id, value: s.count }))} />
        </Card>
        <Card title="Active Conversations" className="lg:col-span-2">
          {d.topActiveConversations?.length ? (
            <div className="space-y-2">{d.topActiveConversations.map((c, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-gray-50 last:border-0">
                <span className="text-[#1e293b] font-medium">{c.patientName}</span>
                <span className="text-[#94a3b8]">↔</span>
                <span className="text-[#1e293b] font-medium">{c.doctorName}</span>
                <span className="ml-auto text-xs text-[#64748b]">{c.unreadByDoctor > 0 ? `${c.unreadByDoctor} unread` : c.status}</span>
              </div>
            ))}</div>
          ) : <p className="text-sm text-[#94a3b8]">No active conversations</p>}
        </Card>
      </div>
    </div>
  );
}

function DoctorsTab({ data: doctors }) {
  if (!doctors?.length) return <Empty msg="No doctor data" />;
  return (
    <Card title="Doctor Performance Ranking" className="">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[#64748b] text-xs border-b border-gray-100">
            <th className="pb-2">#</th><th className="pb-2">Name</th><th className="pb-2">Specialization</th><th className="pb-2 text-right">Patients</th><th className="pb-2 text-right">Appointments</th><th className="pb-2 text-right">Prescriptions</th>
          </tr></thead>
          <tbody>{doctors.map((d, i) => (
            <tr key={d._id} className="border-b border-gray-50 hover:bg-[#f4f5f9]/30 text-[#64748b]">
              <td className="py-2 text-[#94a3b8]">{i + 1}</td>
              <td className="py-2 font-medium text-[#1e293b]">{d.name}</td>
              <td className="py-2 text-[#64748b]">{d.specialization || '—'}</td>
              <td className="py-2 text-right">{d.patients}</td>
              <td className="py-2 text-right text-[#2e7d32] font-semibold">{d.completedAppointments}</td>
              <td className="py-2 text-right text-[#273d71] font-semibold">{d.prescriptions}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Card>
  );
}

function SystemTab({ data: d }) {
  if (!d) return <Empty />;
  const mem = d.memoryUsage || {};
  const mb = (b) => `${Math.round((b || 0) / 1048576)} MB`;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Database">
        <div className="space-y-2 text-sm">
          <Row label="Collections" value={d.database?.collections} />
          <Row label="Data Size" value={mb(d.database?.dataSize)} />
          <Row label="Storage Size" value={mb(d.database?.storageSize)} />
          <Row label="Indexes" value={d.database?.indexes} />
        </div>
      </Card>
      <Card title="Process">
        <div className="space-y-2 text-sm">
          <Row label="Uptime" value={`${Math.round((d.uptime || 0) / 60)} min`} />
          <Row label="Heap Used" value={mb(mem.heapUsed)} />
          <Row label="Heap Total" value={mb(mem.heapTotal)} />
          <Row label="RSS" value={mb(mem.rss)} />
        </div>
      </Card>
      <Card title="Queues" className="lg:col-span-2">
        {Object.keys(d.queues || {}).length ? (
          <div className="grid grid-cols-2 gap-4">{Object.entries(d.queues).map(([name, q]) => (
            <div key={name} className="text-sm p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <p className="text-[#1e293b] font-semibold capitalize mb-2">{name}</p>
              <div className="space-y-1 text-[#64748b]">
                {q.waiting != null && <Row label="Waiting" value={q.waiting} />}
                {q.delayed != null && <Row label="Delayed" value={q.delayed} />}
                {q.failed != null && <Row label="Failed" value={q.failed} accent={q.failed > 0} />}
              </div>
            </div>
          ))}</div>
        ) : <p className="text-sm text-[#94a3b8]">No queue data (Redis may be disconnected)</p>}
      </Card>
    </div>
  );
}

// ─── Shared UI components ────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${accent ? 'border-[#f59e0b]/40 bg-[#fffbeb]' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center justify-between mb-2"><span className="text-lg">{icon}</span></div>
      <p className="text-xl font-bold text-[#1e293b]">{value ?? 0}</p>
      <p className="text-[11px] text-[#64748b] mt-1">{label}</p>
    </div>
  );
}

function KPICard({ label, value, suffix = '', change }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
      <p className="text-2xl font-bold text-[#1e293b]">{value ?? '—'}{suffix}</p>
      <p className="text-xs text-[#64748b] mt-1">{label}</p>
      {change != null && <p className={`text-[10px] mt-1 font-medium ${change >= 0 ? 'text-[#2e7d32]' : 'text-[#c62828]'}`}>{change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs prev period</p>}
    </div>
  );
}

function ChartLine({ data, dataKey, color }) {
  if (!data?.length) return <p className="text-sm text-[#94a3b8] text-center py-6">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}><defs><linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.2} /><stop offset="95%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => v?.slice(5)} /><YAxis tick={{ fill: '#64748b', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#g-${color})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartPie({ data }) {
  if (!data?.length) return <p className="text-sm text-[#94a3b8] text-center py-6">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
      </Pie><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /></PieChart>
    </ResponsiveContainer>
  );
}

function Row({ label, value, accent }) {
  return <div className="flex justify-between py-0.5"><span className="text-[#64748b]">{label}</span><span className={accent ? 'text-[#c62828] font-bold' : 'text-[#1e293b] font-medium'}>{value}</span></div>;
}

function Empty({ msg = 'No data available' }) {
  return <p className="text-center text-[#94a3b8] py-12">{msg}</p>;
}
