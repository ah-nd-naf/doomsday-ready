/**
 * API client helpers with relative paths proxied through Vite.
 */
import type {
  Movie,
  CreateMoviePayload,
  UpdateMoviePayload,
  RewatchOrderResponse,
  Cinema,
  BookingResponse,
  ApiErrorResponse,
} from "./types";

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Generic fetch wrapper handling JSON parsing and error response shapes.
 */
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorPayload = data as ApiErrorResponse | null;
    const code = errorPayload?.error?.code || "UNKNOWN_ERROR";
    const message = errorPayload?.error?.message || "An unexpected error occurred";
    const details = errorPayload?.error?.details;

    throw new ApiError(response.status, code, message, details);
  }

  return data as T;
}

// Movie API calls
export const getMovies = (): Promise<Movie[]> => {
  return fetchJson<Movie[]>("/api/movies");
};

export const createMovie = (payload: CreateMoviePayload): Promise<Movie> => {
  return fetchJson<Movie>("/api/movies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateMovie = (
  id: number,
  payload: UpdateMoviePayload
): Promise<Movie> => {
  return fetchJson<Movie>(`/api/movies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const getRewatchOrder = (id: number): Promise<RewatchOrderResponse> => {
  return fetchJson<RewatchOrderResponse>(`/api/movies/${id}/rewatch-order`);
};

// Cinema API calls
export const getCinemas = (): Promise<Cinema[]> => {
  return fetchJson<Cinema[]>("/api/cinemas");
};

export const getBooking = (
  cinemaId: number,
  groupSize: number
): Promise<BookingResponse> => {
  return fetchJson<BookingResponse>(
    `/api/cinemas/${cinemaId}/booking?groupSize=${encodeURIComponent(groupSize)}`
  );
};
