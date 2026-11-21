import React, { useState, useEffect, useCallback } from "react";
import type { Movie } from "./types";
import { getMovies, ApiError } from "./api";
import { Header, type TabKey } from "./components/Header";
import { MoviesView } from "./components/MoviesView";
import { RewatchPlanView } from "./components/RewatchPlanView";
import { BookingView } from "./components/BookingView";
import "./App.css";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("movies");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all movies from backend
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMovies();
      setMovies(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to connect to backend server. Make sure it is running on port 3000.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-zinc-950 relative overflow-x-hidden">
      {/* Fixed App-wide Cinematic Background with dark overlay & graceful fallback */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src="/posters/doomsday-bg.jpg"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center fixed inset-0 opacity-30 filter brightness-90 contrast-110"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = "none";
          }}
        />
        {/* Cinematic dark overlay: subtle at top, deeper at bottom */}
        <div className="fixed inset-0 bg-gradient-to-b from-zinc-950/75 via-zinc-950/85 to-zinc-950/95" />
        {/* Subtle radial lighting */}
        <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-red-600/10 blur-[140px] pointer-events-none" />
        <div className="absolute top-[25%] right-[5%] w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[25%] w-[500px] h-[500px] rounded-full bg-amber-500/8 blur-[140px] pointer-events-none" />
      </div>

      {/* Hero Header with Tabs */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        movieCount={movies.length}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 relative z-10">
        {activeTab === "movies" && (
          <MoviesView
            movies={movies}
            loading={loading}
            error={error}
            onRefresh={fetchMovies}
          />
        )}

        {activeTab === "rewatch" && (
          <RewatchPlanView
            movies={movies}
            onMoviesChanged={fetchMovies}
          />
        )}

        {activeTab === "booking" && <BookingView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/95 py-6 text-center text-xs text-zinc-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="font-bold text-zinc-300">DOOMSDAY READY</span>
            <span>—</span>
            <span className="text-zinc-400">MCU Rewatch & Ticket Planner</span>
          </div>
          <p className="text-zinc-500 text-[11px]">
            Movie artwork belongs to Marvel Studios / Disney. Used for demonstration only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
