import { DISTANCE_BUCKETS, MATCH_WEIGHTS } from './constants';

/** Convert a raw km distance to a privacy-safe label. Never expose exact distance. */
export function distanceLabel(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return 'In your city';
  for (const b of DISTANCE_BUCKETS) {
    if (km <= b.maxKm) return b.label;
  }
  return 'In your city';
}

/** Compatibility as a percentage of the max reachable score. */
export function compatibilityPercent(score: number): number {
  return Math.max(0, Math.min(100, Math.round((score / MATCH_WEIGHTS.maxScore) * 100)));
}

/** Human-friendly "3 interests in common" text */
export function sharedInterestsLabel(shared: string[]): string {
  if (shared.length === 0) return 'Discover something new together';
  if (shared.length === 1) return `You both like ${shared[0]}`;
  if (shared.length === 2) return `You both like ${shared[0]} & ${shared[1]}`;
  return `You have ${shared.length} interests in common`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function greeting(firstName?: string | null): string {
  return firstName ? `Assalamu Alaikum, ${firstName} 👋` : 'Assalamu Alaikum 👋';
}
