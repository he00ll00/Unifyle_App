export const colors = {
  // App main colour (workspace page and screens outside an organization).
  primary: '#2f5fcc',
  primarySoft: '#e3ecff',
  // Neutral, slightly cool greys (the old values leaned green).
  bg: '#F4F6FB',
  card: '#FFFFFF',
  text: '#1d2433',
  /** Secondary text. */
  muted: '#6b7590',
  /** Icons and placeholders (from the Figma frame). */
  icon: '#6b7590',
  border: '#e0e4ee',
  warn: '#B45309',
  warnSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#15803D',
  successSoft: '#DCFCE7',
  // "Info" is the app's main blue, so status pills match the rest of the app.
  info: '#2f5fcc',
  infoSoft: '#e3ecff',
};

/** Inter files by weight. The web console's headings are lighter, so bold (700) uses SemiBold. */
export const fonts = {
  regular: 'Inter_400Regular',
  byWeight: {
    '400': 'Inter_400Regular',
    normal: 'Inter_400Regular',
    '500': 'Inter_500Medium',
    '600': 'Inter_600SemiBold',
    '700': 'Inter_600SemiBold',
    bold: 'Inter_600SemiBold',
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
 * Soft card shadow, like the web console's (0 6px 24px at 8% blue). The Figma value was much heavier
 * and looked dark on a phone. React Native's radius is about half of a CSS blur, so 12 here is the 24 there.
 * On Android the shadow is the system elevation (always grey), so it is kept low.
 */
export const shadow = {
  shadowColor: '#4664C8',
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

/** Shadow cast upward by the bottom navigation bar. */
export const shadowTop = {
  shadowColor: '#4664C8',
  shadowOpacity: 0.07,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: -3 },
  elevation: 3,
} as const;
