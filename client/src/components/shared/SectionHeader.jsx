/**
 * SectionHeader — Reusable section heading with label badge, large title, optional subtitle.
 * 
 * Props:
 *   label    {string}  - Small uppercase label / overline (optional)
 *   title    {string|node} - Main heading text
 *   subtitle {string}  - Supporting description (optional)
 *   center   {boolean} - Center-align everything (optional, default false)
 *   light    {boolean} - Use accent color for title (optional, for dark bg sections)
 *   className {string} - Extra classes on wrapper (optional)
 */

import '../../styles/shared.css';

export default function SectionHeader({
  label,
  title,
  subtitle,
  center = false,
  light = false,
  className = '',
}) {
  return (
    <div
      className={`ds-section-header ${center ? 'ds-section-header--center' : ''} ${className}`}
    >
      {label && (
        <span className="ds-section-header__label">
          <span className="ds-section-header__label-dot" />
          {label}
        </span>
      )}

      {title && (
        <h2 className={`ds-section-header__title ${light ? 'ds-section-header__title--light' : ''}`}>
          {title}
        </h2>
      )}

      {subtitle && (
        <p className="ds-section-header__subtitle">{subtitle}</p>
      )}
    </div>
  );
}
