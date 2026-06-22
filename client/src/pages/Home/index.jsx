import Hero from '../../components/home/Hero';
import AboutSection from '../../components/home/AboutSection';
import DepartmentsSection from '../../components/home/DepartmentsSection';
import GallerySection from '../../components/home/GallerySection';
import FAQSection from '../../components/home/FAQSection';
import DoctorsSection from '../../components/home/DoctorsSection';
import AppointmentCTA from '../../components/home/AppointmentCTA';
import '../../styles/home.css';

export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutSection />
      <DepartmentsSection />
      <GallerySection />
      <FAQSection />
      <DoctorsSection />
      <AppointmentCTA />
    </>
  );
}
