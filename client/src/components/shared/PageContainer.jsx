/**
 * PageContainer — Consistent max-width + padding container.
 * Enforces: max-width 1400px, 120px desktop / 64px tablet / 24px mobile padding.
 * 
 * Props:
 *   children  {node}    - Content
 *   className {string}  - Extra classes (optional)
 *   style     {object}  - Inline style override (optional)
 *   as        {string}  - HTML element ('div', 'section', 'article', etc.) — default 'div'
 */

import '../../styles/shared.css';

export default function PageContainer({
  children,
  className = '',
  style = {},
  as: Tag = 'div',
}) {
  return (
    <Tag className={`ds-container ${className}`} style={style}>
      {children}
    </Tag>
  );
}
