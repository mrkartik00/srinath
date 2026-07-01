import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Spinner } from '../components/ui';
import api from '../api/axios';

const statusVariant = {
  active: { bg: '#253a5a', color: '#ffffff', label: 'Active' },
  completed: { bg: '#8db5c4', color: '#ffffff', label: 'Completed' },
  cancelled: { bg: 'rgba(198,40,40,0.12)', color: '#C62828', label: 'Cancelled' }
};

const freqLabel = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  thrice_daily: 'Thrice daily',
  custom: 'Custom'
};

export default function PrescriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rx, setRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get('/api/v1/my/prescriptions')
      .then((res) => {
        const found = res.data.find((p) => p._id === id);
        if (found) setRx(found);
        else navigate('/prescriptions');
      })
      .catch(() => navigate('/prescriptions'))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadPdf = async () => {
    setDownloading(true);
    const rxToast = toast.loading('Preparing download...');
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/v1/my/prescriptions/${id}/pdf`, {
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
      a.download = `prescription-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded!', { id: rxToast });
    } catch {
      toast.error('Download failed', { id: rxToast });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#f8fafb', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!rx) return null;

  const doctorName = rx.doctorId?.name || 'Doctor';
  const formattedDate = new Date(rx.issuedAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const statusInfo = statusVariant[rx.status] || { bg: '#8db5c4', color: '#ffffff', label: rx.status };

  return (
    <div style={{ boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", background: '#f0f4f8', minHeight: '100vh', padding: '140px 0 40px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>

        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent',
            color: '#253a5a',
            border: '1.5px solid #253a5a',
            borderRadius: '50px',
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '32px',
            transition: 'all 0.2s',
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#eef5f7'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Go Back
        </button>

        {/* ═══════════════════════════════════════════════ */}
        {/* HEADER SECTION — Figtree Semibold in signature blue */}
        {/* ═══════════════════════════════════════════════ */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '24px',
          borderBottom: '1px solid #eef5f7',
          paddingBottom: '32px',
          marginBottom: '36px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{
                background: statusInfo.bg,
                color: statusInfo.color,
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {statusInfo.label}
              </span>
              <span style={{ color: '#6B7C84', fontSize: '14px', fontWeight: 500 }}>
                ID: #{rx._id.slice(-8).toUpperCase()}
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Figtree', sans-serif",
              fontSize: 'clamp(32px, 4.5vw, 48px)',
              fontWeight: 600,
              color: '#253a5a',
              lineHeight: 1.1,
              margin: '0 0 8px 0',
              letterSpacing: '-2px',
            }}>
              {rx.diagnosis || 'Prescription Details'}
            </h1>

            <p style={{ fontSize: '15px', color: '#6B7C84', margin: 0, fontWeight: 500 }}>
              Issued by Dr. {doctorName} on {formattedDate}
            </p>
          </div>

          <div>
            <button
              onClick={downloadPdf}
              disabled={downloading}
              style={{
                background: '#253a5a',
                color: '#ffffff',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '50px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,58,90,0.15)',
                transition: 'all 0.3s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1c304d'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#253a5a'}
            >
              {downloading ? (
                'Downloading...'
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* GRID LAYOUT — Main Medications & Notes           */}
        {/* ═══════════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: '32px',
        }} className="detail-grid-layout">

          {/* Left Side: Medicines List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
              border: '1px solid #eef5f7',
            }}>
              <h3 style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: '22px',
                fontWeight: 600,
                color: '#253a5a',
                margin: '0 0 24px 0',
                borderBottom: '1px solid #eef5f7',
                paddingBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8db5c4" strokeWidth="2.5">
                  <path d="M4.82 19.18a6.5 6.5 0 0 1 0-9.19l8.49-8.49a6.5 6.5 0 0 1 9.19 9.19l-8.49 8.49a6.5 6.5 0 0 1-9.19 0z"></path>
                  <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"></line>
                </svg>
                Prescribed Medications ({rx.medicines.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {rx.medicines.map((med, i) => (
                  <div key={i} style={{
                    padding: '24px',
                    backgroundColor: '#f8fafb',
                    borderRadius: '16px',
                    border: '1px solid #eef5f7',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#253a5a' }}>{med.name}</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#6B7C84', fontWeight: 500 }}>
                          Dosage: {med.dosage} • {freqLabel[med.frequency] || med.frequency}
                        </p>
                      </div>
                      <span style={{
                        background: 'rgba(141,181,196,0.15)',
                        color: '#36565f',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}>
                        {med.duration} Days
                      </span>
                    </div>

                    <div style={{
                      marginTop: '16px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '20px',
                      fontSize: '13px',
                      color: '#556b73',
                      borderTop: '1px solid rgba(141,181,196,0.15)',
                      paddingTop: '12px',
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                        ⏰ Timings: {med.timings?.join(', ')}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                        📅 Duration: {new Date(med.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(med.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    {med.instructions && (
                      <div style={{
                        marginTop: '12px',
                        background: '#ffffff',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        color: '#36565f',
                        fontStyle: 'italic',
                        borderLeft: '3px solid #8db5c4',
                        fontWeight: 500,
                      }}>
                        💡 Instructions: {med.instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Doctor info & Advice notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Doctor Info card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
              border: '1px solid #eef5f7',
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#eef5f7',
                  color: '#8db5c4',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  marginBottom: '16px',
                  border: '3px solid #ffffff',
                  boxShadow: '0 8px 20px rgba(54, 86, 95, 0.08)'
                }}>
                  👨‍⚕️
                </div>
                <h4 style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#253a5a',
                  margin: '0 0 4px 0'
                }}>
                  Dr. {doctorName}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#8db5c4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Prescribing Practitioner
                </p>
              </div>

              <div style={{ borderTop: '1px solid #eef5f7', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8db5c4" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span style={{ fontSize: '13.5px', color: '#556b73', wordBreak: 'break-all', fontWeight: 500 }}>
                    {rx.doctorId?.email || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Advice/Notes Card */}
            {rx.notes && (
              <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '36px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                border: '1px solid #eef5f7',
              }}>
                <h4 style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#253a5a',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💡 Doctor's Advice
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#36565f',
                  lineHeight: 1.6,
                  fontWeight: 500,
                  whiteSpace: 'pre-wrap',
                }}>
                  {rx.notes}
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Responsive details grid */}
      <style>{`
        @media (max-width: 768px) {
          .detail-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
