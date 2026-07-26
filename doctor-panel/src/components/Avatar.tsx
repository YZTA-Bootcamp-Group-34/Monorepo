"use client";

/**
 * Avatar with a safe fallback: renders a plain <img> when a URL exists
 * (so arbitrary backend hosts never trip next/image's remotePatterns),
 * and an initials circle when it's missing or fails to load.
 */
import { useEffect, useState } from "react";

export function getInitials(name: string): string {
  const parts = name
    .replace(/^(Dr\.?|Doç\.?|Prof\.?)\s+/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toLocaleUpperCase("tr-TR");
}

export default function Avatar({
  src,
  name,
  className = "",
  textClassName = "text-sm",
}: {
  src?: string | null;
  name: string;
  className?: string;
  textClassName?: string;
}) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return (
      <div
        className={`rounded-full bg-[#E7EEFF] text-[#003C90] font-bold flex items-center justify-center select-none ${textClassName} ${className}`}
        aria-label={name}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className={`rounded-full object-cover ${className}`}
    />
  );
}
