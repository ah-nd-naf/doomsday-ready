import React, { useState } from "react";
import type { Movie, CreateMoviePayload } from "../types";
import { createMovie, updateMovie, ApiError } from "../api";
import { MoviePoster } from "./MoviePoster";
import { Modal } from "./Modal";
import {
  PlusIcon,
  EditIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  CalendarIcon,
  SearchIcon,
  AlertCircleIcon,
  RefreshIcon,
} from "./Icons";

interface MoviesViewProps {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

/**
 * Individual Movie Card with prominent theatrical poster, hover zoom, and crisp metadata
 */
const MovieCardItem: React.FC<{
  movie: Movie;
  updatingWatchedId: number | null;
  onToggleWatched: (movie: Movie) => void;
  onOpenEditPrereqs: (movie: Movie) => void;
  formatRuntime: (mins: number) => string;
}> = ({
  movie,
  updatingWatchedId,
  onToggleWatched,
  onOpenEditPrereqs,
  formatRuntime,
}) => {
  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 overflow-hidden shadow-xl bg-zinc-900/90 hover:bg-zinc-900 backdrop-blur-md ${
        movie.watched
          ? "border-emerald-500/40 hover:border-emerald-500/70 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
          : "border-zinc-800 hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(237,29,36,0.2)]"
      }`}
    >
      {/* Subtle ambient hover glow */}
      <div
        className={`absolute -left-10 -top-10 w-44 h-44 rounded-full blur-3xl transition-colors pointer-events-none ${
          movie.watched
            ? "bg-emerald-500/5 group-hover:bg-emerald-500/15"
            : "bg-red-600/5 group-hover:bg-red-600/15"
        }`}
      />

      {/* Left: Theatrical Poster Showcase (Crisp, High Visibility) */}
      <div className="relative w-full sm:w-32 md:w-36 h-48 sm:h-auto sm:aspect-[2/3] flex-shrink-0 rounded-xl overflow-hidden shadow-lg border border-zinc-700/60 bg-zinc-950">
        <MoviePoster
          title={movie.title}
          alt={`Poster for ${movie.title}`}
          loading="lazy"
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Watched banner badge on poster */}
        {movie.watched && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 backdrop-blur-sm">
            <CheckCircleIcon className="w-3 h-3" />
            <span>Watched</span>
          </div>
        )}
      </div>

      {/* Right: Info, Prerequisites & Actions */}
      <div className="relative z-10 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Header & Watched Toggle */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-zinc-100 text-base sm:text-lg leading-snug group-hover:text-amber-300 transition-colors drop-shadow-sm truncate">
                {movie.title}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 font-medium flex-wrap">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-950/80 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
                  <CalendarIcon className="w-3 h-3 text-amber-400" />
                  {movie.releaseYear}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-950/80 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
                  <ClockIcon className="w-3 h-3 text-amber-400" />
                  {formatRuntime(movie.runtime)}
                </span>
              </div>
            </div>

            {/* Watched Toggle Checkbox Button */}
            <button
              onClick={() => onToggleWatched(movie)}
              disabled={updatingWatchedId === movie.id}
              title={movie.watched ? "Mark as unwatched" : "Mark as watched"}
              className={`flex-shrink-0 p-2 rounded-xl transition-all cursor-pointer ${
                movie.watched
                  ? "text-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-zinc-700/80 hover:border-red-500/40 bg-zinc-950"
              }`}
            >
              {movie.watched ? (
                <CheckCircleIcon className="w-5 h-5 fill-emerald-500/20" />
              ) : (
                <CircleIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Prerequisites Chips */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-2">
              <span className="uppercase tracking-wider">
                Prerequisites ({movie.prerequisites.length})
              </span>
              <button
                onClick={() => onOpenEditPrereqs(movie)}
                className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer text-xs font-bold"
              >
                <EditIcon className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[28px]">
              {movie.prerequisites.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-medium">
                  <span className="text-amber-400 font-bold">★</span> MCU Phase Origin (Direct Entry)
                </span>
              ) : (
                movie.prerequisites.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-200 border border-red-800/40 hover:border-red-600/60 text-[11px] font-medium shadow-xs transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {p.title}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom status badge */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-sm ${
              movie.watched
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-zinc-950/80 text-zinc-400 border border-zinc-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                movie.watched ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
              }`}
            />
            {movie.watched ? "Watched" : "Unwatched"}
          </span>
          <span className="text-zinc-500 font-mono text-[11px]">#{movie.id}</span>
        </div>
      </div>
    </div>
  );
};

