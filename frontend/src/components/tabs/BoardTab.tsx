import { useEffect, useState } from "react";
import { getTrackerRows } from "../../api/tracker";
import { getVolunteerSnapshots, type VolunteerSnapshot } from "../../api/volunteers";
import { getLoyaltySnapshots, type LoyaltySnapshot } from "../../api/loyalty";
import { getOutreachSnapshots, type OutreachSnapshot } from "../../api/outreach";
import { getBusinessSnapshots, type BusinessSnapshot } from "../../api/business";
import { getSponsorshipSnapshots, type SponsorshipSnapshot } from "../../api/sponsorships";
import { getMediaSalesSnapshots, type MediaSalesSnapshot } from "../../api/mediaSales";
import { getTeamSnapshots, type TeamSnapshot } from "../../api/team";
import { useBoardData, type TrackerEntry } from "../../hooks/useBoardData";
import { useVolunteerData } from "../../hooks/useVolunteerData";
import { cached, invalidate as invalidateBoardCache } from "../../utils/boardCache";
import StatCard from "../board/StatCard";
import PlatformFilter, { type PlatformFilter as PlatformFilterType } from "../board/PlatformFilter";
import DateRangeFilter, { type DateRange } from "../board/DateRangeFilter";
import ViewsBarChart from "../board/ViewsBarChart";
import MinutesLineChart from "../board/MinutesLineChart";
import ChannelPieChart from "../board/ChannelPieChart";
import VolunteerKpiCards from "../board/volunteers/VolunteerKpiCards";
import VolunteerTrendChart from "../board/volunteers/VolunteerTrendChart";
import CategorySection from "../board/categories/CategorySection";
import { LOYALTY_KPIS, LOYALTY_CHARTS } from "../board/categories/loyaltySpecs";
import { OUTREACH_KPIS, OUTREACH_CHARTS } from "../board/categories/outreachSpecs";
import { BUSINESS_KPIS, BUSINESS_CHARTS } from "../board/categories/businessSpecs";
import { SPONSORSHIPS_KPIS, SPONSORSHIPS_CHARTS } from "../board/categories/sponsorshipsSpecs";
import { MEDIA_SALES_KPIS, MEDIA_SALES_CHARTS } from "../board/categories/mediaSalesSpecs";
import { TEAM_KPIS, TEAM_CHARTS } from "../board/categories/teamSpecs";

// Icons
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const ChannelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const fmtViews = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : `${v}`;

const fmtMins = (v: number) =>
  v >= 60 ? `${Math.floor(v / 60)}h ${v % 60}m` : `${v}m`;

