import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../components/ui';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  active: { bg: '#253a5a', color: '#ffffff', label: 'Active' },
  completed: { bg: '#8db5c4', color: '#ffffff', label: 'Completed' },
  cancelled: { bg: 'rgba(198,40,40,0.12)', color: '#C62828', label: 'Cancelled' },
};

const freqLabel = { 
  once_daily: 'Once daily', 
  twice_daily: 'Twice daily', 
  thrice_daily: 'Thrice daily', 
  custom: 'Custom' 
};

export default function MyPrescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get('/api/v1/my/prescriptions');
      setPrescriptions(res.data || []);
    } catch (err) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const downloadPdf = async (rxId) => {
    const rxToast = toast.loading('Preparing download...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/my/prescriptions/${rxId}/pdf`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) {
        toast.error('PDF not available yet', { id: rxToast });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${rxId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Prescription downloaded successfully!', { id: rxToast });
    } catch (err) {
      toast.error('Failed to download PDF', { id: rxToast });
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#f8fafb', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", minHeight: '80vh', padding: '40px 0', background: '#ffffff' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
        
        {/* ═══════════════════════════════════════════════ */}
        {/* SECTION HEADER — Figtree Semibold in signature blue */}
        {/* ═══════════════════════════════════════════════ */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: "'Figtree', sans-serif",
            fontSize: 'clamp(36px, 4.8vw, 60px)',
            fontWeight: 600,
            color: '#253a5a',
            margin: '0 0 8px 0',
            letterSpacing: '-2px',
            lineHeight: 1.1,
          }}>
            Prescriptions
          </h1>
          <p style={{ fontSize: '16px', color: '#6B7C84', margin: 0, fontWeight: 500 }}>
            {prescriptions.length} Prescription{prescriptions.length !== 1 ? 's' : ''} Issued
          </p>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* PRESCRIPTION ROWS — Styled like Appointments   */}
        {/* ═══════════════════════════════════════════════ */}
        {prescriptions.length === 0 ? (
          /* Empty State */
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 0', 
            background: '#f8fafb', 
            borderRadius: '24px', 
            border: '1px solid #eef5f7' 
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4 }}>📝</div>
            <h3 style={{ fontFamily: "'Figtree', sans-serif", fontSize: '28px', fontWeight: 600, color: '#253a5a', margin: '0 0 12px 0' }}>
              No prescriptions yet
            </h3>
            <p style={{ fontSize: '16px', color: '#6B7C84', marginBottom: '0' }}>
              Your healthcare providers have not issued any prescriptions for you yet.
            </p>
          </div>
        ) : (
          /* List of Prescriptions */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {prescriptions.map((rx) => {
              const statusInfo = STATUS_STYLES[rx.status] || STATUS_STYLES.active;
              const dateObj = new Date(rx.issuedAt);
              const formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
              const doctorName = rx.doctorId?.name || 'Doctor';
              const isExpanded = expanded === rx._id;

              return (
                <div
                  key={rx._id}
                  style={{ borderBottom: '1px solid #eef5f7' }}
                >
                  {/* Main Row — Tap to toggle details */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '32px 0',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onClick={() => setExpanded(isExpanded ? null : rx._id)}
                  >
                    {/* Left Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', flex: 1 }}>
                      <h3 style={{
                        margin: 0, 
                        fontSize: '28px', 
                        fontWeight: 600,
                        color: isExpanded ? '#8db5c4' : '#253a5a',
                        transition: 'color 0.3s',
                        fontFamily: "'Figtree', sans-serif",
                        minWidth: '200px',
                      }}>
                        {rx.diagnosis || 'Prescription'}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ background: '#eef5f7', color: '#36565f', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
                          {formattedDate}
                        </span>
                        <span style={{ background: '#eef5f7', color: '#36565f', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
                          Dr. {doctorName.replace(/^Dr\.?\s*/i, '')}
                        </span>
                        <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Right Arrow indicator */}
                    <span style={{
                      color: '#8db5c4', 
                      fontSize: '14px', 
                      fontWeight: 600,
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      transition: 'transform 0.3s',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>

                  {/* Expandable Details Section */}
                  <div
                    style={{
                      maxHeight: isExpanded ? '1500px' : '0',
                      opacity: isExpanded ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                      paddingBottom: isExpanded ? '32px' : '0',
                    }}
                  >
                    <div style={{
                      background: '#f8fafb',
                      borderRadius: '20px',
                      padding: '28px 32px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '24px',
                      marginBottom: '28px',
                      animation: isExpanded ? 'slideDetailIn 0.35s ease-out' : 'none',
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Issued On</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1a2b30' }}>{formattedDate}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Prescribing Practitioner</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1a2b30' }}>Dr. {doctorName}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Medicines Quantity</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1a2b30' }}>{rx.medicines.length} Item{rx.medicines.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Rx Status</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1a2b30', textTransform: 'capitalize' }}>{rx.status}</p>
                      </div>
                    </div>

                    {/* Medicines List Details */}
                    <div style={{ marginBottom: '28px' }}>
                      <h4 style={{ fontFamily: "'Figtree', sans-serif", fontSize: '16px', fontWeight: 600, color: '#253a5a', marginBottom: '14px' }}>
                        Prescribed Medications
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {rx.medicines.map((med, i) => (
                          <div key={i} style={{
                            background: '#ffffff',
                            border: '1px solid #eef5f7',
                            borderRadius: '16px',
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span style={{ fontSize: '24px' }}>💊</span>
                              <div>
                                <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#253a5a' }}>{med.name}</p>
                                <p style={{ margin: 0, fontSize: '13px', color: '#6B7C84', marginTop: '2px' }}>
                                  Dosage: {med.dosage} • {freqLabel[med.frequency] || med.frequency}
                                </p>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: '120px' }}>
                              <span style={{ background: '#eef5f7', color: '#36565f', padding: '5px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                                {med.duration} Days
                              </span>
                              {med.instructions && (
                                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#8db5c4', fontStyle: 'italic', fontWeight: 500 }}>
                                  💡 {med.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes block */}
                    {rx.notes && (
                      <div style={{ 
                        margin: '24px 0', 
                        padding: '18px 24px', 
                        background: '#f8fafb', 
                        borderLeft: '4px solid #8db5c4', 
                        borderRadius: '4px 16px 16px 4px' 
                      }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Doctor's Advice / Notes</p>
                        <p style={{ margin: 0, fontSize: '14.5px', color: '#36565f', lineHeight: 1.5, fontWeight: 500 }}>{rx.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/prescriptions/${rx._id}`); }}
                        style={{
                          background: '#253a5a', 
                          color: '#ffffff', 
                          border: 'none',
                          padding: '12px 28px', 
                          borderRadius: '50px', 
                          fontSize: '13px',
                          fontWeight: 600, 
                          cursor: 'pointer', 
                          transition: 'background-color 0.3s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1c304d'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#253a5a'}
                      >
                        View Full Details
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadPdf(rx._id); }}
                        style={{
                          background: 'transparent', 
                          color: '#8db5c4',
                          border: '1.5px solid #8db5c4',
                          padding: '12px 28px', 
                          borderRadius: '50px', 
                          fontSize: '13px',
                          fontWeight: 600, 
                          cursor: 'pointer', 
                          transition: 'all 0.3s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#8db5c4'; e.currentTarget.style.color = '#ffffff'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8db5c4'; }}
                      >
                        📄 Download PDF
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Slide in animations */}
      <style>{`
        @keyframes slideDetailIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