export const MoviesView: React.FC<MoviesViewProps> = ({
  movies,
  loading,
  error,
  onRefresh,
}) => {
  const [search, setSearch] = useState("");
  const [watchedFilter, setWatchedFilter] = useState<"all" | "watched" | "unwatched">("all");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [newRuntime, setNewRuntime] = useState<number>(120);
  const [newPrereqs, setNewPrereqs] = useState<number[]>([]);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit prerequisites state
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<number[]>([]);
  const [savingPrereqs, setSavingPrereqs] = useState(false);
  const [prereqError, setPrereqError] = useState<string | null>(null);

  // Toggling watched state
  const [updatingWatchedId, setUpdatingWatchedId] = useState<number | null>(null);

  // Format minutes into "2h 6m"
  const formatRuntime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours === 0) return `${m}m`;
    return m === 0 ? `${hours}h` : `${hours}h ${m}m`;
  };

  const handleToggleWatched = async (movie: Movie) => {
    try {
      setUpdatingWatchedId(movie.id);
      await updateMovie(movie.id, { watched: !movie.watched });
      onRefresh();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        alert(`Error: ${err.message}`);
      } else {
        alert("Failed to update watched status");
      }
    } finally {
      setUpdatingWatchedId(null);
    }
  };

  const handleOpenAdd = () => {
    setNewTitle("");
    setNewYear(2025);
    setNewRuntime(130);
    setNewPrereqs([]);
    setAddError(null);
    setIsAddOpen(true);
  };

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newTitle.trim()) {
      setAddError("Title is required");
      return;
    }

    try {
      setSubmittingAdd(true);
      const payload: CreateMoviePayload = {
        title: newTitle.trim(),
        releaseYear: Number(newYear),
        runtime: Number(newRuntime),
        prerequisiteIds: newPrereqs,
      };

      await createMovie(payload);
      setIsAddOpen(false);
      onRefresh();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === "DUPLICATE") {
          setAddError("A movie with this title already exists.");
        } else {
          setAddError(err.message);
        }
      } else {
        setAddError("An unexpected error occurred while adding movie.");
      }
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleOpenEditPrereqs = (movie: Movie) => {
    setEditingMovie(movie);
    setSelectedPrereqIds(movie.prerequisites.map((p) => p.id));
    setPrereqError(null);
  };

  const handleSavePrereqs = async () => {
    if (!editingMovie) return;
    setPrereqError(null);

    try {
      setSavingPrereqs(true);
      await updateMovie(editingMovie.id, {
        prerequisiteIds: selectedPrereqIds,
      });
      setEditingMovie(null);
      onRefresh();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === "CIRCULAR_DEPENDENCY") {
          setPrereqError(
            "This would create a circular dependency. A movie cannot depend on itself or its own sequels."
          );
        } else {
          setPrereqError(err.message);
        }
      } else {
        setPrereqError("Failed to update prerequisites.");
      }
    } finally {
      setSavingPrereqs(false);
    }
  };

  // Filter movies
  const filteredMovies = movies.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.releaseYear.toString().includes(search);
    if (!matchesSearch) return false;

    if (watchedFilter === "watched") return m.watched;
    if (watchedFilter === "unwatched") return !m.watched;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl backdrop-blur-md shadow-lg">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search MCU movies..."
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setWatchedFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                watchedFilter === "all"
                  ? "bg-red-600 text-white shadow-[0_0_12px_rgba(237,29,36,0.4)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All ({movies.length})
            </button>
            <button
              onClick={() => setWatchedFilter("watched")}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                watchedFilter === "watched"
                  ? "bg-emerald-500 text-zinc-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "text-zinc-400 hover:text-emerald-400"
              }`}
            >
              Watched ({movies.filter((m) => m.watched).length})
            </button>
            <button
              onClick={() => setWatchedFilter("unwatched")}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                watchedFilter === "unwatched"
                  ? "bg-amber-500 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "text-zinc-400 hover:text-amber-400"
              }`}
            >
              Unwatched ({movies.filter((m) => !m.watched).length})
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="Refresh movies"
            className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <RefreshIcon className={`w-4 h-4 ${loading ? "animate-spin text-red-500" : ""}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ED1D24] hover:bg-red-500 text-white font-black text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(237,29,36,0.45)] hover:shadow-[0_0_25px_rgba(237,29,36,0.65)] cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            <span>Add Movie</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && movies.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-52 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse p-5 space-y-3"
            >
              <div className="h-5 bg-zinc-800 rounded-md w-3/4" />
              <div className="h-4 bg-zinc-800/60 rounded-md w-1/2" />
              <div className="h-6 bg-zinc-800/40 rounded-full w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredMovies.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl backdrop-blur-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-3">
            <SearchIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200">No movies found</h3>
          <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
            {search
              ? `No movies matching "${search}". Try adjusting your filters.`
              : "No MCU movies in the database yet. Click 'Add Movie' to create one."}
          </p>
        </div>
      ) : (
        /* Movie Cards Grid with Prominent Theatrical Posters */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredMovies.map((movie) => (
            <MovieCardItem
              key={movie.id}
              movie={movie}
              updatingWatchedId={updatingWatchedId}
              onToggleWatched={handleToggleWatched}
              onOpenEditPrereqs={handleOpenEditPrereqs}
              formatRuntime={formatRuntime}
            />
          ))}
        </div>
      )}

      {/* Add Movie Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add MCU Movie"
        subtitle="Add a new movie to the franchise graph"
      >
        <form onSubmit={handleCreateMovie} className="space-y-4">
          {addError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Movie Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Thunderbolts*"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Release Year
              </label>
              <input
                type="number"
                min={1900}
                max={2100}
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Runtime (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={newRuntime}
                onChange={(e) => setNewRuntime(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Prerequisites (Required Before Watching)
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
              {movies.length === 0 ? (
                <p className="text-xs text-zinc-500 italic p-1">No existing movies to select.</p>
              ) : (
                movies.map((m) => {
                  const isChecked = newPrereqs.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer text-xs text-zinc-200"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setNewPrereqs(newPrereqs.filter((id) => id !== m.id));
                          } else {
                            setNewPrereqs([...newPrereqs, m.id]);
                          }
                        }}
                        className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-zinc-900"
                      />
                      <span>{m.title}</span>
                      <span className="text-zinc-500 text-[10px]">({m.releaseYear})</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAdd}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submittingAdd ? "Adding..." : "Add Movie"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Prerequisites Modal */}
      <Modal
        isOpen={editingMovie !== null}
        onClose={() => setEditingMovie(null)}
        title={`Edit Prerequisites: ${editingMovie?.title || ""}`}
        subtitle="Select movies that must be watched before this one"
      >
        <div className="space-y-4">
          {prereqError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircleIcon className="w-5 h-5 flex-shrink-0 text-red-400" />
              <div className="flex-1 font-medium">{prereqError}</div>
            </div>
          )}

          <div className="text-xs text-zinc-400">
            Select the direct dependencies for this movie. The system automatically detects and prevents circular dependencies.
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
            {movies
              .filter((m) => m.id !== editingMovie?.id)
              .map((m) => {
                const isChecked = selectedPrereqIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-800/60 cursor-pointer text-xs text-zinc-200"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedPrereqIds(
                            selectedPrereqIds.filter((id) => id !== m.id)
                          );
                        } else {
                          setSelectedPrereqIds([...selectedPrereqIds, m.id]);
                        }
                      }}
                      className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-zinc-900"
                    />
                    <span className="font-medium">{m.title}</span>
                    <span className="text-zinc-500 text-[10px]">({m.releaseYear})</span>
                  </label>
                );
              })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setSelectedPrereqIds([])}
              className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              Clear all
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingMovie(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrereqs}
                disabled={savingPrereqs}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {savingPrereqs ? "Checking & Saving..." : "Save Prerequisites"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
