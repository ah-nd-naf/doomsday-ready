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
      {/* Background radial atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px]" />
      </div>

      {/* Hero Header with Tabs */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        movieCount={movies.length}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
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
      <footer className="border-t border-zinc-800/80 bg-zinc-950/90 py-6 text-center text-xs text-zinc-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="font-semibold text-zinc-400">Doomsday Ready</span>
            <span>—</span>
            <span>Internship Assessment</span>
          </div>
          <p className="text-zinc-500 text-[11px]">
            Pure algorithms for cycle detection, topological rewatch sorting & DP minimum bundle booking.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
