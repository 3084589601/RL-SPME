"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset animation class on route change
    el.classList.remove("animate-fade-in-up");
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add("animate-fade-in-up");
  }, [pathname]);

  return (
    <div ref={ref} className="min-h-[60vh] animate-fade-in-up">
      {children}
    </div>
  );
}
