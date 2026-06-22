import { useState, useEffect, useCallback } from 'react';

const SLIDES = [
  [
    {
      img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&h=800&fit=crop',
      category: 'Therapy',
      title: 'Caring for Kids',
      size: 'tall',
    },
    {
      img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
      category: 'Cardiology',
      title: 'Pediatric Success Stories',
      size: 'short',
    },
    {
      img: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=600&h=800&fit=crop',
      category: 'Therapy',
      title: 'Thriving Young Patients',
      size: 'tall',
    },
    {
      img: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop',
      category: 'Cardiology',
      title: 'Stronger, Healthier Kids',
      size: 'short',
    },
  ],
  [
    {
      img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=800&fit=crop',
      category: 'Surgery',
      title: 'Advanced Procedures',
      size: 'tall',
    },
    {
      img: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600&h=400&fit=crop',
      category: 'Wellness',
      title: 'Holistic Health Approach',
      size: 'short',
    },
    {
      img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=800&fit=crop',
      category: 'Medicine',
      title: 'Expert Medical Team',
      size: 'tall',
    },
    {
      img: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=600&h=400&fit=crop',
      category: 'Diagnostics',
      title: 'Precision Diagnostics',
      size: 'short',
    },
  ],
  [
    {
      img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=800&fit=crop',
      category: 'Specialists',
      title: 'World-Class Doctors',
      size: 'tall',
    },
    {
      img: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&h=400&fit=crop',
      category: 'Recovery',
      title: 'Speedy Recovery Plans',
      size: 'short',
    },
    {
      img: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=600&h=800&fit=crop',
      category: 'Facilities',
      title: 'Modern Infrastructure',
      size: 'tall',
    },
    {
      img: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop',
      category: 'Care',
      title: 'Patient-First Philosophy',
      size: 'short',
    },
  ],
];

export default function GallerySection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback(
    (index) => {
      if (index === activeSlide || isTransitioning) return;
      setIsTransitioning(true);
      setActiveSlide(index);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [activeSlide, isTransitioning]
  );

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
      setTimeout(() => setIsTransitioning(false), 600);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentSlide = SLIDES[activeSlide];

  return (
    <section className="gallery-section">
      <div className="gallery-section__inner">
        {/* Bento Grid */}
        <div className={`gallery-grid ${isTransitioning ? 'gallery-grid--transitioning' : ''}`}>
          {/* Col 1: tall */}
          <div className="gallery-grid__col gallery-grid__col--tall">
            <div className="gallery-card gallery-card--tall">
              <img src={currentSlide[0].img} alt={currentSlide[0].title} className="gallery-card__img" />
            </div>
            <div className="gallery-card__info">
              <span className="gallery-card__category">{currentSlide[0].category}</span>
              <h3 className="gallery-card__title">{currentSlide[0].title}</h3>
            </div>
          </div>

          {/* Col 2: short (image top, text bottom) */}
          <div className="gallery-grid__col gallery-grid__col--short-top">
            <div className="gallery-card gallery-card--short">
              <img src={currentSlide[1].img} alt={currentSlide[1].title} className="gallery-card__img" />
            </div>
            <div className="gallery-card__info">
              <span className="gallery-card__category">{currentSlide[1].category}</span>
              <h3 className="gallery-card__title">{currentSlide[1].title}</h3>
            </div>
          </div>

          {/* Col 3: tall */}
          <div className="gallery-grid__col gallery-grid__col--tall">
            <div className="gallery-card gallery-card--tall">
              <img src={currentSlide[2].img} alt={currentSlide[2].title} className="gallery-card__img" />
            </div>
            <div className="gallery-card__info">
              <span className="gallery-card__category">{currentSlide[2].category}</span>
              <h3 className="gallery-card__title">{currentSlide[2].title}</h3>
            </div>
          </div>

          {/* Col 4: short (image top, text bottom) */}
          <div className="gallery-grid__col gallery-grid__col--short-top">
            <div className="gallery-card gallery-card--short">
              <img src={currentSlide[3].img} alt={currentSlide[3].title} className="gallery-card__img" />
            </div>
            <div className="gallery-card__info">
              <span className="gallery-card__category">{currentSlide[3].category}</span>
              <h3 className="gallery-card__title">{currentSlide[3].title}</h3>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="gallery-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`gallery-dot ${i === activeSlide ? 'gallery-dot--active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
