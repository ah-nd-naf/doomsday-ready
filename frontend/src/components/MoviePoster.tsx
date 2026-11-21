import React, { useState } from "react";
import { slugify } from "../utils/slugify";
import { FilmIcon } from "./Icons";

interface MoviePosterProps {
  title: string;
  className?: string;
  imgClassName?: string;
  alt?: string;
  loading?: "lazy" | "eager";
}

/**
 * Reusable movie poster component.
 * Attempts to load /posters/<slug>.jpg.
 * If the image fails to load or does not exist, renders an intentional,
 * tasteful fallback gradient with typography and icon.
 */
export const MoviePoster: React.FC<MoviePosterProps> = ({
  title,
  className = "w-full h-full",
  imgClassName = "w-full h-full object-cover",
  alt,
  loading = "lazy",
}) => {
  const [hasError, setHasError] = useState(false);
  const slug = slugify(title);
  const posterSrc = `/posters/${slug}.jpg`;

  if (hasError) {
    // Tasteful fallback styling for movies without a local poster
    return (
      <div
        className={`bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-2 text-center select-none border border-zinc-700/40 ${className}`}
      >
        <FilmIcon className="w-5 h-5 text-zinc-500 mb-1 opacity-70" />
        <span className="text-[10px] font-bold text-zinc-400 line-clamp-2 uppercase tracking-wider leading-tight">
          {title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={posterSrc}
      alt={alt || `${title} theatrical poster`}
      loading={loading}
      onError={() => setHasError(true)}
      className={imgClassName}
    />
  );
};
