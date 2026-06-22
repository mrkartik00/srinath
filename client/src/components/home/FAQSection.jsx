import { useState } from 'react';

const FAQS = [
  {
    id: '01',
    question: "When should my child's first check-up be?",
    answer: "We offer a variety of therapeutic approaches, including Cognitive Behavioral Therapy (CBT), Psychodynamic Therapy.",
  },
  {
    id: '02',
    question: "What illnesses do pediatricians treat?",
    answer: "Pediatricians treat a wide range of childhood illnesses, from common colds and infections to chronic conditions like asthma.",
  },
  {
    id: '03',
    question: "How often are check-ups needed?",
    answer: "Regular check-ups are recommended at specific ages, starting shortly after birth, then at frequent intervals during the first two years.",
  },
];

export default function FAQSection() {
  const [openId, setOpenId] = useState('01');

  const toggleOpen = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="faq-section">
      <div className="faq-section__inner">
        
        {/* Background decorations */}
        <div className="faq-section__bg-plus faq-section__bg-plus--1">
          <svg viewBox="0 0 40 40" stroke="#ffffff" strokeWidth="10" strokeLinecap="round"><path d="M20 6v28"/><path d="M6 20h28"/></svg>
        </div>
        <div className="faq-section__bg-plus faq-section__bg-plus--2">
          <svg viewBox="0 0 40 40" stroke="#ffffff" strokeWidth="10" strokeLinecap="round"><path d="M20 6v28"/><path d="M6 20h28"/></svg>
        </div>
        <div className="faq-section__bg-plus faq-section__bg-plus--3">
          <svg viewBox="0 0 40 40" stroke="#ffffff" strokeWidth="10" strokeLinecap="round"><path d="M20 6v28"/><path d="M6 20h28"/></svg>
        </div>

        {/* Content */}
        <div className="faq-section__content">
          <div className="faq-section__badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="7" r="2.5" />
              <circle cx="12" cy="17" r="2.5" />
              <circle cx="7" cy="12" r="2.5" />
              <circle cx="17" cy="12" r="2.5" />
            </svg>
            <span>popular questions</span>
          </div>

          <h2 className="faq-section__heading">
            We are Your Partner in<br />Children's Health
          </h2>

          <div className="faq-accordion">
            {FAQS.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
                  onClick={() => toggleOpen(faq.id)}
                >
                  <div className="faq-item__header">
                    <div className="faq-item__title-wrap">
                      <span className="faq-item__num">{faq.id}</span>
                      <h3 className="faq-item__question">{faq.question}</h3>
                    </div>
                    <span className="faq-item__icon">
                      {isOpen ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20V4" />
                          <path d="M6 10l6-6 6 6" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 4v16" />
                          <path d="M6 14l6 6 6-6" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <div 
                    className="faq-item__body" 
                    style={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  >
                    <p className="faq-item__answer">{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Image Side */}
        <div className="faq-section__image-col">
          <img 
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&fit=crop" 
            alt="Doctor examining child" 
            className="faq-section__img"
          />
        </div>
      </div>
    </section>
  );
}
