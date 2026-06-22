import { Link } from 'react-router-dom';

export default function AppointmentCTA() {
  return (
    <div style={{ 
      maxWidth: '960px', 
      margin: '0 auto', 
      transform: 'translateY(50%)', 
      position: 'relative', 
      zIndex: 10,
      width: '100%',
      padding: '0 16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#9fb8c5',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '32px 48px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', zIndex: 2 }}>
          <h2 style={{ 
            fontSize: '48px', 
            fontWeight: 700, 
            color: '#ffffff', 
            margin: 0,
            whiteSpace: 'nowrap'
          }}>
            20% off
          </h2>
          <p style={{
            fontSize: '20px',
            color: '#ffffff',
            margin: 0,
            fontWeight: 500,
            lineHeight: 1.3,
            maxWidth: '200px'
          }}>
            Discount on the full body checkup!
          </p>
          <Link to="/book-appointment" style={{
            background: '#ffffff',
            color: '#2b4461',
            padding: '16px 32px',
            borderRadius: '50px',
            fontWeight: 700,
            fontSize: '16px',
            textDecoration: 'none',
            display: 'inline-block',
            transition: 'transform 0.2s',
            boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
            whiteSpace: 'nowrap'
          }}>
            Book Online
          </Link>
        </div>
        
        {/* Placeholder image for doctor with stethoscope */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '40%',
          backgroundImage: 'url("https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '50%',
          background: 'linear-gradient(to right, #9fb8c5 0%, transparent 100%)',
          zIndex: 1
        }} />
      </div>
    </div>
  );
}
