"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import type { SignupsByDayRow } from "@/lib/database.types";

// Validated categorical pair (dataviz skill): passes CVD + contrast checks on a light surface.
const SERIES = [
  { key: "signups", label: "Signups", color: "#128F6E" },
  { key: "active", label: "Active users", color: "#3B6FE0" },
] as const;

interface Point {
  day: string;
  label: string;
  signups: number;
  active: number;
}

export function DashboardChart({ rows }: { rows: SignupsByDayRow[] }) {
  const data: Point[] = rows.map((r) => ({
    day: r.day,
    label: format(parseISO(r.day), "d MMM"),
    signups: Number(r.signups) || 0,
    active: Number(r.active) || 0,
  }));

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-500">No activity recorded yet.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-5 text-xs text-gray-700">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="#E3E8E6" strokeDasharray="0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7B8582" }} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7B8582" }} allowDecimals={false} width={44} />
            <Tooltip
              cursor={{ stroke: "#C9D1CE", strokeWidth: 1 }}
              contentStyle={{ borderRadius: 12, border: "1px solid #E3E8E6", fontSize: 12, boxShadow: "0 8px 24px -12px rgba(11,61,53,.3)" }}
              labelStyle={{ color: "#2B3432", fontWeight: 600 }}
              formatter={(value, name) => [value, SERIES.find((s) => s.key === name)?.label ?? String(name)]}
            />
            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-xs text-gray-500">
        <summary className="cursor-pointer">Show as table</summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-100/70">
              <tr>
                <th className="px-3 py-1.5 font-medium">Day</th>
                <th className="px-3 py-1.5 font-medium">Signups</th>
                <th className="px-3 py-1.5 font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.day} className="border-t border-gray-200">
                  <td className="px-3 py-1">{d.label}</td>
                  <td className="px-3 py-1 tabular-nums">{d.signups}</td>
                  <td className="px-3 py-1 tabular-nums">{d.active}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
