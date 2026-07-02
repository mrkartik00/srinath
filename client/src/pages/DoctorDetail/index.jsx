import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import '../../styles/doctor-detail.css';

// SVG Icons
const VerifiedIcon = () => (
  <svg viewBox="0 0 24 24" className="dd-verified">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z" />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" className="dd-stat-icon" fill="#eab308" stroke="none">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const SuitcaseIcon = () => (
  <svg viewBox="0 0 24 24" className="dd-stat-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" className="dd-stat-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('13:00');

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleBookClick = () => {
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const dateTimeString = `${year}-${month}-${day}T${selectedTime}`;
    
    navigate('/book-appointment', { 
      state: { 
        doctorId: doctor._id || doctor.id, 
        dateTime: dateTimeString 
      } 
    });
  };

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const data = await api.get('/api/v1/config/doctors');
        if (data.success && data.data) {
          const found = data.data.find(d => d.id === id);
          if (found) {
            found.image = found.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&fit=crop';
            found.location = found.clinicAddress || 'Janki Care Clinic, Bangalore';
            found.currency = 'INR';
            found.bio = found.aboutMe || '';
            
            setDoctor(found);
          }
        }
      } catch (error) {
        console.error('Failed to fetch doctor details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) return <div className="dd-page">Loading...</div>;
  if (!doctor) return <div className="dd-page">Doctor not found</div>;

  return (
    <div className="dd-page">
      <div className="dd-container">
        
        {/* LEFT COLUMN */}
        <div className="dd-main">
          <div className="dd-card">
            
            <div className="dd-profile">
              <img src={doctor.image} alt={doctor.name} className="dd-profile-image" />
              
              <div className="dd-profile-info">
                <div className="dd-name-row">
                  <h1 className="dd-name">{doctor.name}</h1>
                  <VerifiedIcon />
                  <button className="dd-favorite">
                    <HeartIcon />
                  </button>
                </div>
                
                <h2 className="dd-specialty">{doctor.specialty}</h2>
                
                <div className="dd-stats">
                  <div className="dd-stat-item">
                    <SuitcaseIcon />
                    {doctor.experience || 0} Years Experience
                  </div>
                  <div className="dd-stat-item">
                    <MapPinIcon />
                    {doctor.location}
                  </div>
                </div>
                
                <div className="dd-fee">
                  ₹ {doctor.fee || 500} <span>Consultation Fee</span>
                </div>
                
                <div className="dd-actions" style={{ marginTop: '24px' }}>
                  <button className="dd-btn dd-btn-primary" onClick={handleBookClick}>
                    Book Appointment
                  </button>
                  <button className="dd-btn dd-btn-outline" onClick={() => navigate('/chat')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="dd-content" style={{ flexDirection: 'column' }}>
            {doctor.bio && (
              <div className="dd-card">
                <h3 className="dd-section-title">About {doctor.name}</h3>
                <p className="dd-text">{doctor.bio}</p>
              </div>
            )}
            
            {doctor.qualification && (
              <div className="dd-card">
                <h3 className="dd-section-title">Qualifications</h3>
                <p className="dd-text">{doctor.qualification}</p>
              </div>
            )}

            {doctor.clinicName && (
              <div className="dd-card">
                <h3 className="dd-section-title">Clinic</h3>
                <p className="dd-text">
                  <strong>{doctor.clinicName}</strong><br/>
                  {doctor.clinicAddress}
                </p>
              </div>
            )}
            
            {(!doctor.bio && !doctor.qualification && !doctor.clinicName) && (
              <div className="dd-card">
                <p className="dd-text" style={{ margin: 0 }}>No additional details provided by this doctor.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dd-sidebar">
          <div className="dd-booking-widget">
            <h3 className="dd-booking-title">Book an Appointment</h3>
            
            <h4 className="dd-booking-subtitle">Select Date</h4>
            <div className="dd-cal-header">
              <div className="dd-cal-nav" onClick={handlePrevMonth} style={{ cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </div>
              <div className="dd-cal-month">
                {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
              </div>
              <div className="dd-cal-nav" onClick={handleNextMonth} style={{ cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>

            <div className="dd-cal-grid">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                <div key={d} className="dd-cal-day-label">{d}</div>
              ))}
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => {
                const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate() - i;
                return <div key={`p${i}`} className="dd-cal-day disabled">{d}</div>;
              }).reverse()}
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                const d = i + 1;
                const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
                return (
                  <div 
                    key={`c${d}`} 
                    className={`dd-cal-day ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d))}
                  >
                    {d}
                  </div>
                );
              })}
              {Array.from({ length: 42 - (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()) }).map((_, i) => (
                <div key={`n${i}`} className="dd-cal-day disabled">{i + 1}</div>
              ))}
            </div>

            <h4 className="dd-booking-subtitle">Select Time</h4>
            <div style={{ marginBottom: '24px' }}>
              <input 
                type="time" 
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #eaedf1',
                  fontSize: '15px',
                  color: '#1a2b30',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div className="dd-summary-box">
              <div className="dd-summary-icon">
                <InfoIcon />
              </div>
              <div className="dd-summary-text">
                Appointment duration: 30 mins<br/>
                Consultation fee: <strong>₹{doctor.fee || 500}</strong>
              </div>
            </div>

            <button className="dd-btn-block" onClick={handleBookClick}>
              Continue to Booking
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
