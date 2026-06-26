/**
 * HomePage — Premium landing page
 *
 * Structure (per client specification):
 *   Navbar         → in MainLayout
 *   Hero           → LOCKED, not modified
 *   FeaturedServices
 *   PatientServices
 *   PatientTools
 *   MeetTheDoctor
 *   Footer         → in MainLayout
 *
 * Removed: AboutSection, DepartmentsSection, GallerySection,
 *          FAQSection, DoctorsSection, AppointmentCTA
 */

import Hero from '../../components/home/Hero';
import PatientServices from '../../components/home/PatientServices';
import PatientTools from '../../components/home/PatientTools';
import DoctorsSection from '../../components/home/DoctorsSection';
import VipPlansSection from '../../components/home/VipPlansSection';
import '../../styles/home.css';

export default function HomePage() {
  return (
    <>
      {/* Hero — LOCKED, pixel-perfect as approved */}
      <Hero />

      {/* Section 1 — Everything You Need (Action cards) */}
      <PatientServices />

      {/* Section 2 — Dynamic list of professional doctors */}
      <DoctorsSection />

      {/* Section 2.5 — VIP Plans */}
      <VipPlansSection />

      {/* Section 1.5 — Patient Tools (Account tools) */}
      <PatientTools />
    </>
  );
}
