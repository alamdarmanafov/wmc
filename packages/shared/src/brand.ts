/**
 * WMC brand tokens — single source of truth for mobile, web and admin.
 * Direction: premium, minimal, global. Not "Islamic green" heavy.
 * Reference: Apple / Airbnb / Notion simplicity.
 */
export const brand = {
  name: 'WMC',
  fullName: 'World Muslim Community',
  tagline: 'Find your people, wherever you are.',
  taglineEmotional: 'You are never alone.',
  positioning:
    'A community platform for Muslims to discover people, activities and communities around them.',
  domainSuggestions: ['wmc.app', 'wmcommunity.app', 'joinwmc.com'],
} as const;

export const colors = {
  // Primary palette
  deepGreen: '#0B4A3F', // matches icon.png background
  forest: '#0B3D35',
  green: '#1E5F52',
  softGreen: '#DCE9E3',
  mintGreen: '#EEF5F1',
  // Neutrals
  warmWhite: '#FAF9F5',
  cream: '#F7F3E8',
  black: '#111111',
  ink: '#1F2A28',
  gray900: '#2B3432',
  gray700: '#4F5B58',
  gray500: '#7B8582',
  gray300: '#C9D1CE',
  gray200: '#E3E8E6',
  gray100: '#F1F4F3',
  white: '#FFFFFF',
  // Semantic
  success: '#1F8A5B',
  warning: '#C9891B',
  danger: '#C0392B',
  info: '#2F6FED',
  // Accents (used sparingly on category chips)
  gold: '#C9A961',
  terracotta: '#D47A4E',
} as const;

export const typography = {
  /** Primary UI font (Latin) */
  sans: 'Inter',
  /** Alternative if Inter is not desired */
  sansAlt: 'Manrope',
  /** Arabic companion font */
  arabic: 'IBM Plex Sans Arabic',
  scale: {
    display: 40,
    h1: 32,
    h2: 26,
    h3: 20,
    body: 16,
    small: 14,
    caption: 12,
  },
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
