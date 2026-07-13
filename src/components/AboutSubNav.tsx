"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { aboutSubNav, isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AboutSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="bg-white border-b border-gray-100 sticky z-40"
      style={{ top: "var(--site-header-height)" }}
    >
      <div className="max-w-[1200px] mx-auto px-4">
        <ul className="flex gap-0 overflow-x-auto no-scrollbar">
          {aboutSubNav.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className={cn(
                  "block px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isNavActive(pathname, item.href)
                    ? "text-primary border-primary bg-primary/5"
                    : "text-gray-600 border-transparent hover:text-primary hover:border-primary/30"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
