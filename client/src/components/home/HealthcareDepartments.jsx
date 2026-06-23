import React, { useRef } from 'react';

const DEPARTMENTS = [
  {
    id: 'cardiology',
    title: 'Cardiology',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        <polyline points="4 12 8 12 10 8 14 16 16 12 20 12" />
      </svg>
    ),
    isActive: false
  },
  {
    id: 'orthopedic',
    title: 'Orthopedic',
    image: 'https://images.unsplash.com/photo-1584516150909-c43483ee7932?auto=format&fit=crop&q=80&w=800',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 10l-7 7" />
        <path d="M10 17l-3 3a2.83 2.83 0 0 1-4-4l3-3" />
        <path d="M14 7l3-3a2.83 2.83 0 0 1 4 4l-3 3" />
      </svg>
    ),
    isActive: false
  },
  {
    id: 'ophthalmology',
    title: 'Ophthalmology',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    isActive: false
  },
  {
    id: 'neurology',
    title: 'Neurology',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a8 8 0 0 0-8 8c0 1.5.5 2.8 1.2 3.9C6.8 16 8 18 8 20v2h8v-2c0-2 1.2-4 2.8-6.1C19.5 12.8 20 11.5 20 10a8 8 0 0 0-8-8z" />
        <path d="M9.5 9h5" />
        <path d="M9.5 13h5" />
        <path d="M12 2v20" />
      </svg>
    ),
    isActive: true,
    description: 'Delivering high-quality teaching methods and materials for optimal learning outcomes.'
  },
  {
    id: 'pediatric',
    title: 'Pediatric',
    image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=800',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    isActive: false
  }
];

export default function HealthcareDepartments() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="bg-[#253a5a] py-20 px-6 lg:px-12 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Section */}
        <div className="max-w-[960px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-14 lg:mb-20">
          <h2 
            className="text-white text-4xl md:text-[50px] font-bold leading-[1.15] tracking-tight"
            style={{ fontFamily: "'Figtree', sans-serif" }}
          >
            Our Healthcare<br/>Departments
          </h2>
          <div>
            <p className="text-white/80 text-[14px] mb-6 leading-[1.7] font-medium">
              Our team consists of experienced doctors, specialized surgeons, dedicated nurses, and medical support staff, all committed to delivering top-quality treatments with a personalized approach.
            </p>
            <button className="bg-[#8db5c4] text-white px-7 py-3 rounded-full font-semibold text-[14px] hover:bg-[#7a9da8] transition-colors">
              View All Departments
            </button>
          </div>
        </div>

        {/* Carousel Section */}
        <div 
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar relative"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {DEPARTMENTS.map((dept) => (
            <div 
              key={dept.id}
              className="min-w-[240px] md:min-w-[248px] w-[248px] h-[340px] rounded-[16px] overflow-hidden relative group snap-start cursor-pointer flex-shrink-0"
            >
              <img 
                src={dept.image} 
                alt={dept.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Overlay */}
              <div 
                className={`absolute inset-0 transition-opacity duration-300 ${
                  dept.isActive 
                    ? 'bg-[#253a5a]/85' // Dark blue overlay for active card
                    : 'bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90'
                }`}
              ></div>

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-6 text-white flex flex-col justify-end">
                <div className="mb-3 text-white/90">
                  {dept.icon}
                </div>
                <h3 
                  className="text-[22px] font-bold mb-1.5 tracking-tight"
                  style={{ fontFamily: "'Figtree', sans-serif" }}
                >
                  {dept.title}
                </h3>
                
                {dept.isActive && dept.description ? (
                  <p className="text-white/80 text-[12px] mb-3 leading-[1.6] font-medium pr-2">
                    {dept.description}
                  </p>
                ) : null}

                <div className="flex items-center gap-2 text-white/90 text-[13px] font-medium group-hover:text-white transition-colors mt-2">
                  <span>+</span> Read More
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="flex justify-center items-center gap-5 mt-6">
          <button 
            onClick={() => scroll('left')}
            className="text-white/60 hover:text-white transition-colors p-2"
            aria-label="Previous"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <button 
            onClick={() => scroll('right')}
            className="text-white/60 hover:text-white transition-colors p-2"
            aria-label="Next"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
}
