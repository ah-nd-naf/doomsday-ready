import React, { useState, useEffect } from "react";
import type { Movie, RewatchOrderResponse } from "../types";
import { getRewatchOrder, updateMovie, ApiError } from "../api";
import { slugify } from "../utils/slugify";
import { MoviePoster } from "./MoviePoster";
import {
  ListOrderedIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  CalendarIcon,
  AlertCircleIcon,
  RefreshIcon,
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
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-600/30 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(237,29,36,0.2)] flex-shrink-0">
            <ListOrderedIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2 flex-wrap">
              <span>The Sacred Timeline Rewatch Order</span>
              <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-300 border border-red-600/30 font-mono uppercase tracking-wider">
                Toposort
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              Chronological & topological storyline dependencies across MCU phases
            </p>
          </div>
        </div>

        {/* Target Movie Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-zinc-400 font-medium whitespace-nowrap hidden sm:inline">
            Target:
          </label>
          <select
            value={selectedMovieId ?? ""}
            onChange={(e) => setSelectedMovieId(Number(e.target.value))}
            className="w-full sm:w-auto flex-1 min-w-0 bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 font-semibold focus:outline-none focus:border-red-500 cursor-pointer shadow-inner truncate"
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
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer flex-shrink-0"
            >
              <RefreshIcon className={`w-4 h-4 ${loading ? "animate-spin text-red-500" : ""}`} />
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
          <div className="relative overflow-hidden bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
            {/* Blurred Target Poster Backdrop */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <img
                src={`/posters/${slugify(plan.target.title)}.jpg`}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover object-center filter blur-sm scale-110 opacity-35"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/80 to-zinc-950/90" />
            </div>

            {/* Ambient background glow */}
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-red-400 font-mono">
                  Sacred Timeline Roadmap for:
                </span>
                <h3 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-amber-300 tracking-wide mt-1 drop-shadow-sm">
                  {plan.target.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400 mt-1">
                  {plan.summary.total === 0
                    ? "This movie has no prerequisites. You can jump straight into the premiere!"
                    : `Must watch all ${plan.summary.total} prerequisites in the timeline order below before ${plan.target.title}.`}
                </p>
              </div>

              {/* Stats badges - Flawless 2x2 grid on mobile, 4-col on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-center">
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                    Total
                  </div>
                  <div className="text-lg sm:text-xl font-black text-zinc-100 font-mono">
                    {plan.summary.total}
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-center">
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-emerald-400 font-medium">
                    Watched
                  </div>
                  <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                    {plan.summary.watched}
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-center">
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-amber-400 font-medium">
                    Remaining
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                    {plan.summary.unwatched}
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-center">
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                    Watch Time Left
                  </div>
                  <div className="text-lg sm:text-xl font-black text-zinc-100 font-mono">
                    {formatTime(plan.summary.remainingRuntimeMinutes)}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar (if total > 0) */}
            {plan.summary.total > 0 && (
              <div className="relative z-10 mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {plan.summary.watched} of {plan.summary.total} watched
                    </span>
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {Math.round((plan.summary.watched / plan.summary.total) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(237,29,36,0.6)]"
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
                    className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                      movie.watched
                        ? "bg-zinc-900/40 border-zinc-800/60 opacity-80"
                        : "bg-zinc-900/90 border-zinc-800 hover:border-emerald-500/40 shadow-md"
                    }`}
                  >
                    {/* Step Number */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black font-mono flex-shrink-0 ${
                        movie.watched
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-950/40 text-red-300 border border-red-700/50"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Movie Poster Thumbnail */}
                    <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-800 shadow-sm bg-zinc-950">
                      <MoviePoster
                        title={movie.title}
                        alt={`Poster for ${movie.title}`}
                        loading="lazy"
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover"
                      />
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

                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
                        movie.watched
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                      }`}
                    >
                      {movie.watched ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 fill-emerald-500/20" />
                          <span className="hidden sm:inline">Watched</span>
                        </>
                      ) : (
                        <>
                          <CircleIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">Mark Watched</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Destination Movie Finale Step */}
              <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-amber-500/50 bg-gradient-to-r from-red-950/40 via-zinc-900/80 to-amber-950/30 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black text-xs font-mono flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.6)]">
                  ★
                </div>
                <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 border border-amber-500/60 shadow-md bg-zinc-950">
                  <MoviePoster
                    title={plan.target.title}
                    alt={`Poster for ${plan.target.title}`}
                    loading="lazy"
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-sm">
                      PHASE FINALE
                    </span>
                    <h4 className="font-black text-sm text-zinc-100 truncate">
                      {plan.target.title}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Ready for opening night watch party after completing the Sacred Timeline checklist!
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
