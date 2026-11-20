import React from "react";
import { FilmIcon, ListOrderedIcon, TicketIcon, SparklesIcon } from "./Icons";

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
    <header className="relative border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Top subtle comic / cinematic ambient glow */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 opacity-90 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
          {/* Logo & Hero Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <SparklesIcon className="w-5 h-5 animate-pulse text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-200 to-emerald-400 uppercase font-mono">
                  Doomsday Ready
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  MCU Rewatch
                </span>
              </div>
              <p className="text-xs text-zinc-400 tracking-wide mt-0.5">
                Plan your marathon before Avengers: Doomsday & book opening-night bundles
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-inner">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-emerald-500 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.key === "movies" && movieCount !== undefined && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? "bg-zinc-950/20 text-zinc-950 font-bold"
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
