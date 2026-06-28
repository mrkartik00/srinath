/**
 * SR+ Platform Design Tokens — Single Source of Truth
 *
 * Consumed by:
 *   - client/src/styles/index.css  (patient-facing, teal palette)
 *   - admin/src/styles/index.css   (doctor dashboard, navy palette)
 *   - superadmin/src/index.css     (super admin, navy palette)
 *   - app/src/theme/index.js       (mobile app, via JS import)
 */

// Patient-facing (client) palette
export const clientColors = {
  primary: '#36565F',
  primaryDark: '#253a5a',
  secondary: '#5F8190',
  accent: '#8db5c4',
  background: '#f0f4f8',
  backgroundTeal: '#E2F0F0',
};

// Internal dashboards (admin + superadmin) palette
export const dashboardColors = {
  primary: '#273d71',
  primaryDark: '#1e2f58',
  accent: '#eb8c68',
  accentLight: '#f4a882',
  background: '#f4f5f9',
  surfaceAlt: '#f8f9fc',
};

// Shared across all apps
export const colors = {
  surface: '#ffffff',
  text: '#1e293b',
  textMuted: '#64748b',
  textOnPrimary: '#ffffff',
  border: '#e2e8f0',
  success: '#2E7D32',
  warning: '#E65100',
  danger: '#C62828',
  info: '#3253A6',
};

export const typography = {
  fontSans: "'Figtree', system-ui, -apple-system, sans-serif",
};

export const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 3px rgba(39, 61, 113, 0.06)',
  md: '0 4px 12px rgba(39, 61, 113, 0.08)',
  lg: '0 12px 32px rgba(39, 61, 113, 0.12)',
};
