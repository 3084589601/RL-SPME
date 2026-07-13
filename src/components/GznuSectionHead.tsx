import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function GznuSectionHead({
  title,
  href,
  linkText = "更多",
}: {
  title: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="gznu-section-head flex items-center justify-between px-5 py-3 border-b border-gray-100">
      <h2 className="gznu-section-title">{title}</h2>
      {href ? (
        <Link href={href} className="text-xs text-gray-400 hover:text-primary flex items-center gap-0.5 shrink-0">
          {linkText}<ChevronRight className="w-3 h-3" />
        </Link>
      ) : null}
    </div>
  );
}
