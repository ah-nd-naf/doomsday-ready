import React, { useState, useEffect } from "react";
import type { Movie, RewatchOrderResponse } from "../types";
import { getRewatchOrder, updateMovie, ApiError } from "../api";
import {
  ListOrderedIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  CalendarIcon,
  AlertCircleIcon,
  RefreshIcon,
  SparklesIcon,
} from "./Icons";

interface RewatchPlanViewProps {
  movies: Movie[];
  onMoviesChanged: () => void;
}

export const RewatchPlanView: React.FC<RewatchPlanViewProps> = ({
  movies,
  onMoviesChanged,
}) => {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [plan, setPlan] = useState<RewatchOrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Default selection to "Avengers: Doomsday" or the last movie if available
  useEffect(() => {
    if (selectedMovieId === null && movies.length > 0) {
      const doomsday = movies.find((m) =>
        m.title.toLowerCase().includes("doomsday")
      );
      if (doomsday) {
        setSelectedMovieId(doomsday.id);
      } else {
        setSelectedMovieId(movies[movies.length - 1].id);
      }
    }
  }, [movies, selectedMovieId]);

  // Fetch rewatch order whenever selectedMovieId changes
  const fetchPlan = async (movieId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRewatchOrder(movieId);
      setPlan(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load rewatch plan.");
      }
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMovieId) {
      fetchPlan(selectedMovieId);
    }
  }, [selectedMovieId]);

  // Format minutes into "5h 12m"
  const formatTime = (minutes: number) => {
    if (minutes === 0) return "0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const handleToggleWatched = async (movie: { id: number; watched: boolean }) => {
    try {
      setTogglingId(movie.id);
      await updateMovie(movie.id, { watched: !movie.watched });
      onMoviesChanged();
      if (selectedMovieId) {
        await fetchPlan(selectedMovieId);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Failed to update watched status");
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Selector Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ListOrderedIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              MCU Rewatch Order Generator
            </h2>
            <p className="text-xs text-zinc-400">
              Topologically sorted rewatch timeline based on storyline dependencies
            </p>
          </div>
        </div>

        {/* Target Movie Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 font-medium whitespace-nowrap">
            Target Destination:
          </label>
          <select
            value={selectedMovieId ?? ""}
            onChange={(e) => setSelectedMovieId(Number(e.target.value))}
            className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
          >
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.releaseYear})
              </option>
            ))}
          </select>
          {selectedMovieId && (
            <button
              onClick={() => fetchPlan(selectedMovieId)}
              title="Refresh plan"
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <RefreshIcon className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !plan && (
        <div className="space-y-4">
          <div className="h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse p-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-20 rounded-xl bg-zinc-900/40 border border-zinc-800 animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Loaded Plan Display */}
      {plan && (
        <div className="space-y-6">
          {/* Summary & Progress Card */}
          <div className="relative overflow-hidden bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            {/* Ambient background glow */}
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 font-mono">
                  Rewatch Roadmap for:
                </span>
                <h3 className="text-2xl font-black text-zinc-100 tracking-wide mt-1">
                  {plan.target.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {plan.summary.total === 0
                    ? "This movie has no prerequisites. You can jump straight in!"
                    : `Must watch all ${plan.summary.total} prerequisites in the order below before watching ${plan.target.title}.`}
                </p>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                    Total
                  </div>
                  <div className="text-xl font-black text-zinc-100 font-mono">
                    {plan.summary.total}
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                  <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-medium">
                    Watched
                  </div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {plan.summary.watched}
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                  <div className="text-[11px] uppercase tracking-wider text-amber-400 font-medium">
                    Remaining
                  </div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {plan.summary.unwatched}
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-4 py-2.5 text-center min-w-[110px]">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                    Watch Time Left
                  </div>
                  <div className="text-xl font-black text-zinc-100 font-mono">
                    {formatTime(plan.summary.remainingRuntimeMinutes)}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar (if total > 0) */}
            {plan.summary.total > 0 && (
              <div className="mt-6 pt-5 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-emerald-400" />
                    <span>
                      {plan.summary.watched} of {plan.summary.total} watched
                    </span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {Math.round((plan.summary.watched / plan.summary.total) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{
                      width: `${(plan.summary.watched / plan.summary.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Empty state when order is empty */}
          {plan.order.length === 0 ? (
            <div className="text-center py-16 px-4 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircleIcon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">
                Nothing to rewatch first
              </h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
                <span className="text-zinc-200 font-semibold">{plan.target.title}</span> has no prerequisites defined. You can jump directly into it without prior rewatching!
              </p>
            </div>
          ) : (
            /* Ordered Timeline List */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider px-2">
                <span>Recommended Rewatch Sequence</span>
                <span>Click tick to mark as watched</span>
              </div>

              {plan.order.map((movie, index) => {
                const isToggling = togglingId === movie.id;
                return (
                  <div
                    key={movie.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                      movie.watched
                        ? "bg-zinc-900/40 border-zinc-800/60 opacity-80"
                        : "bg-zinc-900/90 border-zinc-800 hover:border-emerald-500/40 shadow-md"
                    }`}
                  >
                    {/* Step Number */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black font-mono flex-shrink-0 ${
                        movie.watched
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Movie Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`font-bold text-sm truncate ${
                            movie.watched ? "text-zinc-400 line-through" : "text-zinc-100"
                          }`}
                        >
                          {movie.title}
                        </h4>
                        {movie.watched && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Completed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-zinc-500" />
                          {movie.releaseYear}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5 text-zinc-500" />
                          {formatTime(movie.runtime)}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Watched Button */}
                    <button
                      onClick={() => handleToggleWatched(movie)}
                      disabled={isToggling}
                      title={movie.watched ? "Mark as unwatched" : "Mark as watched"}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        movie.watched
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                      }`}
                    >
                      {movie.watched ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 fill-emerald-500/20" />
                          <span>Watched</span>
                        </>
                      ) : (
                        <>
                          <CircleIcon className="w-4 h-4" />
                          <span>Mark Watched</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Destination Movie Finale Step */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 to-zinc-900/60 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs font-mono flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                  ★
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Destination
                    </span>
                    <h4 className="font-extrabold text-sm text-zinc-100">
                      {plan.target.title}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Ready for opening night watch party after completing the rewatch checklist!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
