import { Link } from 'react-router-dom';
import '../../styles/home.css';

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #5F8190 0%, #C8D5D9 40%, #E2F0F0 100%)', fontFamily: "'Inter', sans-serif" }}>


      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px' }}>

        {/* Hero Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center', marginBottom: '96px' }}>
          <div>
            <p style={{ color: '#5F8190', fontSize: '13px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>About the Doctor</p>
            <h1 style={{ fontSize: 'clamp(36px, 4.5vw, 52px)', fontWeight: 700, color: '#36565F', lineHeight: 1.15, marginBottom: '24px' }}>
              Dr. Srinath<br />General Surgeon
            </h1>
            <p style={{ color: '#6B7C84', fontSize: '16px', lineHeight: 1.8, marginBottom: '16px' }}>
              With over 10 years of surgical experience, Dr. Srinath has dedicated his career to providing compassionate, world-class surgical care. He specializes in General and Laparoscopic Surgery with a proven track record of over 10,000 successful procedures.
            </p>
            <p style={{ color: '#6B7C84', fontSize: '16px', lineHeight: 1.8, marginBottom: '32px' }}>
              His patient-first approach, combined with the latest minimally invasive techniques, ensures faster recovery times and better outcomes for every individual under his care.
            </p>
            <Link to="/contact" style={{ display: 'inline-block', background: '#36565F', color: '#fff', padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }}>
              Get in Touch ↗
            </Link>
          </div>

          {/* Doctor portrait */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '340px', height: '420px', borderRadius: '28px', overflow: 'hidden', background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', boxShadow: '0 20px 60px rgba(54,86,95,0.15)' }}>
              <img src="/doctor.png" alt="Dr. Srinath" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', objectPosition: 'bottom' }} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '96px' }}>
          {[
            { number: '10k+', label: 'Patients Treated' },
            { number: '10+', label: 'Years Experience' },
            { number: '500+', label: 'Surgeries / Year' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '40px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 4px 24px rgba(54,86,95,0.06)' }}>
              <p style={{ fontSize: '48px', fontWeight: 700, color: '#36565F', marginBottom: '8px', letterSpacing: '-2px' }}>{stat.number}</p>
              <p style={{ color: '#6B7C84', fontSize: '14px' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Qualifications */}
        <div style={{ background: 'rgba(54,86,95,0.08)', borderRadius: '24px', padding: '56px 48px' }}>
          <h2 style={{ fontWeight: 700, fontSize: '28px', color: '#36565F', marginBottom: '32px' }}>Qualifications & Training</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              '🎓 MBBS — Top Medical University',
              '🏅 MS General Surgery',
              '🏥 Laparoscopic Surgery Fellowship',
              '📜 Board Certified Surgeon',
              '🔬 Advanced Minimally Invasive Training',
              '🌐 International Surgical Conferences Speaker',
            ].map((q) => (
              <div key={q} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', fontSize: '14px', color: '#36565F', fontWeight: 500 }}>
                {q}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
