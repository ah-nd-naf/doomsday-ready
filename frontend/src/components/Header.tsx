import React from "react";
import { FilmIcon, ListOrderedIcon, TicketIcon, DoomsdayLogo } from "./Icons";

export type TabKey = "movies" | "rewatch" | "booking";

interface HeaderProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  movieCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  movieCount,
}) => {
  const tabs: { key: TabKey; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    {
      key: "movies",
      label: "MCU Movies",
      shortLabel: "Movies",
      icon: <FilmIcon className="w-4 h-4 flex-shrink-0" />,
    },
    {
      key: "rewatch",
      label: "Rewatch Plan",
      shortLabel: "Rewatch",
      icon: <ListOrderedIcon className="w-4 h-4 flex-shrink-0" />,
    },
    {
      key: "booking",
      label: "Cinema Booking",
      shortLabel: "Booking",
      icon: <TicketIcon className="w-4 h-4 flex-shrink-0" />,
    },
  ];

  return (
    <header className="relative border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top cinematic glowing accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 opacity-90 shadow-[0_0_15px_rgba(237,29,36,0.6)]" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 sm:py-4 gap-3.5 sm:gap-4">
          {/* Logo & Hero Title with Bespoke Cinema Mark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/20 via-zinc-900 to-zinc-950 border border-red-500/40 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(237,29,36,0.3)] flex-shrink-0">
              <DoomsdayLogo className="w-6 h-6 text-red-500" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-amber-300 uppercase font-sans drop-shadow-sm whitespace-nowrap">
                  DOOMSDAY READY
                </h1>
                <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-red-600/15 text-red-400 border border-red-600/30 whitespace-nowrap">
                  SACRED TIMELINE
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 tracking-wide mt-0.5 line-clamp-1 sm:line-clamp-none">
                Topological MCU rewatch marathon & Avengers: Doomsday watch party planner
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Flawless on all mobile viewports */}
          <nav className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-inner w-full sm:w-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-red-600 text-white font-bold shadow-[0_0_20px_rgba(237,29,36,0.45)]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                  }`}
                >
                  {tab.icon}
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.key === "movies" && movieCount !== undefined && (
                    <span
                      className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? "bg-black/30 text-white font-bold"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {movieCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
