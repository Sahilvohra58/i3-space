import { useMemo } from "react";
import type { TrackerRow } from "../api/tracker";

export type Platform = "youtube" | "instagram" | "twitter";

export interface TrackerEntry extends TrackerRow {
  platform: Platform;
}

export interface KPIs {
  totalViews: number;
  totalMinutes: number;
  channelCount: number;
  dateRange: string;
}

export interface BarDatum {
  channel_name: string;
  views: number;
}

// Each entry is { date, [channelName]: minutes, ... }
export type LineDatum = Record<string, string | number>;

export interface PieDatum {
  name: string;
  value: number;
}

export interface BoardData {
  kpis: KPIs;
  barData: BarDatum[];
  lineData: LineDatum[];
  pieData: PieDatum[];
  channels: string[];
}

export function useBoardData(entries: TrackerEntry[]): BoardData {
  return useMemo(() => {
    if (entries.length === 0) {
      return {
        kpis: { totalViews: 0, totalMinutes: 0, channelCount: 0, dateRange: "—" },
        barData: [],
        lineData: [],
        pieData: [],
        channels: [],
      };
    }

    const totalViews = entries.reduce((s, e) => s + e.views, 0);
    const totalMinutes = entries.reduce((s, e) => s + e.minutes_watched, 0);

    const channelSet = new Set(entries.map((e) => e.channel_name));
    const channels = Array.from(channelSet);

    const sortedDates = [...entries].map((e) => e.date).sort();
    const dateRange =
      sortedDates[0] === sortedDates[sortedDates.length - 1]
        ? sortedDates[0]
        : `${sortedDates[0]} → ${sortedDates[sortedDates.length - 1]}`;

    // Bar: total views per channel, sorted descending
    const viewsByChannel: Record<string, number> = {};
    for (const e of entries) {
      viewsByChannel[e.channel_name] = (viewsByChannel[e.channel_name] ?? 0) + e.views;
    }
    const barData: BarDatum[] = Object.entries(viewsByChannel)
      .map(([channel_name, views]) => ({ channel_name, views }))
      .sort((a, b) => b.views - a.views);

    // Line: minutes watched per date, one key per channel
    const lineMap: Record<string, LineDatum> = {};
    for (const e of entries) {
      if (!lineMap[e.date]) lineMap[e.date] = { date: e.date };
      lineMap[e.date][e.channel_name] =
        ((lineMap[e.date][e.channel_name] as number) ?? 0) + e.minutes_watched;
    }
    const lineData = Object.values(lineMap).sort((a, b) =>
      (a.date as string).localeCompare(b.date as string)
    );

    // Pie: share of total views by channel
    const pieData: PieDatum[] = barData.map(({ channel_name, views }) => ({
      name: channel_name,
      value: views,
    }));

    return {
      kpis: { totalViews, totalMinutes, channelCount: channels.length, dateRange },
      barData,
      lineData,
      pieData,
      channels,
    };
  }, [entries]);
}
