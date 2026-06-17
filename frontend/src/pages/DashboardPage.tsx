import { useState } from "react";
import BoardTab from "../components/tabs/BoardTab";
import TrackerTab from "../components/tabs/TrackerTab";
import VolunteersTab from "../components/tabs/VolunteersTab";
import EngagementTab from "../components/tabs/EngagementTab";
import ProcessTab from "../components/tabs/ProcessTab";
import LoyaltyTab from "../components/tabs/LoyaltyTab";
import OutreachTab from "../components/tabs/OutreachTab";
import BusinessTab from "../components/tabs/BusinessTab";
import SponsorshipsTab from "../components/tabs/SponsorshipsTab";
import MediaSalesTab from "../components/tabs/MediaSalesTab";
import TeamTab from "../components/tabs/TeamTab";

type Tab =
  | "board"
  | "tracker"
  | "volunteers"
  | "engagement"
  | "process"
  | "loyalty"
  | "outreach"
  | "business"
  | "sponsorships"
  | "media_sales"
  | "team";

const TABS: { id: Tab; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "tracker", label: "YouTube" },
  { id: "volunteers", label: "Volunteers" },
  { id: "engagement", label: "Engagement" },
  { id: "process", label: "Process" },
  { id: "loyalty", label: "Loyalty" },
  { id: "outreach", label: "Outreach" },
  { id: "business", label: "Business" },
  { id: "sponsorships", label: "Sponsorships" },
  { id: "media_sales", label: "Media Sales" },
  { id: "team", label: "Team" },
];

interface DashboardPageProps {
  userEmail: string;
  onLogout: () => void;
}

export default function DashboardPage({ userEmail, onLogout }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("board");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-sm">i3 Space</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">{userEmail}</span>
            <button
              onClick={onLogout}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "board" && <BoardTab />}
        {activeTab === "tracker" && <TrackerTab />}
        {activeTab === "volunteers" && <VolunteersTab />}
        {activeTab === "engagement" && <EngagementTab />}
        {activeTab === "process" && <ProcessTab />}
        {activeTab === "loyalty" && <LoyaltyTab />}
        {activeTab === "outreach" && <OutreachTab />}
        {activeTab === "business" && <BusinessTab />}
        {activeTab === "sponsorships" && <SponsorshipsTab />}
        {activeTab === "media_sales" && <MediaSalesTab />}
        {activeTab === "team" && <TeamTab />}
      </main>
    </div>
  );
}
