import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function DoctorsSection() {
  const [doctors, setDoctors] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await api.get('/api/v1/config/doctors');
        
        if (data.success && data.data && data.data.length > 0) {
          // Assign random professional images since DB doesn't have images
          const placeholderImages = [
            'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&fit=crop',
            'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&fit=crop',
            'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&fit=crop',
            'https://images.unsplash.com/photo-1594824432258-f4633b4d4554?w=600&fit=crop',
            'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&fit=crop',
          ];
          const docsWithImages = data.data.map((doc, index) => ({
            ...doc,
            // Assuming the backend returns name and optionally specialty
            specialty: doc.specialty || 'General Physician',
            image: placeholderImages[index % placeholderImages.length]
          }));
          setDoctors(docsWithImages);
        } else {
          // Fallback dummy data if no doctors in DB
          setDoctors([
            { id: 1, name: 'Dr. Matey Black', specialty: 'Cardiologist', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&fit=crop' },
            { id: 2, name: 'Dr. Harry Olson', specialty: 'Otolaryngologist', image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&fit=crop' },
            { id: 3, name: 'Dr. Christina Black', specialty: 'Endocrinologist', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&fit=crop' },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
        // On failure (e.g. not logged in), show default cards
        setDoctors([
          { id: 1, name: 'Dr. Matey Black', specialty: 'Cardiologist', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&fit=crop' },
          { id: 2, name: 'Dr. Harry Olson', specialty: 'Otolaryngologist', image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&fit=crop' },
          { id: 3, name: 'Dr. Christina Black', specialty: 'Endocrinologist', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&fit=crop' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (doctors.length <= 3) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= doctors.length - 3 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [doctors.length]);

  const visibleDoctors = doctors.slice(currentIndex, currentIndex + 3);
  const totalDots = Math.max(1, doctors.length - 2);

  if (loading) return null;

  return (
    <section className="doctors-section">
      <div className="doctors-section__inner">
        
        {/* Header */}
        <div className="doctors-section__header-top">
          <div className="doctors-section__logo-heading">
            <svg width="64" height="64" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="3" className="doctors-section__icon">
              <circle cx="20" cy="12" r="6" />
              <circle cx="20" cy="28" r="6" />
              <circle cx="12" cy="20" r="6" />
              <circle cx="28" cy="20" r="6" />
              <path d="M17 17l6 6M23 17l-6 6" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <h2 className="doctors-section__title">Just Professional Doctors</h2>
          </div>
        </div>

        <div className="doctors-section__header-bottom">
          <p className="doctors-section__subtitle">
            Our pediatric team is dedicated to<br />
            providing compassionate, expert care for<br />
            children of all ages.
          </p>
          <Link to="/doctors" className="doctors-section__all-btn">
            All Doctors
          </Link>
        </div>

        {/* Grid / Carousel */}
        <div className="doctors-grid">
          {visibleDoctors.map((doc) => (
            <div className="doctor-card" key={doc.id} style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
              <div className="doctor-card__image-wrap">
                <img src={doc.image} alt={doc.name} className="doctor-card__image" />
                <button className="doctor-card__share" aria-label="Share">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
              </div>
              <h3 className="doctor-card__name">{doc.name}</h3>
              <span className="doctor-card__specialty">{doc.specialty}</span>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="doctors-section__pagination">
          {Array.from({ length: totalDots }).map((_, idx) => (
            <span 
              key={idx} 
              className={`dot ${currentIndex === idx ? 'dot--active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
            ></span>
          ))}
        </div>

      </div>
    </section>
  );
}
