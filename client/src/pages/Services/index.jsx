import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import '../../styles/home.css';

const SERVICES = [
  {
    title: 'General Medicine Consultation',
    image: 'https://images.unsplash.com/photo-1551076805-e18690c5e53b?w=600&h=400&fit=crop',
  },
  {
    title: 'Chronic Disease Management',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop',
  },
  {
    title: 'Preventive Healthcare',
    image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600&h=400&fit=crop',
  },
  {
    title: 'Lifestyle & Wellness Guidance',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&h=400&fit=crop',
  },
  {
    title: 'Diabetes Screening & Management',
    image: 'https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?w=600&h=400&fit=crop',
  },
  {
    title: 'Preventive Health Checkups',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop',
  },
];

const HEALTHCARE_DEPARTMENTS = [
  {
    name: 'Cardiology',
    desc: 'Focused on heart health, department offers diagnostics, treatment, and management of cardiovascular diseases.',
    image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=150&h=150&fit=crop',
    active: false,
  },
  {
    name: 'Neurology',
    desc: 'Diagnosis and treatment of nervous disorders, including migraines, epilepsy, strokes, and neurodegenerative.',
    image: 'https://images.unsplash.com/photo-1559757175-9c904797fb1c?w=150&h=150&fit=crop',
    active: false,
  },
  {
    name: 'Endocrinology',
    desc: 'Managing hormone-related conditions, including diabetes, thyroid disorders, and metabolic diseases.',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=150&h=150&fit=crop',
    active: false,
  },
  {
    name: 'Gastroenterology',
    desc: 'Focused on digestive health, diagnosing and treating conditions such as acid reflux, ulcers, liver disease.',
    image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=150&h=150&fit=crop',
    active: true,
  },
  {
    name: 'Ophthalmology',
    desc: 'Eye care services, including vision exams, treatment for eye diseases like glaucoma and cataracts, and laser vision correction.',
    image: 'https://images.unsplash.com/photo-1551076805-e18690c5e53b?w=150&h=150&fit=crop',
    active: false,
  }
];

const DOCTORS = [
  {
    name: 'Matey Black',
    specialties: ['Cardiologist', 'Surgeon'],
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=500&fit=crop'
  },
  {
    name: 'Christina Black',
    specialties: ['Endocrinologist'],
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=500&fit=crop'
  },
  {
    name: 'Michelle Larson',
    specialties: ['Ophthalmologist', 'Surgeon'],
    image: 'https://images.unsplash.com/photo-1594824432258-f4633b4d4554?w=400&h=500&fit=crop'
  },
  {
    name: 'Mark Patterson',
    specialties: ['Obstetrician', 'Gynecologist'],
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=500&fit=crop'
  },
  {
    name: 'Marry O’Conor',
    specialties: ['Gastroenterologist'],
    image: 'https://images.unsplash.com/photo-1594824432258-f4633b4d4554?w=400&h=500&fit=crop'
  },
  {
    name: 'Harry Olson',
    specialties: ['Otolaryngologist', 'Surgeon'],
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=500&fit=crop'
  }
];

