import '../styles/shared.css';

/**
 * ComingSoon — Premium placeholder page for features under construction.
 * Uses the shared design system (ds-* classes) so it feels cohesive.
 *
 * Props (unchanged from original):
 *   title       {string}  - Page / feature name
 *   description {string}  - Supporting copy
 *   icon        {string}  - Emoji icon (default: 🚀)
 *   phase       {string}  - Optional phase number (e.g., "2")
 */
export default function ComingSoon({
  title = 'Coming Soon',
  description = 'This feature is currently under development.',
  icon = '🚀',
  phase,
}) {
  return (
    <div className="ds-coming-soon">
      <div className="ds-coming-soon__inner">
        {/* Icon orb */}
        <div className="ds-coming-soon__orb" role="img" aria-label={title}>
          {icon}
        </div>

        {/* Overline */}
        <div className="ds-coming-soon__overline">
          <span
            style={{
              display: 'inline-block',
              width: '20px',
              height: '1px',
              background: '#8db5c4',
              verticalAlign: 'middle',
              marginRight: '4px',
            }}
          />
          In Development
          <span
            style={{
              display: 'inline-block',
              width: '20px',
              height: '1px',
              background: '#8db5c4',
              verticalAlign: 'middle',
              marginLeft: '4px',
            }}
          />
        </div>

        {/* Title */}
        <h1 className="ds-coming-soon__title">{title}</h1>

        {/* Description */}
        <p className="ds-coming-soon__desc">{description}</p>

        {/* Phase badge */}
        {phase && (
          <div className="ds-coming-soon__phase-badge">
            <span className="ds-coming-soon__phase-dot" />
            Phase {phase}
          </div>
        )}
      </div>
    </div>
  );
}
