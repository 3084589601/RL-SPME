"use client";

import { useEffect } from "react";

export function useImagePreload(urls: string[]) {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    const seen = new Set<string>();

    urls.filter(Boolean).forEach((href, i) => {
      if (seen.has(href)) return;
      seen.add(href);
      if (document.querySelector(`link[rel="preload"][href="${href}"]`)) return;

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      if (i === 0) link.setAttribute("fetchpriority", "high");
      document.head.appendChild(link);
      links.push(link);
    });

    return () => links.forEach((l) => l.remove());
  }, [urls]);
}