export default function ServicesPage() {
  const { user } = useAuth();
  const [hoveredDoctor, setHoveredDoctor] = useState(null);
  
  return (
    <div style={{ boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
      
      {/* FULL-WIDTH CYAN BACKGROUND FOR TOP SECTION (Hero + Cards) */}
      <div style={{ background: '#8fbec8', paddingTop: '120px', paddingBottom: '16px' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
        
        {/* NEW HERO SECTION */}
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '600px',
          borderRadius: '32px',
          overflow: 'hidden',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          boxSizing: 'border-box',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          {/* Background Image */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url("/services-hero.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 1
          }} />
          {/* Gradient Overlay matching the dark navy #253a5a */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to right, rgba(37,58,90, 0.9) 0%, rgba(37,58,90, 0.6) 50%, rgba(37,58,90, 0.1) 100%)',
            zIndex: 2
          }} />

          {/* Hero Content */}
          <div style={{ position: 'relative', zIndex: 3, maxWidth: '650px', marginTop: 'auto', marginBottom: 'auto' }}>
            <h1 style={{ 
              fontFamily: "'Figtree', sans-serif",
              fontSize: 'clamp(64px, 8vw, 100px)', 
              fontWeight: 600, 
              color: '#ffffff', 
              lineHeight: 1.05,
              margin: '0 0 24px 0',
              letterSpacing: '-3px'
            }}>
              Care About<br />Your Health
            </h1>
            <p style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.6,
              marginBottom: '40px',
              maxWidth: '500px'
            }}>
              Our team of experienced doctors, specialists, and healthcare professionals is committed to delivering personalized treatments.
            </p>
            <Link to={user ? "/book-appointment" : "/login"} style={{
              display: 'inline-block',
              background: '#ffffff',
              color: '#1a2b30',
              padding: '16px 36px',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              Choose Your Doctor
            </Link>
          </div>

          {/* Bottom Features */}
          <div style={{ position: 'relative', zIndex: 3, display: 'flex', gap: '32px', marginTop: 'auto', paddingTop: '40px' }}>
            {['State-of-the-Art Facilities', 'Expert Medical Team', 'Personalized Care'].map(feature => (
              <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '14px', fontWeight: 500 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {feature}
              </div>
            ))}
          </div>
        </div>
        {/* QUICK ACTION CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          
          {/* Card 1 (White) */}
          <Link to="/services" style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            textDecoration: 'none',
            color: '#253a5a',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s'
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ position: 'absolute', top: '24px', right: '32px' }}>↗</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <div style={{ color: '#8db5c4' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <path d="M16 2v4M8 2v4" />
                  <path d="M9 14h6M12 11v6" />
                </svg>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>See a Doctor</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, opacity: 0.8, margin: 0 }}>
              Our team of experienced doctors, specialists, and healthcare professionals is committed.
            </p>
          </Link>

          {/* Card 2 (Cyan) */}
          <Link to={user ? "/book-appointment" : "/login"} style={{
            background: '#8db5c4',
            borderRadius: '24px',
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            textDecoration: 'none',
            color: '#ffffff',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(141,181,196,0.3)',
            transition: 'transform 0.3s'
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ position: 'absolute', top: '24px', right: '32px' }}>↗</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <div style={{ color: '#ffffff' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  <path d="M12 14v8M8 18h8" />
                </svg>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Book An Appointment</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, opacity: 0.9, margin: 0 }}>
              Our team of experienced doctors, specialists, and healthcare professionals is committed.
            </p>
          </Link>

          {/* Card 3 (Cyan) */}
          <Link to={user ? "/chat" : "/login"} style={{
            background: '#8db5c4',
            borderRadius: '24px',
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            textDecoration: 'none',
            color: '#ffffff',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(141,181,196,0.3)',
            transition: 'transform 0.3s'
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ position: 'absolute', top: '24px', right: '32px' }}>↗</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <div style={{ color: '#ffffff' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <path d="M8 21h8M12 17v4" />
                  <path d="M10 9l2-2 2 2" />
                  <path d="M12 7v6" />
                </svg>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Online Consultation</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, opacity: 0.9, margin: 0 }}>
              Our team of experienced doctors, specialists, and healthcare professionals is committed.
            </p>
          </Link>

        </div>
      </div>
    </div>

    {/* ABOUT OUR CLINIC SECTION */}
    <div style={{ background: '#ffffff', width: '100%' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 24px 40px', boxSizing: 'border-box' }}>
      
      {/* Top Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8db5c4', fontWeight: 600, fontSize: '16px', marginBottom: '24px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="3"/>
          <circle cx="7" cy="12" r="3"/>
          <circle cx="17" cy="12" r="3"/>
          <circle cx="12" cy="17" r="3"/>
        </svg>
        about our clinic
      </div>

      {/* Main Heading */}
      <h2 style={{ 
        fontFamily: "'Figtree', sans-serif",
        fontSize: 'clamp(32px, 4vw, 40px)', 
        fontWeight: 600, 
        color: '#1a2b30', 
        lineHeight: 1.3,
        marginBottom: '48px',
        letterSpacing: '-1px'
      }}>
        We are Dedicated to Providing World-Class Healthcare with a Focus on Innovation, Expertise, Compassion and Patient Comfort.
      </h2>

      {/* Main Image */}
      <img 
        src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=960&h=450&fit=crop" 
        alt="Our Clinic Team" 
        style={{ 
          width: '100%', 
          height: '450px', 
          objectFit: 'cover', 
          borderRadius: '24px',
          marginBottom: '48px'
        }} 
      />

      {/* Bottom Content Two Columns */}
      <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
        {/* Left Col */}
        <div style={{ flex: '1 1 400px' }}>
          <p style={{ fontSize: '18px', color: '#36565F', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
            Our team of highly qualified medical professionals combines cutting-edge technology with a patient-centered approach to deliver comprehensive and personalized care.
          </p>
        </div>

        {/* Right Col */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <p style={{ fontSize: '14px', color: '#6B7C84', lineHeight: 1.8, margin: 0 }}>
            From preventive medicine to specialized treatments, we offer a wide range of medical services designed to meet the diverse needs of our community. Our modern facilities, advanced diagnostic tools, and commitment to excellence ensure that every patient receives the highest standard of care.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              background: '#eef5f7', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#8db5c4',
              flexShrink: 0
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M9 16l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6B7C84', fontWeight: 600, margin: '0 0 4px 0' }}>Working Hours:</p>
              <p style={{ fontSize: '14px', color: '#1a2b30', fontWeight: 600, margin: '0 0 4px 0' }}>Monday - Saturday: 7.00am - 19.00pm</p>
              <p style={{ fontSize: '14px', color: '#1a2b30', fontWeight: 600, margin: 0 }}>Sunday: 8.30am - 18.30pm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* EXPLORE DEPARTMENTS SECTION */}
  <div style={{ background: '#deecee', position: 'relative', overflow: 'hidden', padding: '100px 24px' }}>
    {/* Background image on the right with a smooth gradient fade */}
    <div style={{ 
      position: 'absolute', 
      right: 0, 
      top: 0, 
      height: '100%', 
      width: '60%', 
      zIndex: 0 
    }}>
      <img 
        src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&h=1200&fit=crop" 
        alt="Doctor Background"
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          objectPosition: 'center', 
          opacity: 0.08, 
          display: 'block'
        }} 
      />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to right, #deecee 0%, rgba(222, 236, 238, 0.7) 30%, rgba(222, 236, 238, 0) 100%)',
      }} />
    </div>
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', gap: '48px', position: 'relative', zIndex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      
      {/* Left Content */}
      <div style={{ flex: '1 1 400px', maxWidth: '450px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8db5c4', fontWeight: 600, fontSize: '16px', marginBottom: '24px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="3"/>
            <circle cx="7" cy="12" r="3"/>
            <circle cx="17" cy="12" r="3"/>
            <circle cx="12" cy="17" r="3"/>
          </svg>
          your health, our priority
        </div>
        <h2 style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 600, color: '#1a2b30', lineHeight: 1.1, marginBottom: '32px', letterSpacing: '-1px' }}>
          Explore Our<br/>Medical Healthcare<br/>Departments
        </h2>
        <p style={{ fontSize: '16px', color: '#6B7C84', lineHeight: 1.8, marginBottom: '48px' }}>
          Our medical clinic is dedicated to providing top-tier healthcare with a focus on innovation, expertise, and patient comfort. We offer comprehensive medical care, ensuring a full spectrum of diagnostic.
        </p>
        <Link to="/departments" style={{ display: 'inline-block', background: '#294066', color: '#ffffff', padding: '16px 36px', borderRadius: '50px', fontSize: '16px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.3s' }}>
          View All Departments
        </Link>
      </div>

      {/* Right Content - Cards */}
      <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {HEALTHCARE_DEPARTMENTS.map((dept, index) => (
          <div 
            key={dept.name} 
            style={{ 
              background: dept.active ? '#294066' : '#ffffff', 
              borderRadius: '20px', 
              padding: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
              position: 'relative',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 15px 45px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.05)';
            }}
          >
            <img src={dept.image} alt={dept.name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ paddingRight: '40px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: 700, color: dept.active ? '#ffffff' : '#1a2b30' }}>{dept.name}</h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: dept.active ? 'rgba(255,255,255,0.8)' : '#6B7C84' }}>{dept.desc}</p>
            </div>
            <div style={{ position: 'absolute', top: '24px', right: '32px', color: dept.active ? '#ffffff' : '#294066', fontSize: '20px', fontWeight: 'bold' }}>↗</div>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* WHY CHOOSE US / SPLIT SECTION */}
  <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', background: '#253a5a', overflow: 'hidden' }}>
    {/* Left Column - Image */}
    <div style={{ 
      flex: '1 1 50%', 
      minHeight: '600px', 
      backgroundImage: 'url("https://images.unsplash.com/photo-1605684954278-9f17a26ac630?w=1000&fit=crop")', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center',
      position: 'relative'
    }} />
    
    {/* Right Column - Dark Blue Info */}
    <div style={{ 
      flex: '1 1 50%', 
      padding: '80px 60px', 
      boxSizing: 'border-box', 
      position: 'relative', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      background: '#253a5a'
    }}>
      {/* Giant clover backdrop SVG */}
      <svg 
        width="450" 
        height="450" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="rgba(255,255,255,0.03)" 
        strokeWidth="1.5" 
        style={{ 
          position: 'absolute', 
          right: '-100px', 
          top: '-100px', 
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z"/>
        <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z"/>
        <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z"/>
        <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z"/>
      </svg>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8db5c4', fontWeight: 600, fontSize: '15px', textTransform: 'lowercase', marginBottom: '20px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z"/>
            <path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z"/>
            <path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z"/>
            <path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z"/>
            <path d="M12 9v6M9 12h6"/>
          </svg>
          why choose our medical center
        </div>

        {/* Headline */}
        <h2 style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 600, color: '#ffffff', lineHeight: 1.15, marginBottom: '40px', letterSpacing: '-1px' }}>
          Innovation in Medicine,<br/>Care for Life
        </h2>

        {/* Feature List (2 columns) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 24px', marginBottom: '40px' }}>
          {[
            'Comprehensive Medical Care',
            'Modern & Comfortable Facilities',
            'Expert Healthcare Team',
            'Preventive & Wellness Programs',
            'Personalized Treatment Plans',
            '24/7 Emergency Services'
          ].map((feature) => (
            <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff', fontSize: '14px', fontWeight: 500 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8db5c4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feature}
            </div>
          ))}
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '0 0 32px 0' }} />

        {/* Paragraph Description */}
        <p style={{ margin: 0, fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.8, maxWidth: '550px' }}>
          We offer comprehensive medical care, ensuring a full spectrum of diagnostic, preventive, and treatment services tailored to individual needs.
        </p>
      </div>
    </div>
  </div>

  {/* THREE COLUMN SUB-FEATURE SECTION */}
  <div style={{ background: '#ffffff', padding: '100px 0', position: 'relative' }}>
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', position: 'relative', boxSizing: 'border-box' }}>
      
      {/* 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '48px', position: 'relative', zIndex: 1 }}>
        
        {/* Col 1 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: '#8db5c4', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#ffffff', 
              fontWeight: 700,
              fontSize: '15px',
              flexShrink: 0
            }}>
              01
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a2b30' }}>
              Medical & Surgical
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#6B7C84', lineHeight: 1.6 }}>
            We provide a wide range of healthcare services, such as general medicine, treatments, surgical procedures, and rehabilitation.
          </p>
        </div>

        {/* Col 2 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: '#7ba6b5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#ffffff', 
              fontWeight: 700,
              fontSize: '15px',
              flexShrink: 0
            }}>
              02
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a2b30' }}>
              Intensive Therapy
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#6B7C84', lineHeight: 1.6 }}>
            We provide a wide range of healthcare services, such as general medicine, treatments, surgical procedures, and rehabilitation.
          </p>
        </div>

        {/* Col 3 */}
        <div style={{ paddingRight: '40px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: '#a3c4cf', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#ffffff', 
              fontWeight: 700,
              fontSize: '15px',
              flexShrink: 0
            }}>
              03
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a2b30' }}>
              Advanced Diagnostic
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#6B7C84', lineHeight: 1.6 }}>
            We provide a wide range of healthcare services, such as general medicine, treatments, surgical procedures, and rehabilitation.
          </p>
        </div>

      </div>

      {/* Overlapping Floating "Read More" button */}
      <Link 
        to="/about"
        style={{
          position: 'absolute',
          right: '24px',
          bottom: '-30px',
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          background: '#253a5a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 600,
          textAlign: 'center',
          boxShadow: '0 12px 30px rgba(37, 58, 90, 0.25)',
          cursor: 'pointer',
          transition: 'transform 0.3s, background-color 0.3s',
          textDecoration: 'none',
          zIndex: 2,
          boxSizing: 'border-box',
          padding: '12px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.backgroundColor = '#1c304d';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.backgroundColor = '#253a5a';
        }}
      >
        Read More
      </Link>
    </div>
  </div>

  {/* JUST PROFESSIONAL DOCTORS SECTION */}
  <div style={{ background: '#ffffff', padding: '100px 0', position: 'relative' }}>
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
      <h2 style={{ 
        fontFamily: "'Figtree', sans-serif", 
        fontSize: 'clamp(36px, 4.8vw, 68px)', 
        fontWeight: 600, 
        color: '#8db5c4', 
        textAlign: 'center', 
        margin: 0, 
        letterSpacing: '-2px' 
      }}>
        Just Professional Doctors
      </h2>

      {/* Doctors List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {DOCTORS.map((doc, idx) => {
          const isHovered = hoveredDoctor === idx;
          return (
            <div 
              key={doc.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '28px 0',
                borderBottom: '1px solid #eef5f7',
                position: 'relative',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={() => setHoveredDoctor(idx)}
              onMouseLeave={() => setHoveredDoctor(null)}
            >
              {/* Left Info: Name & Specialties */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '28px', 
                  fontWeight: 600, 
                  color: isHovered ? '#8db5c4' : '#253a5a', 
                  transition: 'color 0.3s',
                  fontFamily: "'Figtree', sans-serif"
                }}>
                  {doc.name}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {doc.specialties.map(spec => (
                    <span key={spec} style={{
                      background: '#eef5f7',
                      color: '#36565f',
                      padding: '4px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Center/Right Hover Floating Image */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  left: '55%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '180px',
                  height: '220px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                  zIndex: 10,
                  pointerEvents: 'none',
                  animation: 'fadeIn 0.25s ease-out'
                }}>
                  <img 
                    src={doc.image} 
                    alt={doc.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
              )}

              {/* Right: + Read More */}
              <Link 
                to="/doctors" 
                style={{ 
                  color: '#8db5c4', 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  textDecoration: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                + Read More
              </Link>
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '60px', flexWrap: 'wrap', gap: '32px' }}>
        <p style={{ margin: 0, fontSize: '15px', color: '#6B7C84', lineHeight: 1.7, maxWidth: '500px' }}>
          Our team consists of experienced doctors, specialized surgeons, dedicated nurses, and medical support staff, all committed to delivering top-quality treatments with a personalized approach.
        </p>
        <Link 
          to="/doctors" 
          style={{ 
            display: 'inline-block', 
            background: '#253a5a', 
            color: '#ffffff', 
            padding: '16px 36px', 
            borderRadius: '50px', 
            fontSize: '16px', 
            fontWeight: 600, 
            textDecoration: 'none', 
            transition: 'background-color 0.3s' 
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1c304d'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#253a5a'}
        >
          View All Doctors
        </Link>
      </div>
    </div>
  </div>
    </div>
  );
}
