import React from "react";
import { FilmIcon, ListOrderedIcon, TicketIcon } from "./Icons";

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
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: "movies",
      label: "MCU Movies",
      icon: <FilmIcon className="w-4 h-4" />,
    },
    {
      key: "rewatch",
      label: "Rewatch Plan",
      icon: <ListOrderedIcon className="w-4 h-4" />,
    },
    {
      key: "booking",
      label: "Cinema Booking",
      icon: <TicketIcon className="w-4 h-4" />,
    },
  ];

  return (
    <header className="relative border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top iconic Marvel / Doomsday cinematic glowing accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 opacity-90 shadow-[0_0_15px_rgba(237,29,36,0.6)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
          {/* Logo & Hero Title with Iconic Marvel Studios Badge */}
          <div className="flex items-center gap-3.5">
            {/* Marvel Studios Iconic Red Block Badge */}
            <div className="flex flex-col items-center justify-center bg-[#ED1D24] text-white px-3 py-1 rounded-xs shadow-[0_0_20px_rgba(237,29,36,0.5)] border-y border-white/40 flex-shrink-0 select-none">
              <span className="text-[13px] font-black tracking-[0.24em] leading-none uppercase font-sans">
                MARVEL
              </span>
              <span className="text-[8px] font-extrabold tracking-[0.38em] leading-none uppercase text-zinc-100 mt-0.5">
                STUDIOS
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-amber-300 uppercase font-sans drop-shadow-sm">
                  DOOMSDAY READY
                </h1>
                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-red-600/15 text-red-400 border border-red-600/30">
                  SACRED TIMELINE
                </span>
              </div>
              <p className="text-xs text-zinc-400 tracking-wide mt-0.5">
                Topological MCU rewatch marathon & Avengers: Doomsday watch party planner
              </p>
            </div>
          </div>

          {/* Navigation Tabs with Marvel Cinematic Accent */}
          <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-inner">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-red-600 text-white font-bold shadow-[0_0_20px_rgba(237,29,36,0.45)]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.key === "movies" && movieCount !== undefined && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
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
