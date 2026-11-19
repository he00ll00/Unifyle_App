export const colors = {
  // App main colour (workspace page and screens outside an organization).
  primary: '#2965DD',
  primarySoft: '#E9EFFB',
  // Neutral, slightly cool greys (the old values leaned green).
  bg: '#F4F6FB',
  card: '#FFFFFF',
  text: '#111827',
  /** Secondary text. */
  muted: '#6B7280',
  /** Icons and placeholders (from the Figma frame). */
  icon: '#8A98A8',
  border: '#E5E9F0',
  warn: '#B45309',
  warnSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#15803D',
  successSoft: '#DCFCE7',
  // "Info" is the app's main blue, so status pills match the rest of the app.
  info: '#2965DD',
  infoSoft: '#E9EFFB',
};

/** Inter files by weight. 800 is folded into 700 so there are four weights in total. */
export const fonts = {
  regular: 'Inter_400Regular',
  byWeight: {
    '400': 'Inter_400Regular',
    normal: 'Inter_400Regular',
    '500': 'Inter_500Medium',
    '600': 'Inter_600SemiBold',
    '700': 'Inter_700Bold',
    bold: 'Inter_700Bold',
  },
} as const;


function mix(hex: string, other: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [p(hex), p(other)];
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** Derives the shades a screen needs from one agency brand colour. */
export function makeBrand(hex: string) {
  return {
    primary: hex,
    dark: mix(hex, '#000000', 0.28),
    soft: mix(hex, '#FFFFFF', 0.88),
    light: mix(hex, '#FFFFFF', 0.5),
    /** Between `soft` and `light`: the deeper end of a banner fade. */
    mid: mix(hex, '#FFFFFF', 0.72),
  };
}
export type Brand = ReturnType<typeof makeBrand>;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

/**
 * Drop shadow from the design (Figma): X 0, Y 8, blur 11.7, spread -1, #004EEA at 30%.
 * React Native has no spread, and its radius is about half of Figma's blur.
 */
export const shadow = {
  shadowColor: '#004EEA',
  shadowOpacity: 0.3,
  shadowRadius: 5.85,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
} as const;

/** Shadow cast upward by the bottom navigation bar. */
export const shadowTop = {
  shadowColor: '#004EEA',
  shadowOpacity: 0.12,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: -4 },
  elevation: 8,
} as const;
