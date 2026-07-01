import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cancelAppointment } from '../api/endpoints/appointment';
import api from '../api/axios';
import { Spinner } from '../components/ui';

const STATUS_STYLES = {
  scheduled: { bg: '#253a5a', color: '#ffffff', label: 'Scheduled' },
  completed: { bg: '#8db5c4', color: '#ffffff', label: 'Completed' },
  cancelled: { bg: 'rgba(198,40,40,0.12)', color: '#C62828', label: 'Cancelled' },
  no_show:   { bg: 'rgba(245,166,35,0.15)', color: '#E65100', label: 'No Show' },
  rescheduled: { bg: 'rgba(33,150,243,0.15)', color: '#1565C0', label: 'Rescheduled' },
  in_progress: { bg: 'rgba(141,181,196,0.25)', color: '#253a5a', label: 'In Progress' },
};

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apt, setApt] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAppointmentDetails = async () => {
    try {
      const res = await api.get(`/api/v1/appointments/${id}`);
      setApt(res.data);
    } catch (err) {
      toast.error('Could not load appointment details');
      navigate('/appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  const handleCancel = async () => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    try {
      await cancelAppointment(id, reason);
      toast.success('Appointment cancelled successfully');
      fetchAppointmentDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment');
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#8fbec8', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!apt) return null;

  const statusInfo = STATUS_STYLES[apt.status] || STATUS_STYLES.scheduled;
  const dateObj = new Date(apt.dateTime);
  const formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const doctorName = apt.doctorId?.name || 'Doctor';
  const doctorEmail = apt.doctorId?.email || '';

  return (
    <div style={{ boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", background: '#f0f4f8', minHeight: '100vh' }}>
      
      {/* ═══════════════════════════════════════════════ */}
      {/* HERO BANNER — Deep premium gradient background  */}
      {/* ═══════════════════════════════════════════════ */}
      <div style={{ background: '#f0f4f8', paddingTop: '32px', paddingBottom: '16px' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
          
          <div style={{
            position: 'relative',
            width: '100%',
            minHeight: '280px',
            borderRadius: '32px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 64px',
            boxSizing: 'border-box',
            boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
            background: 'linear-gradient(135deg, #1c304d 0%, #253a5a 50%, #36565f 100%)',
            color: '#ffffff',
          }}>
            
            {/* Animated floating background graphics */}
            <div style={{
              position: 'absolute', right: '-50px', top: '-50px', width: '250px', height: '250px',
              borderRadius: '50%', background: 'rgba(141,181,196,0.15)', filter: 'blur(40px)', pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute', right: '10%', bottom: '-80px', width: '300px', height: '300px',
              borderRadius: '50%', background: 'rgba(37,58,90,0.3)', filter: 'blur(60px)', pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 3 }}>
              
              {/* Back navigation */}
              <button 
                onClick={() => navigate(-1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '28px',
                  transition: 'all 0.2s',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'none'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Go Back
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
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
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      border: statusInfo.color === '#ffffff' ? 'none' : `1px solid ${statusInfo.color}`
                    }}>
                      {statusInfo.label}
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', fontWeight: 500 }}>
                      ID: #{apt._id.slice(-8).toUpperCase()}
                    </span>
                  </div>

                  <h1 style={{
                    fontFamily: "'Figtree', sans-serif",
                    fontSize: 'clamp(32px, 4.5vw, 54px)',
                    fontWeight: 600,
                    color: '#ffffff',
                    lineHeight: 1.1,
                    margin: '0 0 8px 0',
                    letterSpacing: '-2px',
                  }}>
                    Consultation with Dr. {doctorName}
                  </h1>
                  
                  <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 500 }}>
                    {formattedDate} at {formattedTime}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* DETAIL CONTENT — Two column premium grid        */}
      {/* ═══════════════════════════════════════════════ */}
      <div style={{ padding: '60px 0', position: 'relative' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
            gap: '32px',
          }} className="detail-grid-layout">

            {/* Left Column — Detailed Information Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* Card 1: Consultation Parameters */}
              <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                border: '1px solid #eef5f7',
                animation: 'fadeInUp 0.5s ease-out'
              }}>
                <h3 style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontSize: '22px',
                  fontWeight: 600,
                  color: '#253a5a',
                  margin: '0 0 28px 0',
                  borderBottom: '1px solid #eef5f7',
                  paddingBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8db5c4" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Consultation Schedule & Type
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '28px'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Date</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#253a5a' }}>{formattedDate}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Time Slot</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#253a5a' }}>{formattedTime}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Mode of Visit</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#253a5a', textTransform: 'capitalize' }}>
                      {apt.type?.replace('_', ' ') || 'Consultation'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#8db5c4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Duration</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#253a5a' }}>{apt.duration} Minutes</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Comments & Medical Notes */}
              {apt.notes && (
                <div style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  padding: '40px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                  border: '1px solid #eef5f7',
                  animation: 'fadeInUp 0.6s ease-out'
                }}>
                  <h3 style={{
                    fontFamily: "'Figtree', sans-serif",
                    fontSize: '22px',
                    fontWeight: 600,
                    color: '#253a5a',
                    margin: '0 0 20px 0',
                    borderBottom: '1px solid #eef5f7',
                    paddingBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8db5c4" strokeWidth="2.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Your Comments / Medical Notes
                  </h3>

                  <div style={{
                    position: 'relative',
                    background: '#f8fafb',
                    borderRadius: '16px',
                    padding: '24px 32px',
                    borderLeft: '4px solid #8db5c4',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      fontSize: '36px',
                      color: 'rgba(141,181,196,0.15)',
                      fontFamily: 'serif',
                      lineHeight: 1,
                      pointerEvents: 'none'
                    }}>“</div>
                    <p style={{
                      margin: 0,
                      fontSize: '15px',
                      lineHeight: 1.6,
                      color: '#36565f',
                      fontWeight: 500,
                      whiteSpace: 'pre-wrap',
                      position: 'relative',
                      zIndex: 2,
                    }}>
                      {apt.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Card 3: Cancellation Alert (if applicable) */}
              {apt.status === 'cancelled' && (
                <div style={{
                  background: 'rgba(198, 40, 40, 0.03)',
                  border: '1px solid rgba(198, 40, 40, 0.15)',
                  borderRadius: '24px',
                  padding: '36px 40px',
                  animation: 'fadeInUp 0.7s ease-out'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      background: 'rgba(198, 40, 40, 0.08)',
                      borderRadius: '50%',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#C62828', fontFamily: "'Figtree', sans-serif" }}>
                        Cancellation Details
                      </h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#556b73', lineHeight: 1.6 }}>
                        This appointment was cancelled. Reason: <strong>{apt.cancellationReason || 'No reason provided'}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column — Sidebar Info & Call to Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* Doctor Quick Card */}
              <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '36px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                border: '1px solid #eef5f7',
                animation: 'fadeInRight 0.5s ease-out'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  {/* Doctor avatar placeholder */}
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
                    Consultant Doctor
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #eef5f7', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8db5c4" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span style={{ fontSize: '13.5px', color: '#556b73', wordBreak: 'break-all', fontWeight: 500 }}>
                      {doctorEmail}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8db5c4" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span style={{ fontSize: '13.5px', color: '#556b73', fontWeight: 500 }}>
                      Secure Connection
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Rescheduling Panel */}
              <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '36px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                border: '1px solid #eef5f7',
                animation: 'fadeInRight 0.6s ease-out'
              }}>
                <h4 style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#253a5a',
                  margin: '0 0 20px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8db5c4" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="12 8 8 12 12 16 12 8"></polygon>
                    <line x1="16" y1="12" x2="12" y2="12"></line>
                  </svg>
                  Quick Actions
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {apt.status === 'scheduled' ? (
                    <>
                      <Link
                        to="/book-appointment"
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          background: '#253a5a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '14px 24px',
                          borderRadius: '50px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          boxShadow: '0 4px 12px rgba(37,58,90,0.15)',
                          transition: 'all 0.3s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#1c304d'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#253a5a'; e.currentTarget.style.transform = 'none'; }}
                      >
                        Reschedule Appointment
                      </Link>

                      <button
                        onClick={handleCancel}
                        style={{
                          background: 'transparent',
                          color: '#C62828',
                          border: '1.5px solid rgba(198,40,40,0.3)',
                          padding: '13px 24px',
                          borderRadius: '50px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#C62828'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = '#C62828'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C62828'; e.currentTarget.style.borderColor = 'rgba(198,40,40,0.3)'; }}
                      >
                        Cancel Appointment
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/book-appointment"
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          background: '#253a5a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '14px 24px',
                          borderRadius: '50px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          boxShadow: '0 4px 12px rgba(37,58,90,0.15)',
                          transition: 'all 0.3s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#1c304d'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#253a5a'; e.currentTarget.style.transform = 'none'; }}
                      >
                        Book New Appointment
                      </Link>

                      <div style={{
                        textAlign: 'center',
                        fontSize: '13px',
                        color: '#8db5c4',
                        fontWeight: 500,
                        marginTop: '8px'
                      }}>
                        This consultation is already {apt.status}.
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Animations and Responsiveness Styles */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 992px) {
          .detail-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}
