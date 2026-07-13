"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

export function HomeBodyClass() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const isHome = pathname === "/";
    document.body.classList.toggle("home-overlay", isHome);
    if (!isHome) {
      document.body.classList.remove("header-scrolled");
    }
  }, [pathname]);

  return null;
}