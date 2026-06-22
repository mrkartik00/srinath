import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export default function AboutSection() {
  const marqueeItems = [
    "Cardiology", "+",
    "Neurology", "+",
    "Gastroenterology", "+",
    "General Surgery", "+",
    "Laparoscopic Surgery", "+",
    "Medicine Specialist", "+",
    "Endoscopy", "+"
  ];

  const marqueeRef = useRef(null);

  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;
    let animId;
    let pos = 0;
    const speed = 0.5;
    const animate = () => {
      pos -= speed;
      if (Math.abs(pos) >= el.scrollWidth / 3) {
        pos = 0;
      }
      el.style.transform = `translateX(${pos}px)`;
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <section className="about-section">
      <div className="about-section__inner">

        {/* 2-Column Layout */}
        <div className="about-section__grid">

          {/* Left: Image + Floating Card */}
          <div className="about-section__image-wrap">
            <div className="about-section__image-frame">
              <img
                src="/doctor.png"
                alt="Doctor examining child"
                className="about-section__image"
              />
            </div>

            {/* Floating Experience Card */}
            <div className="about-section__exp-card">
              <div className="about-section__exp-card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5F8190" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <p className="about-section__exp-label">
                Years of Experience in the Medical Field with Kids
              </p>
              <h3 className="about-section__exp-number">20+</h3>
            </div>
          </div>

          {/* Right: Content */}
          <div className="about-section__content">
            <div className="about-section__badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5F8190" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l2 2" />
                <path d="M8 12h0" />
                <path d="M16 12h0" />
                <path d="M12 16h0" />
              </svg>
              <span>expert pediatric specialists</span>
            </div>

            <h2 className="about-section__heading">
              Comprehensive Care<br />for Every Age
            </h2>

            <p className="about-section__text">
              At our pediatric clinic, we are dedicated to providing exceptional
              medical care tailored to the unique needs of children, from newborns
              to adolescents. Our team of experienced pediatricians and child
              health specialists ensures that every child receives compassionate,
              comprehensive, and age-appropriate care in a warm.
            </p>

            <Link to="/about" className="about-section__btn">
              Read More
            </Link>
          </div>
        </div>

        {/* Marquee */}
        <div className="about-section__marquee">
          <div className="about-section__marquee-track" ref={marqueeRef}>
            {[0, 1, 2].map((block) =>
              marqueeItems.map((item, i) => (
                <span
                  key={`${block}-${i}`}
                  className={
                    item === '+'
                      ? 'about-section__marquee-sep'
                      : 'about-section__marquee-item'
                  }
                >
                  {item}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
