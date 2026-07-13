"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  src,
  size = 36,
  className,
  transparent = false,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  transparent?: boolean;
}) {
  const initial = (name?.trim().charAt(0) || "U").toUpperCase();
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "inline-flex items-center justify-center rounded-full object-cover shrink-0 transition-transform hover:scale-105",
          transparent ? "ring-2 ring-white/40" : "ring-2 ring-primary/15",
          className
        )}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold shrink-0 transition-transform hover:scale-105",
        transparent
          ? "bg-white/25 text-white ring-2 ring-white/40"
          : "bg-primary text-white ring-2 ring-primary/15",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, Math.round(size * 0.38)),
      }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