export default function BoardTab() {
  const [allEntries, setAllEntries] = useState<TrackerEntry[]>([]);
  const [allSnapshots, setAllSnapshots] = useState<VolunteerSnapshot[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltySnapshot[]>([]);
  const [outreach, setOutreach] = useState<OutreachSnapshot[]>([]);
  const [business, setBusiness] = useState<BusinessSnapshot[]>([]);
  const [sponsorships, setSponsorships] = useState<SponsorshipSnapshot[]>([]);
  const [mediaSales, setMediaSales] = useState<MediaSalesSnapshot[]>([]);
  const [team, setTeam] = useState<TeamSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilterType>("all");
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all", start: "", end: "" });

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError("");
    if (forceRefresh) invalidateBoardCache();
    try {
      const [
        rows,
        snapshots,
        loyaltyRows,
        outreachRows,
        businessRows,
        sponsorshipRows,
        mediaSalesRows,
        teamRows,
      ] = await Promise.all([
        cached("tracker", getTrackerRows),
        cached("volunteers", getVolunteerSnapshots),
        cached("loyalty", getLoyaltySnapshots),
        cached("outreach", getOutreachSnapshots),
        cached("business", getBusinessSnapshots),
        cached("sponsorships", getSponsorshipSnapshots),
        cached("media-sales", getMediaSalesSnapshots),
        cached("team", getTeamSnapshots),
      ]);
      const entries: TrackerEntry[] = rows.map((r) => ({ ...r, platform: "youtube" }));
      setAllEntries(entries);
      setAllSnapshots(snapshots);
      setLoyalty(loyaltyRows);
      setOutreach(outreachRows);
      setBusiness(businessRows);
      setSponsorships(sponsorshipRows);
      setMediaSales(mediaSalesRows);
      setTeam(teamRows);
    } catch {
      setError("Failed to load data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = <T extends { date: string }>(rows: T[]): T[] =>
    rows.filter((r) => {
      if (dateRange.preset === "all" || !dateRange.start || !dateRange.end) return true;
      return r.date >= dateRange.start && r.date <= dateRange.end;
    });

  useEffect(() => { fetchData(); }, []);

  // Apply platform filter
  const byPlatform: TrackerEntry[] =
    platformFilter === "all"
      ? allEntries
      : allEntries.filter((e) => e.platform === platformFilter);

  // Apply date range filter to YouTube entries
  const filtered: TrackerEntry[] = byPlatform.filter((e) => {
    if (dateRange.preset === "all" || !dateRange.start || !dateRange.end) return true;
    return e.date >= dateRange.start && e.date <= dateRange.end;
  });

  const filteredSnapshots = filterByDate(allSnapshots);
  const filteredLoyalty = filterByDate(loyalty);
  const filteredOutreach = filterByDate(outreach);
  const filteredBusiness = filterByDate(business);
  const filteredSponsorships = filterByDate(sponsorships);
  const filteredMediaSales = filterByDate(mediaSales);
  const filteredTeam = filterByDate(team);

  const { kpis, barData, lineData, pieData, channels } = useBoardData(filtered);
  const volunteer = useVolunteerData(filteredSnapshots);

  // Platforms that actually have data
  const availablePlatforms = Array.from(new Set(allEntries.map((e) => e.platform)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Board</h2>
        <button
          onClick={() => fetchData(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshIcon />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Platform filter */}
      <PlatformFilter
        active={platformFilter}
        available={["all", ...availablePlatforms]}
        onChange={setPlatformFilter}
      />

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Views"
          value={loading ? "—" : fmtViews(kpis.totalViews)}
          icon={<EyeIcon />}
        />
        <StatCard
          label="Minutes Watched"
          value={loading ? "—" : fmtMins(kpis.totalMinutes)}
          icon={<ClockIcon />}
        />
        <StatCard
          label="Channels Tracked"
          value={loading ? "—" : kpis.channelCount}
          icon={<ChannelIcon />}
        />
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Charts */}
      {!loading && (
        <>
          {/* Views by channel — full width */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Views by Channel</h3>
            <ViewsBarChart data={barData} />
          </div>

          {/* Line + Pie side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">Minutes Watched over Time</h3>
              <MinutesLineChart data={lineData} channels={channels} />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">Channel Share of Views</h3>
              <ChannelPieChart data={pieData} />
            </div>
          </div>
        </>
      )}

      {/* Human Resources section */}
      <div className="pt-4 border-t border-gray-200 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Human Resources</h2>
          {volunteer.hasData && (
            <span className="text-xs text-gray-400">Latest snapshot: {volunteer.latestDate}</span>
          )}
        </div>

        {!volunteer.hasData && !loading ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-8 text-center text-sm text-gray-500">
            No HR snapshots yet — add one in the <strong>Volunteers</strong>, <strong>Engagement</strong>, or <strong>Process</strong> tab.
          </div>
        ) : (
          <>
            <VolunteerKpiCards kpis={volunteer.kpis} loading={loading} />
            {!loading && <VolunteerTrendChart data={volunteer.trend} />}
          </>
        )}
      </div>

      <CategorySection
        title="Loyalty & Partnership"
        snapshots={filteredLoyalty}
        kpiSpecs={LOYALTY_KPIS}
        chartSpecs={LOYALTY_CHARTS}
        loading={loading}
        emptyStateTabName="Loyalty"
        smColsClass="sm:grid-cols-2 lg:grid-cols-5"
        chartColsClass="lg:grid-cols-3"
      />

      <CategorySection
        title="Business Outreach"
        snapshots={filteredOutreach}
        kpiSpecs={OUTREACH_KPIS}
        chartSpecs={OUTREACH_CHARTS}
        loading={loading}
        emptyStateTabName="Outreach"
        smColsClass="sm:grid-cols-2 lg:grid-cols-5"
        chartColsClass="lg:grid-cols-3"
      />

      <CategorySection
        title="Business Enrolled"
        snapshots={filteredBusiness}
        kpiSpecs={BUSINESS_KPIS}
        chartSpecs={BUSINESS_CHARTS}
        loading={loading}
        emptyStateTabName="Business"
        smColsClass="sm:grid-cols-2 lg:grid-cols-4"
        chartColsClass="lg:grid-cols-4"
      />

      <CategorySection
        title="Sponsorships"
        snapshots={filteredSponsorships}
        kpiSpecs={SPONSORSHIPS_KPIS}
        chartSpecs={SPONSORSHIPS_CHARTS}
        loading={loading}
        emptyStateTabName="Sponsorships"
        smColsClass="sm:grid-cols-2 lg:grid-cols-5"
        chartColsClass="lg:grid-cols-3"
      />

      <CategorySection
        title="Media Sales"
        snapshots={filteredMediaSales}
        kpiSpecs={MEDIA_SALES_KPIS}
        chartSpecs={MEDIA_SALES_CHARTS}
        loading={loading}
        emptyStateTabName="Media Sales"
        smColsClass="sm:grid-cols-2"
        chartColsClass="lg:grid-cols-2"
      />

      <CategorySection
        title="Team"
        snapshots={filteredTeam}
        kpiSpecs={TEAM_KPIS}
        chartSpecs={TEAM_CHARTS}
        loading={loading}
        emptyStateTabName="Team"
        smColsClass="sm:grid-cols-3"
        chartColsClass="lg:grid-cols-3"
      />
    </div>
  );
}
