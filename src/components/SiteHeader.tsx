"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Navbar } from "@/components/Navbar";
import { useHotkey } from "@/hooks/useHotkey";
import { cn } from "@/lib/utils";

export function SiteHeader({
  logoUrl,
}: {
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Ctrl+K / Cmd+K to toggle search
  useHotkey("Control+k", () => setSearchOpen((v) => !v));

  useLayoutEffect(() => {
    if (!isHome) {
      setScrolled(true);
      document.body.classList.remove("home-overlay", "header-scrolled");
      return;
    }
    document.body.classList.add("home-overlay");
    let ticking = false;
    const update = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const atTop = window.scrollY <= 80;
        setScrolled(!atTop);
        document.body.classList.toggle("home-overlay", atTop);
        document.body.classList.toggle("header-scrolled", !atTop);
        ticking = false;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      document.body.classList.remove("home-overlay", "header-scrolled");
      ticking = true; // prevent rAF callback after unmount
    };
  }, [isHome, pathname]);

  const overlay = isHome && !scrolled;

  return (
    <>
      <div
        className={cn(
          "site-header-wrapper z-50 transition-all duration-300",
          isHome ? "fixed top-0 left-0 right-0" : "sticky top-0",
          overlay
            ? "bg-transparent shadow-none"
            : "bg-white shadow-[0_2px_16px_rgba(0,0,0,0.12)]"
        )}
      >
        <TopBar transparent={overlay} onSearchClick={() => setSearchOpen((v) => !v)} />
        <Navbar
          logoUrl={logoUrl}
          transparent={overlay}
          searchOpen={searchOpen}
          onSearchClose={() => setSearchOpen(false)}
        />
      </div>
    </>
  );
}
