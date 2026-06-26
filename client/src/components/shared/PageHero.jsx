/**
 * PageHero — Reusable full-bleed hero banner for all pages.
 *
 * Props:
 *   label         {string}        Small uppercase label above title
 *   title         {string|node}   Large hero heading (supports JSX)
 *   subtitle      {string}        Supporting text below title
 *   backgroundUrl {string}        Background image URL (optional)
 *   overlayStyle  {string}        One of: 'navy' | 'teal' | 'dark' (default: 'navy')
 *   actions       {node}          CTA buttons area (optional)
 *   footerBadges  {Array<{icon, text}>}  Bottom feature list (optional)
 *   children      {node}          Extra content inside hero (optional)
 *   className     {string}        Extra class on outer wrapper (optional)
 */

import '../../styles/shared.css';

const OVERLAYS = {
  navy: 'linear-gradient(to right, rgba(37,58,90,0.93) 0%, rgba(37,58,90,0.68) 50%, rgba(37,58,90,0.15) 100%)',
  teal: 'linear-gradient(to right, rgba(54,86,95,0.93) 0%, rgba(54,86,95,0.68) 50%, rgba(54,86,95,0.15) 100%)',
  dark: 'linear-gradient(to right, rgba(20,20,20,0.93) 0%, rgba(20,20,20,0.68) 50%, rgba(20,20,20,0.15) 100%)',
};

export default function PageHero({
  label,
  title,
  subtitle,
  backgroundUrl,
  overlayStyle = 'navy',
  actions,
  footerBadges,
  children,
  className = '',
}) {
  const overlayGradient = OVERLAYS[overlayStyle] || OVERLAYS.navy;

  return (
    <div style={{ background: '#8fbec8', paddingTop: '110px', paddingBottom: 0 }} className={className}>
      <div className="ds-container" style={{ paddingBottom: 0 }}>
        <div className="ds-page-hero">
          {/* Background image */}
          {backgroundUrl && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${backgroundUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 1,
              }}
            />
          )}

          {/* Dark overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: overlayGradient,
              zIndex: 2,
            }}
          />

          {/* Main content */}
          <div className="ds-page-hero__content">
            {label && (
              <div className="ds-page-hero__label">
                <span className="ds-page-hero__label-line" />
                {label}
              </div>
            )}

            {title && (
              <h1 className="ds-page-hero__title">{title}</h1>
            )}

            {subtitle && (
              <p className="ds-page-hero__subtitle">{subtitle}</p>
            )}

            {actions && (
              <div className="ds-page-hero__actions">{actions}</div>
            )}
          </div>

          {/* Footer feature badges */}
          {footerBadges && footerBadges.length > 0 && (
            <div className="ds-page-hero__footer">
              {footerBadges.map((badge, i) => (
                <div key={i} className="ds-page-hero__badge">
                  {/* Checkmark icon */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="rgba(255,255,255,0.7)"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  {badge.text || badge}
                </div>
              ))}
            </div>
          )}

          {/* Arbitrary children */}
          {children}
        </div>
      </div>
    </div>
  );
}
