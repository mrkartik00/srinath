/**
 * Janki Care Design Tokens — Single Source of Truth
 * Premium Medical UI Theme
 *
 * Consumed by:
 *   - admin/src/styles/index.css  (via CSS @theme)
 *   - client/src/styles/index.css (via CSS @theme)
 *   - app/src/theme/index.js      (via JS import)
 */

export const colors = {
  // Primary palette
  primary: '#255946',
  primaryDark: '#1a3f32',
  primaryLight: '#2d6b54',

  // Backgrounds
  background: '#F8F6F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F6F0',

  // Text
  text: '#1e293b',
  textMuted: '#64748b',
  textOnPrimary: '#FFFFFF',

  // Border & shadows
  border: '#E8E5DE',

  // Accents
  accent: '#E8F5E9',
  accentCoral: '#F4845F',
  accentMint: '#D0F0E0',

  // Status
  success: '#2E7D32',
  warning: '#F4845F',
  danger: '#C62828',
  info: '#1565C0',

  // Badge-specific
  scheduled: { bg: '#E3F2FD', text: '#1565C0' },
  completed: { bg: '#D0F0E0', text: '#2E7D32' },
  cancelled: { bg: '#FFEBEE', text: '#C62828' },
  pending: { bg: '#FFF3E0', text: '#E65100' },
};

export const typography = {
  fontSerif: "'Playfair Display', 'Georgia', serif",
  fontSans: "'Inter', system-ui, -apple-system, sans-serif",
  fontMono: "ui-monospace, 'Cascadia Code', Consolas, monospace",
};

export const radii = {
  sm: '8px',
  md: '10px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 3px rgba(37, 89, 70, 0.04), 0 1px 2px rgba(37, 89, 70, 0.02)',
  md: '0 4px 6px rgba(37, 89, 70, 0.04), 0 2px 4px rgba(37, 89, 70, 0.02)',
  lg: '0 10px 15px rgba(37, 89, 70, 0.05), 0 4px 6px rgba(37, 89, 70, 0.03)',
};
