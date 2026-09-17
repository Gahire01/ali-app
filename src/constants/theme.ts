export const colors = {
  background: '#0b0b0b',
  panel: '#161616',
  panelTranslucent: 'rgba(22,22,22,0.85)',
  border: 'rgba(255,255,255,0.07)',
  primary: '#b71c1c',
  primaryPressed: '#9c1717',
  secondary: '#d6a83d',
  text: '#f7f5f0',
  muted: '#8f8d88',
  subtle: '#5a5854',
  success: '#75b798',
  error: '#e57373',
  white: '#ffffff',
  black: '#000000',
} as const;

export const radius = {
  card: 12,
  input: 14,
  pill: 30,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  headline: 32,
  h1: 24,
  h2: 20,
  h3: 17,
  body: 15,
  caption: 13,
  small: 12,
  button: 14,
} as const;

export const lineHeight = {
  headline: 36,
  h1: 30,
  h2: 26,
  h3: 24,
  body: 22,
  caption: 18,
  small: 16,
  button: 18,
} as const;

export const letterSpacing = {
  tight: -0.5,
  heading: 1,
  button: 2,
} as const;

export const font = {
  headline: { fontWeight: '800' as const, letterSpacing: letterSpacing.heading },
  button: { fontWeight: '800' as const, letterSpacing: letterSpacing.button },
} as const;

export const shadow = {
  cta: {
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
} as const;

export const touchTarget = 44 as const;

export const brand = {
  name: 'ALI Boxing Club',
  tagline: 'Train Like a Champion.',
  scheme: 'aliboxing',
  staffEmail: 'gahiredev01@gmail.com',
} as const;