import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyAppointments, cancelAppointment } from '../api/endpoints/appointment';

const STATUS_STYLES = {
  scheduled: { bg: '#253a5a', color: '#ffffff', label: 'Scheduled' },
  completed: { bg: '#8db5c4', color: '#ffffff', label: 'Completed' },
  cancelled: { bg: 'rgba(198,40,40,0.12)', color: '#C62828', label: 'Cancelled' },
  no_show:   { bg: 'rgba(245,166,35,0.15)', color: '#E65100', label: 'No Show' },
  rescheduled: { bg: 'rgba(33,150,243,0.15)', color: '#1565C0', label: 'Rescheduled' },
  in_progress: { bg: 'rgba(141,181,196,0.25)', color: '#253a5a', label: 'In Progress' },
};

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const isMobile = useIsMobile();

  const fetchAppointments = async () => {
    try {
      const res = await getMyAppointments({ limit: 50 });
      setAppointments(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    try {
      await cancelAppointment(id, reason);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) {
    return (
      <div style={{ background: '#8fbec8', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>

      {/* ═══════════════════════════════════════════════ */}
      {/* HERO SECTION — matching Services page hero     */}
      {/* ═══════════════════════════════════════════════ */}
      <div style={{ background: '#8fbec8', paddingTop: '120px', paddingBottom: '16px' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>

          {/* Hero Banner */}
          <div style={{
            position: 'relative',
            width: '100%',
            minHeight: '420px',
            borderRadius: '32px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px',
            boxSizing: 'border-box',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            marginBottom: '24px',
          }}>
            {/* Background Image */}
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundImage: 'url("https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1600&h=900&fit=crop")',
              backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 1,
            }} />
            {/* Gradient Overlay */}
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              background: 'linear-gradient(to right, rgba(37,58,90,0.92) 0%, rgba(37,58,90,0.65) 50%, rgba(37,58,90,0.15) 100%)',
              zIndex: 2,
            }} />

            <div style={{ position: 'relative', zIndex: 3, maxWidth: '600px' }}>
              <h1 style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: 'clamp(48px, 6vw, 80px)',
                fontWeight: 600,
                color: '#ffffff',
                lineHeight: 1.05,
                margin: '0 0 20px 0',
                letterSpacing: '-3px',
              }}>
                Your<br />Appointments
              </h1>
              <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: '36px', maxWidth: '450px' }}>
                View and manage your consultations with our team of experienced healthcare professionals.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link to="/book-appointment" style={{
                  display: 'inline-block', background: '#ffffff', color: '#1a2b30',
                  padding: '14px 32px', borderRadius: '50px', fontSize: '15px', fontWeight: 700,
                  textDecoration: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', transition: 'transform 0.2s',
                }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  Book New Appointment
                </Link>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '14px 0',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  {appointments.length} Total Consultations
                </span>
              </div>
            </div>

            {/* Bottom features */}
            <div style={{ position: 'relative', zIndex: 3, display: 'flex', gap: '32px', marginTop: 'auto', paddingTop: '32px' }}>
              {['24/7 Support', 'Secure Records', 'Easy Rescheduling'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '13px', fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* APPOINTMENTS LIST — Doctor-forward editorial    */}
      {/* ═══════════════════════════════════════════════ */}
      <div style={{ background: '#ffffff', padding: '100px 0', position: 'relative' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>

          {/* Section Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8db5c4', fontWeight: 600, fontSize: '16px', marginBottom: '24px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="3"/><circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><circle cx="12" cy="17" r="3"/>
            </svg>
            your consultations
          </div>

          {/* Heading */}
          <h2 style={{
            fontFamily: "'Figtree', sans-serif",
            fontSize: 'clamp(36px, 4.8vw, 68px)',
            fontWeight: 600,
            color: '#8db5c4',
            margin: '0 0 8px 0',
            letterSpacing: '-2px',
          }}>
            Upcoming & Past Visits
          </h2>

          {appointments.length === 0 ? (
            /* ─── Empty State ─── */
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4 }}>📋</div>
              <h3 style={{ fontFamily: "'Figtree', sans-serif", fontSize: '28px', fontWeight: 600, color: '#253a5a', margin: '0 0 12px 0' }}>
                No appointments yet
              </h3>
              <p style={{ fontSize: '16px', color: '#6B7C84', marginBottom: '36px' }}>
                Schedule your first consultation with one of our doctors.
              </p>
              <Link to="/book-appointment" style={{
                display: 'inline-block', background: '#253a5a', color: '#ffffff',
                padding: '16px 36px', borderRadius: '50px', fontSize: '16px', fontWeight: 600,
                textDecoration: 'none', transition: 'background 0.3s',
              }}>
                Book Your First Appointment
              </Link>
            </div>
          ) : (
            /* ─── Appointment Rows with expandable details ─── */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {appointments.map((apt, idx) => {
                const statusInfo = STATUS_STYLES[apt.status] || STATUS_STYLES.scheduled;
                const dateObj = new Date(apt.dateTime);
                const formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                const formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                const doctorName = apt.doctorId?.name || 'Doctor';
                const isExpanded = expandedCard === idx;

                return (
                  <div
                    key={apt._id}
                    style={{ borderBottom: '1px solid #eef5f7' }}
                    onMouseEnter={() => { if (!isMobile) setExpandedCard(idx); }}
                    onMouseLeave={() => { if (!isMobile) setExpandedCard(null); }}
                  >
                    {/* Main Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '32px 0',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onClick={() => {
                        if (isMobile) {
                          navigate(`/appointments/${apt._id}`);
                        } else {
                          setExpandedCard(isExpanded ? null : idx);
                        }
                      }}
                    >
                      {/* Left: Doctor Name + Tags */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', flex: 1 }}>
                        <h3 style={{
                          margin: 0, fontSize: '28px', fontWeight: 600,
                          color: isExpanded ? '#8db5c4' : '#253a5a',
                          transition: 'color 0.3s',
                          fontFamily: "'Figtree', sans-serif",
                          minWidth: '200px',
                        }}>
                          {doctorName}
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ background: '#eef5f7', color: '#36565f', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
                            {formattedDate}
                          </span>
                          <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Right: Arrow indicator */}
                      <span style={{
                        color: '#8db5c4', fontSize: '14px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'transform 0.3s',
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>

                    {/* Expandable Details Panel */}
                    <div
                      className="apt-details-panel"
                      style={{
                        maxHeight: isExpanded ? '300px' : '0',
                        opacity: isExpanded ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, padding 0.3s ease',
                        paddingBottom: isExpanded ? '32px' : '0',
                      }}
                    >
                      <div style={{
                        background: '#f8fafb',
                        borderRadius: '20px',
                        padding: '28px 32px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '24px',
                        animation: isExpanded ? 'slideDetailIn 0.35s ease-out' : 'none',
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Date</p>
                          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1a2b30' }}>{formattedDate}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Time</p>
                          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1a2b30' }}>{formattedTime}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Type</p>
                          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1a2b30', textTransform: 'capitalize' }}>{apt.type?.replace('_', ' ') || 'Consultation'}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Duration</p>
                          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1a2b30' }}>{apt.duration} min</p>
                        </div>
                      </div>

                      {/* Cancellation Reason */}
                      {apt.cancellationReason && (
                        <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: '#C62828', background: 'rgba(198,40,40,0.06)', padding: '10px 16px', borderRadius: '12px', lineHeight: 1.5 }}>
                          <strong>Reason:</strong> {apt.cancellationReason}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/appointments/${apt._id}`); }}
                          style={{
                            background: '#253a5a', color: '#ffffff', border: 'none',
                            padding: '12px 28px', borderRadius: '50px', fontSize: '13px',
                            fontWeight: 600, cursor: 'pointer', transition: 'background 0.3s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#1c304d'}
                          onMouseLeave={e => e.currentTarget.style.background = '#253a5a'}
                        >
                          View Full Details
                        </button>
                        <Link
                          to="/book-appointment"
                          onClick={e => e.stopPropagation()}
                          style={{
                            background: 'transparent', color: '#8db5c4',
                            border: '1.5px solid #8db5c4',
                            padding: '12px 28px', borderRadius: '50px', fontSize: '13px',
                            fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
                            textDecoration: 'none', display: 'inline-block',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#8db5c4'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8db5c4'; }}
                        >
                          Reschedule
                        </Link>
                        {apt.status === 'scheduled' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancel(apt._id); }}
                            style={{
                              background: 'transparent', color: '#C62828',
                              border: '1.5px solid rgba(198,40,40,0.3)',
                              padding: '12px 28px', borderRadius: '50px', fontSize: '13px',
                              fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#C62828'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#C62828'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C62828'; e.currentTarget.style.borderColor = 'rgba(198,40,40,0.3)'; }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Footer Info (matching Services) */}
          {appointments.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '60px', flexWrap: 'wrap', gap: '32px' }}>
              <p style={{ margin: 0, fontSize: '15px', color: '#6B7C84', lineHeight: 1.7, maxWidth: '500px' }}>
                Our team consists of experienced doctors, specialized surgeons, dedicated nurses, and medical support staff, all committed to delivering top-quality treatments with a personalized approach.
              </p>
              <Link
                to="/book-appointment"
                style={{
                  display: 'inline-block', background: '#253a5a', color: '#ffffff',
                  padding: '16px 36px', borderRadius: '50px', fontSize: '16px', fontWeight: 600,
                  textDecoration: 'none', transition: 'background-color 0.3s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1c304d'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#253a5a'}
              >
                Book New Appointment
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideDetailIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .apt-details-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
