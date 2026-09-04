import { colors, radius as sharedRadius, spacing as sharedSpacing } from '@wmc/shared';

/**
 * Mobile design tokens. Built on the shared brand palette.
 * Light theme only for MVP — minimal, warm, generous whitespace.
 */
export const theme = {
  colors: {
    background: colors.warmWhite,
    surface: colors.white,
    surfaceMuted: colors.gray100,
    primary: colors.deepGreen,
    primaryPressed: colors.forest,
    accent: colors.softGreen,
    accentSoft: colors.mintGreen,
    text: colors.black,
    textSecondary: colors.gray700,
    textMuted: colors.gray500,
    border: colors.gray200,
    borderStrong: colors.gray300,
    danger: colors.danger,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    gold: colors.gold,
    terracotta: colors.terracotta,
    white: colors.white,
  },
  radius: { ...sharedRadius, card: 16 },
  spacing: sharedSpacing,
  font: {
    display: 34,
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    small: 14,
    caption: 12,
  },
  shadow: {
    card: {
      shadowColor: '#0B4A3F',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  },
} as const;

export type Theme = typeof theme;
