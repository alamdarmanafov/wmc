import { COMMUNITY_CATEGORIES } from '@wmc/shared';
import { format, formatDistanceToNowStrict, isToday, isTomorrow, parse, isValid } from 'date-fns';

export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, d MMM');
}

export function formatTime(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

export function formatDateTime(iso: string): string {
  return `${formatEventDate(iso)} · ${formatTime(iso)}`;
}

export function timeAgo(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export function categoryEmoji(slug: string): string {
  return COMMUNITY_CATEGORIES.find((c) => c.slug === slug)?.emoji ?? '✨';
}

export function categoryName(slug: string): string {
  return COMMUNITY_CATEGORIES.find((c) => c.slug === slug)?.name ?? 'Other';
}

/** Parses `YYYY-MM-DD` + `HH:mm` (local time) into a Date, or null when invalid. */
export function parseDateTime(date: string, time: string): Date | null {
  const d = parse(`${date.trim()} ${time.trim()}`, 'yyyy-MM-dd HH:mm', new Date());
  return isValid(d) ? d : null;
}

/** Parses `HH:mm` as a time today (local). */
export function parseTimeToday(time: string): Date | null {
  const d = parse(time.trim(), 'HH:mm', new Date());
  return isValid(d) ? d : null;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
