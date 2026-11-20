/**
 * Common TypeScript interfaces for the Doomsday Ready frontend.
 */

export interface MoviePrerequisite {
  id: number;
  title: string;
}

export interface Movie {
  id: number;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
  prerequisites: MoviePrerequisite[];
}

export interface CreateMoviePayload {
  title: string;
  releaseYear: number;
  runtime: number;
  watched?: boolean;
  prerequisiteIds?: number[];
}

export interface UpdateMoviePayload {
  title?: string;
  releaseYear?: number;
  runtime?: number;
  watched?: boolean;
  prerequisiteIds?: number[];
}

export interface RewatchOrderItem {
  id: number;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
}

export interface RewatchOrderSummary {
  total: number;
  watched: number;
  unwatched: number;
  remainingRuntimeMinutes: number;
}

export interface RewatchOrderResponse {
  target: {
    id: number;
    title: string;
  };
  order: RewatchOrderItem[];
  summary: RewatchOrderSummary;
}

export interface Cinema {
  id: number;
  name: string;
  bundleSizes: number[];
}

export interface BundleCount {
  size: number;
  count: number;
}

export interface BookingSuccessResponse {
  cinema: {
    id: number;
    name: string;
  };
  groupSize: number;
  possible: true;
  totalBundles: number;
  bundles: BundleCount[];
}

export interface BookingFailureResponse {
  cinema: {
    id: number;
    name: string;
  };
  groupSize: number;
  possible: false;
  message: string;
}

export type BookingResponse = BookingSuccessResponse | BookingFailureResponse;

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
