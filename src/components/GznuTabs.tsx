"use client";

import { cn } from "@/lib/utils";

export function GznuTabs({
  items,
  active,
  onChange,
}: {
  items: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="bg-white border border-gray-100 border-b-0">
      <ul className="flex overflow-x-auto no-scrollbar">
        {items.map((item) => (
          <li key={item.key} className="shrink-0">
            <button
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                "px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                active === item.key
                  ? "text-primary border-primary bg-primary/5"
                  : "text-gray-600 border-transparent hover:text-primary hover:border-primary/30"
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
