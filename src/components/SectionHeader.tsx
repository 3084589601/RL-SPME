import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  href,
  linkText = "更多",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="gznu-section-head flex items-end justify-between mb-6 pb-0 border-b border-gray-100">
      <div>
        <h2 className="gznu-section-title text-xl md:text-2xl">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-gray-400 mt-1 pl-3 uppercase tracking-wider">{subtitle}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-primary shrink-0 mb-1"
        >
          {linkText}<ArrowRight className="w-3 h-3" />
        </Link>
      ) : null}
    </div>
  );
}
