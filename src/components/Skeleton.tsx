import { cn } from "@/lib/utils";

/**
 * Skeleton placeholder component for loading states.
 *
 * Variants:
 * - "rect":   rectangular block (default)
 * - "circle": circular (e.g. avatar)
 * - "text":   text line
 * - "card":   full card placeholder
 * - "panel":  full-width panel placeholder
 */

function SkeletonBase({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-gray-200 rounded", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function Skeleton({
  variant = "rect",
  className,
  lines = 1,
}: {
  variant?: "rect" | "circle" | "text" | "card" | "panel";
  className?: string;
  lines?: number;
}) {
  if (variant === "circle") {
    return <SkeletonBase className={cn("rounded-full", className)} />;
  }

  if (variant === "text") {
    if (lines > 1) {
      return (
        <div className={cn("space-y-2", className)} aria-hidden="true">
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonBase
              key={i}
              className={cn("h-4 rounded", i === lines - 1 ? "w-2/3" : "w-full")}
            />
          ))}
        </div>
      );
    }
    return <SkeletonBase className={cn("h-4 rounded w-3/4", className)} />;
  }

  if (variant === "card") {
    return (
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden" aria-hidden="true">
        <SkeletonBase className="h-28 w-full rounded-none" />
        <div className="p-4 space-y-3">
          <SkeletonBase className="h-5 w-3/4 rounded" />
          <SkeletonBase className="h-3 w-full rounded" />
          <div className="flex gap-2 pt-2">
            <SkeletonBase className="h-5 w-14 rounded-full" />
            <SkeletonBase className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "panel") {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4" aria-hidden="true">
        <SkeletonBase className="h-6 w-40 rounded" />
        <SkeletonBase className="h-4 w-full rounded" />
        <SkeletonBase className="h-4 w-full rounded" />
        <SkeletonBase className="h-4 w-2/3 rounded" />
      </div>
    );
  }

  // rect
  return <SkeletonBase className={className} />;
}

/** Reusable page-level skeleton to avoid repeating layouts. */
export function PageSkeleton({
  hero = true,
  cardGrid = false,
  cardCount = 6,
}: {
  hero?: boolean;
  cardGrid?: boolean;
  cardCount?: number;
}) {
  return (
    <div className="animate-fade-in" aria-label="加载中...">
      {hero && (
        <div className="h-[200px] sm:h-[240px] bg-gray-200 animate-pulse" />
      )}
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        {cardGrid ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {Array.from({ length: cardCount }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <Skeleton variant="panel" />
            <Skeleton variant="panel" />
            <Skeleton variant="panel" />
          </div>
        )}
      </div>
    </div>
  );
}
