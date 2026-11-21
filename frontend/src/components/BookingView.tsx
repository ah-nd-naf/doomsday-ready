import React, { useState, useEffect } from "react";
import type { Cinema, BookingResponse } from "../types";
import { getCinemas, getBooking, ApiError } from "../api";
import {
  TicketIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "./Icons";

export const BookingView: React.FC = () => {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loadingCinemas, setLoadingCinemas] = useState(true);
  const [cinemasError, setCinemasError] = useState<string | null>(null);

  const [selectedCinemaId, setSelectedCinemaId] = useState<number | null>(null);
  const [groupSize, setGroupSize] = useState<number | string>(6);

  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Load available cinemas on mount
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        setLoadingCinemas(true);
        setCinemasError(null);
        const data = await getCinemas();
        setCinemas(data);
        if (data.length > 0) {
          setSelectedCinemaId(data[0].id);
        }
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setCinemasError(err.message);
        } else {
          setCinemasError("Failed to load cinemas.");
        }
      } finally {
        setLoadingCinemas(false);
      }
    };

    fetchCinemas();
  }, []);

  const handleGetQuote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCinemaId) return;

    setBookingError(null);
    setBookingResult(null);

    const size = Number(groupSize);
    if (!Number.isInteger(size) || size < 1 || size > 10000) {
      setBookingError("Please enter a valid group size between 1 and 10,000.");
      return;
    }

    try {
      setQuoting(true);
      const result = await getBooking(selectedCinemaId, size);
      setBookingResult(result);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setBookingError(err.message);
      } else {
        setBookingError("An unexpected error occurred while calculating bundles.");
      }
    } finally {
      setQuoting(false);
    }
  };

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId);

  return (
    <div className="space-y-6">
      {/* Hero Card with Cinematic Backdrop */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-4 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        {/* Cinematic Backdrop Image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src="/posters/doomsday-bg.jpg"
            alt="Avengers: Doomsday watch party backdrop"
            className="w-full h-full object-cover object-center scale-105 opacity-30"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/85 to-zinc-950/90" />
        </div>

        <div className="relative z-10 flex items-start sm:items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-600/15 border border-red-600/30 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(237,29,36,0.3)] flex-shrink-0">
            <TicketIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Opening Night Ticket Optimization
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-zinc-100 tracking-tight">
              Opening Night Watch Party Booking
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 max-w-xl">
              Exact-sum ticket bundle optimization with bottom-up dynamic programming. Find the fewest bundles for your crew.
            </p>
          </div>
        </div>

        <div className="relative z-10 self-start md:self-auto flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950/80 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-zinc-800 shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="font-medium text-xs">Optimal Minimum Bundles</span>
        </div>
      </div>

      {cinemasError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{cinemasError}</span>
        </div>
      )}

      {/* Booking Form Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleGetQuote} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cinema Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                Select Cinema
              </label>
              {loadingCinemas ? (
                <div className="h-10 bg-zinc-950 border border-zinc-800 rounded-xl animate-pulse" />
              ) : (
                <select
                  value={selectedCinemaId ?? ""}
                  onChange={(e) => {
                    setSelectedCinemaId(Number(e.target.value));
                    setBookingResult(null);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-medium focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  {cinemas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Bundles: {c.bundleSizes.join(", ")})
                    </option>
                  ))}
                </select>
              )}

              {selectedCinema && (
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                  <span>Available bundle sizes:</span>
                  <div className="flex gap-1">
                    {selectedCinema.bundleSizes.map((size) => (
                      <span
                        key={size}
                        className="px-2 py-0.5 rounded-md bg-zinc-800 text-emerald-400 border border-zinc-700/60 font-mono text-[11px]"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Group Size Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                Party Group Size (1 - 10,000 Seats)
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-2">
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={groupSize}
                  onChange={(e) => {
                    setGroupSize(e.target.value);
                    setBookingResult(null);
                  }}
                  placeholder="e.g. 6"
                  className="w-full sm:flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={quoting || !selectedCinemaId}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(237,29,36,0.4)] hover:shadow-[0_0_25px_rgba(237,29,36,0.6)] disabled:opacity-50 cursor-pointer whitespace-nowrap text-center"
                >
                  {quoting ? "Calculating..." : "Get Bundle Quote"}
                </button>
              </div>

              {/* Quick sample buttons */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-zinc-500">Presets:</span>
                {[6, 11, 44, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setGroupSize(num);
                      setBookingResult(null);
                    }}
                    className="px-2 py-0.5 text-[11px] rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer font-mono transition-colors"
                  >
                    {num} seats
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Validation Error banner */}
      {bookingError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{bookingError}</span>
        </div>
      )}

      {/* Booking Results Area */}
      {bookingResult && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {bookingResult.possible ? (
            /* Successful Optimal Booking Result */
            <div className="relative overflow-hidden bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              {/* Background celebration glow */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                      <CheckCircleIcon className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Optimal Allocation Found
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-zinc-100 mt-1">
                    {bookingResult.cinema.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Exact combination found for{" "}
                    <strong className="text-zinc-200">
                      {bookingResult.groupSize} seats
                    </strong>{" "}
                    with minimum ticket bundles
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-zinc-950 border border-emerald-500/40 rounded-xl px-4 py-2 text-center">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                      Total Bundles
                    </div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      {bookingResult.totalBundles}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bundle Cards Grid */}
              <div className="mt-5 space-y-3">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Selected Ticket Bundles
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {bookingResult.bundles.map((bundle, index) => {
                    const totalSeats = bundle.size * bundle.count;
                    return (
                      <div
                        key={index}
                        className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-3 shadow-inner hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono font-black text-sm">
                            {bundle.count}x
                          </div>
                          <div>
                            <div className="text-sm font-bold text-zinc-100">
                              {bundle.size}-Seat Bundle
                            </div>
                            <div className="text-xs text-zinc-400">
                              {bundle.count} &times; {bundle.size} seats ={" "}
                              <span className="text-emerald-400 font-mono font-semibold">
                                {totalSeats} seats
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="text-xs font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {bundle.count} &times; {bundle.size}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Mathematical Check Footnote */}
                <div className="mt-4 pt-3 border-t border-zinc-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500 font-mono">
                  <span>
                    Formula:{" "}
                    {bookingResult.bundles
                      .map((b) => `${b.count}×${b.size}`)
                      .join(" + ")}{" "}
                    = {bookingResult.groupSize} seats
                  </span>
                  <span className="text-emerald-500 flex items-center gap-1 font-sans">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Exact match guaranteed
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Impossible Combination Notice */
            <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-6 text-center shadow-lg">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <AlertCircleIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">
                Not possible with this cinema's bundles
              </h3>
              <p className="text-sm text-zinc-400 mt-1.5 max-w-md mx-auto">
                {bookingResult.message}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
                <span>Cinema: {bookingResult.cinema.name}</span>
                <span>•</span>
                <span>Requested: {bookingResult.groupSize} seats</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
