import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export type BreadcrumbItem = { label: string; href?: string };

export function GznuBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="面包屑" className="gznu-breadcrumb bg-white border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4 py-2.5 flex items-center flex-wrap gap-1 text-xs text-gray-500">
        <Link href="/" className="hover:text-primary inline-flex items-center gap-1 shrink-0">
          <Home className="w-3.5 h-3.5" />
          首页
        </Link>
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
            {item.href ? (
              <Link href={item.href} className="hover:text-primary">{item.label}</Link>
            ) : (
              <span className="text-gray-700">{item.label}</span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
