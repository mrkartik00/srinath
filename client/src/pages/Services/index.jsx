import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import '../../styles/home.css';
import '../../styles/services.css';

/* Arrow icon */
function ArrowIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  );
}

/* Check icon */
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

/* ─── Individual Doctor Card using existing sp-card styling ─── */
function DoctorCard({ doctor, user }) {
  const navigate = useNavigate();
  const targetPath = `/doctors/${doctor.id}`;

  return (
    <div onClick={() => navigate(targetPath)} className="find-doctor-card" style={{ cursor: 'pointer' }}>
      <div className="fdc-image-wrap">
        <img src={doctor.image} alt={doctor.name} className="fdc-image" />
      </div>

      <h3 className="fdc-name">{doctor.name}</h3>
      <p className="fdc-address">{doctor.clinicAddress || 'Janki Care Clinic, Bangalore'}</p>

      <div className="fdc-specialty">{doctor.specialty}</div>

      <div className="fdc-footer">
        <div
          className="fdc-footer-btn"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={(e) => {
            e.stopPropagation();
            if (user) {
              navigate('/book-appointment', { state: { doctorId: doctor.id } });
            } else {
              navigate('/login');
            }
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          Book Appointment
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const { user } = useAuth();
  const bookLink = user ? '/book-appointment' : '/login';
  const portalLink = user ? '/appointments' : '/login';

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await api.get('/api/v1/config/doctors');

        const placeholderImages = [
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&fit=crop',
          'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&fit=crop',
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&fit=crop',
          'https://images.unsplash.com/photo-1594824432258-f4633b4d4554?w=600&fit=crop',
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&fit=crop',
        ];

        const defaultDoctors = [
          { id: 1, name: 'Dr. Matey Black', specialty: 'Cardiologist', image: placeholderImages[0] },
          { id: 2, name: 'Dr. Harry Olson', specialty: 'Otolaryngologist', image: placeholderImages[1] },
          { id: 3, name: 'Dr. Christina Black', specialty: 'Endocrinologist', image: placeholderImages[2] },
          { id: 4, name: 'Dr. John Doe', specialty: 'Neurologist', image: placeholderImages[3] },
          { id: 5, name: 'Dr. Jane Smith', specialty: 'Pediatrician', image: placeholderImages[4] },
        ];

        if (data.success && data.data && data.data.length > 0) {
          const docsWithImages = data.data.map((doc, index) => ({
            ...doc,
            specialty: doc.specialty || 'General Physician',
            image: placeholderImages[index % placeholderImages.length]
          }));
          setDoctors(docsWithImages);
        } else {
          setDoctors(defaultDoctors);
        }
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
        setDoctors([
          { id: 1, name: 'Dr. Matey Black', specialty: 'Cardiologist', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&fit=crop' },
          { id: 2, name: 'Dr. Harry Olson', specialty: 'Otolaryngologist', image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&fit=crop' },
          { id: 3, name: 'Dr. Christina Black', specialty: 'Endocrinologist', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&fit=crop' },
          { id: 4, name: 'Dr. John Doe', specialty: 'Neurologist', image: 'https://images.unsplash.com/photo-1594824432258-f4633b4d4554?w=600&fit=crop' },
          { id: 5, name: 'Dr. Jane Smith', specialty: 'Pediatrician', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&fit=crop' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="sp-page" style={{ paddingTop: '110px' }}>

      {/* ════════════════════════════════════════
          DOCTORS GRID SECTION
         ════════════════════════════════════════ */}
      <section style={{ background: '#f0f4f8', paddingTop: '40px', paddingBottom: '100px', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>

          {/* Section Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8db5c4', fontWeight: 600, fontSize: '16px', marginBottom: '24px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="3" /><circle cx="7" cy="12" r="3" /><circle cx="17" cy="12" r="3" /><circle cx="12" cy="17" r="3" />
            </svg>
            medical team
          </div>

          {/* Heading */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '48px' }}>
            <h2 style={{
              fontFamily: "'Figtree', sans-serif",
              fontSize: 'clamp(32px, 4vw, 56px)',
              fontWeight: 600,
              color: '#253a5a',
              margin: 0,
              letterSpacing: '-0.03em',
              lineHeight: 1.1
            }}>
              Find Doctor
            </h2>
            <span style={{
              background: '#eef5f7',
              color: '#36565f',
              padding: '8px 20px',
              borderRadius: '30px',
              fontSize: '15px',
              fontWeight: 600
            }}>
              {doctors.length} Doctors Available
            </span>
          </div>

          {/* 4-column grid matching the theme */}
          <div className="fdc-grid">
            {doctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                user={user}
              />
            ))}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════
          BOOK APPOINTMENT CTA
         ════════════════════════════════════════ */}
      <section className="sp-cta-section">
        <div className="sp-inner">
          <div className="sp-cta-card">
            {/* Subtle radial highlight */}
            <div className="sp-cta-card__bg-pattern" />

            {/* Text */}
            <div className="sp-cta-content">
              <div className="sp-cta-label">
                <CheckIcon />
                Ready to Get Started?
              </div>
              <h2 className="sp-cta-heading">
                Book an appointment or sign in to your patient portal to access all available healthcare services.
              </h2>
            </div>

            {/* Actions */}
            <div className="sp-cta-actions">
              <Link to={bookLink} className="sp-cta-btn" id="services-book-cta-btn">
                Book Appointment
                <ArrowIcon size={15} />
              </Link>
              <Link to={portalLink} className="sp-cta-btn sp-cta-btn--ghost" id="services-portal-btn">
                Patient Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

