import React, { useState } from 'react';

export default function QuickFindSection() {
  const [hoveredLink, setHoveredLink] = useState(null);
  
  const getHoverImage = () => {
    switch(hoveredLink) {
      case 'doctors': return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800';
      case 'diagnostic': return 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800';
      case 'contacts': return 'https://images.unsplash.com/photo-1551076805-e1869043e560?auto=format&fit=crop&q=80&w=800';
      case 'departments': return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=800';
      case 'laboratory': return 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=800';
      case 'prices': return 'https://images.unsplash.com/photo-1584516150909-c43483ee7932?auto=format&fit=crop&q=80&w=800';
      default: return null;
    }
  };
  return (
    <section className="bg-white py-24 px-6 lg:px-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Top Section */}
        <div className="relative mb-24 max-w-[960px] mx-auto">
          
          {/* Subtle Background Pattern (Top Right) */}
          <div className="absolute -top-10 -right-20 opacity-20 pointer-events-none">
            <svg width="400" height="400" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 0v200M0 100h200" stroke="#8db5c4" strokeWidth="40" strokeLinecap="round"/>
              <circle cx="100" cy="100" r="70" stroke="#8db5c4" strokeWidth="40"/>
            </svg>
          </div>

          <div className="flex items-center gap-2 mb-8 text-[#253a5a] font-semibold text-[15px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span>find what your need in 5 seconds</span>
          </div>

          <div className="relative z-10 w-full lg:w-[90%]">
            <div 
              className="text-[#8db5c4] text-4xl md:text-[60px] lg:text-[72px] font-bold leading-[1.15] tracking-tight relative z-10"
              style={{ fontFamily: "'Figtree', sans-serif" }}
            >
              <div className="flex items-center flex-wrap gap-x-4 lg:gap-x-6 mb-1 lg:mb-2">
                <a href="#" onMouseEnter={() => setHoveredLink('doctors')} onMouseLeave={() => setHoveredLink(null)} className={`transition-colors duration-300 ${hoveredLink === 'doctors' ? 'text-[#253a5a]' : 'hover:text-[#253a5a]'}`}>Doctors</a>
                <span>+</span>
                <a href="#" onMouseEnter={() => setHoveredLink('diagnostic')} onMouseLeave={() => setHoveredLink(null)} className={`transition-colors duration-300 ${hoveredLink === 'diagnostic' ? 'text-[#253a5a]' : 'hover:text-[#253a5a]'}`}>Diagnostic</a>
                <span>+</span>
              </div>
              <div className="flex items-center flex-wrap gap-x-4 lg:gap-x-6 mb-1 lg:mb-2">
                <a href="#" onMouseEnter={() => setHoveredLink('contacts')} onMouseLeave={() => setHoveredLink(null)} className={`transition-colors duration-300 ${hoveredLink === 'contacts' ? 'text-[#253a5a]' : 'hover:text-[#253a5a]'}`}>Contacts</a>
                <span>+</span>
                <a href="#" onMouseEnter={() => setHoveredLink('departments')} onMouseLeave={() => setHoveredLink(null)} className={`transition-colors duration-300 ${hoveredLink === 'departments' ? 'text-[#253a5a]' : 'hover:text-[#253a5a]'}`}>Departments</a>
                <span>+</span>
              </div>
              <div className="flex items-center flex-wrap gap-x-4 lg:gap-x-6">
                <a href="#" onMouseEnter={() => setHoveredLink('laboratory')} onMouseLeave={() => setHoveredLink(null)} className={`transition-colors duration-300 ${hoveredLink === 'laboratory' ? 'text-[#253a5a]' : 'hover:text-[#253a5a]'}`}>Laboratory</a>
                <span>+</span>
                <a href="#" onMouseEnter={() => setHoveredLink('prices')} onMouseLeave={() => setHoveredLink(null)} className={`transition-colors duration-300 ${hoveredLink === 'prices' ? 'text-[#253a5a]' : 'hover:text-[#253a5a]'}`}>Prices</a>
                <span>+</span>
              </div>
            </div>

            {/* Dynamic Floating Image */}
            <div 
              className={`hidden lg:block absolute right-[-50px] bottom-0 w-[350px] h-[250px] rounded-[32px] overflow-hidden shadow-2xl z-20 pointer-events-none transition-all duration-500 transform ${
                hoveredLink ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}
            >
              {hoveredLink && (
                <img 
                  src={getHoverImage()} 
                  alt="Department preview" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-1">
          
          {/* Testimonials Card */}
          <div className="lg:col-span-7 bg-[#8db5c4] rounded-[32px] p-10 lg:p-14 relative overflow-hidden flex flex-col justify-between min-h-[450px]">
            {/* Huge background quote mark */}
            <div className="absolute top-0 right-10 text-white/20 text-[300px] leading-none font-serif select-none pointer-events-none" style={{ fontFamily: "Georgia, serif" }}>
              ”
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white mb-6 font-medium">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>testimonials</span>
              </div>
              <h3 className="text-white text-4xl lg:text-[44px] font-bold mb-8 tracking-tight" style={{ fontFamily: "'Figtree', sans-serif" }}>
                Our Patients Feedbacks
              </h3>
              <p className="text-white/90 text-[16px] leading-[1.8] font-medium max-w-[500px]">
                "Booking an appointment was easy, and I was pleasantly surprised by how quickly I was seen. Unlike other clinics where waiting times are long, this facility is well-organized and efficient. The staff respects your time while ensuring that you receive thorough and high-quality medical attention."
              </p>
            </div>

            <div className="flex justify-between items-end relative z-10 mt-12">
              <div className="flex items-center gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" 
                  alt="Samanta McGill" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                />
                <div>
                  <div className="text-white/80 text-[13px] font-medium mb-0.5">Patient of Clinic</div>
                  <div className="text-white font-bold text-[17px]">Samanta McGill</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="w-12 h-12 rounded-full bg-white text-[#253a5a] flex items-center justify-center hover:bg-white/90 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
                <button className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 20% Off Promotion Card */}
          <div className="lg:col-span-3 rounded-[32px] overflow-hidden relative min-h-[450px] group flex flex-col justify-end">
            <img 
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=1200" 
              alt="Promotion background" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b2b3a]/95 via-[#1b2b3a]/60 to-transparent"></div>

            <div className="relative z-10 p-10 lg:p-14">
              <div className="flex items-end gap-6 mb-8 border-b border-white/20 pb-8">
                <div className="text-white text-[64px] font-bold leading-none tracking-tight" style={{ fontFamily: "'Figtree', sans-serif" }}>
                  20% off
                </div>
                <div className="text-white text-[20px] font-semibold leading-tight pb-2">
                  Discount on the full<br/>body checkup
                </div>
              </div>

              <div className="flex flex-col lg:flex-col xl:flex-col justify-between items-start gap-6">
                <p className="text-white/80 text-[14px] leading-relaxed max-w-[320px] font-medium">
                  Take charge of your health with our comprehensive full-body checkup at a special discounted price!
                </p>
                <button className="bg-white text-[#253a5a] px-8 py-3.5 rounded-full font-bold text-[15px] hover:bg-gray-100 transition-colors whitespace-nowrap">
                  Book Online
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
