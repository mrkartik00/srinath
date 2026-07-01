import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/home.css';

const CONTACT_INFO = [
  { icon: '📍', label: 'Clinic Address', value: 'Janki Care Clinic, Bangalore, Karnataka' },
  { icon: '📞', label: 'Phone', value: '+91 98765 43210' },
  { icon: '✉️', label: 'Email', value: 'care@janki.care' },
  { icon: '🕐', label: 'Clinic Hours', value: 'Mon–Sat: 9:00 AM – 6:00 PM' },
];

export default function ContactPage() {
  const { user } = useAuth();
  
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #5F8190 0%, #C8D5D9 40%, #E2F0F0 100%)', fontFamily: "'Inter', sans-serif" }}>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <p style={{ color: '#5F8190', fontSize: '13px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Reach Out</p>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, color: '#36565F', marginBottom: '16px', lineHeight: 1.15 }}>Contact Us</h1>
          <p style={{ color: '#6B7C84', fontSize: '18px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
            Have a question or want to schedule an appointment? We're here to help.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>

          {/* Contact Info */}
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '22px', color: '#36565F', marginBottom: '28px' }}>Get in Touch</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
              {CONTACT_INFO.map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.7)' }}>
                  <span style={{ fontSize: '24px' }}>{icon}</span>
                  <div>
                    <p style={{ fontWeight: 600, color: '#36565F', fontSize: '13px', marginBottom: '4px' }}>{label}</p>
                    <p style={{ color: '#6B7C84', fontSize: '14px' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to={user ? '/book-appointment' : '/login'} style={{ display: 'inline-block', background: '#36565F', color: '#fff', padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }}>
              Book Appointment Online ↗
            </Link>
          </div>

          {/* Contact Form */}
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 40px rgba(54,86,95,0.08)' }}>
            <h2 style={{ fontWeight: 700, fontSize: '22px', color: '#36565F', marginBottom: '28px' }}>Send a Message</h2>
            <form onSubmit={(e) => { e.preventDefault(); alert('Thank you! We will get back to you shortly.'); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { id: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
                { id: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
                { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210' },
              ].map(({ id, label, type, placeholder }) => (
                <div key={id}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#36565F', fontSize: '13px', marginBottom: '6px' }}>{label}</label>
                  <input id={id} type={type} placeholder={placeholder} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(54,86,95,0.2)', background: 'rgba(255,255,255,0.8)', fontSize: '14px', color: '#36565F', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#36565F', fontSize: '13px', marginBottom: '6px' }}>Message</label>
                <textarea placeholder="Describe your concern or question..." rows={4} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(54,86,95,0.2)', background: 'rgba(255,255,255,0.8)', fontSize: '14px', color: '#36565F', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }} />
              </div>
              <button type="submit" style={{ background: '#36565F', color: '#fff', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>
                Send Message ↗
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
