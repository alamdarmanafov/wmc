import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "d MMM yyyy") : "—";
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "d MMM yyyy, HH:mm") : "—";
}

export function fmtAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  return isValid(d) ? `${formatDistanceToNowStrict(d)} ago` : "—";
}

export function fmtNumber(n: number | string | null | undefined): string {
  const v = typeof n === "string" ? Number(n) : n;
  if (v == null || Number.isNaN(v)) return "0";
  return new Intl.NumberFormat("en-GB").format(v);
}

export function shortId(id: string | null | undefined): string {
  return id ? id.slice(0, 8) : "—";
}
