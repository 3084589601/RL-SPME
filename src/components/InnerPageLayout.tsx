import Link from "next/link";
import { LucideIcon, ListVideo, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { GznuBreadcrumb, type BreadcrumbItem } from "@/components/GznuBreadcrumb";
import { GznuSectionHead } from "@/components/GznuSectionHead";

import { PublicPageContent } from "@/components/PublicPageContent";

export function SimplePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f5f7fa] min-h-screen">
      <PublicPageContent>{children}</PublicPageContent>
    </div>
  );
}

export function InnerPageLayout({
  title,
  subtitle,
  icon,
  breadcrumbs = [],
  children,
  sidebar,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}) {
  return (
    <div className="bg-[#f5f7fa] min-h-screen">
      <PageHero title={title} subtitle={subtitle} icon={icon} />
      {breadcrumbs.length > 0 ? <GznuBreadcrumb items={breadcrumbs} /> : null}

      <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-10">
        {sidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">{children}</div>
            <aside className="space-y-4">{sidebar}</aside>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function GznuPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`gznu-panel bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ${className}`}>
      {children}
    </div>
  );
}

export function GznuQuickLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <GznuPanel>
      <GznuSectionHead title="快速链接" />
      <ul className="divide-y divide-gray-50">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="gznu-list-link block px-5 py-3 text-sm text-gray-700 hover:text-primary hover:bg-[#f8fafc] transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </GznuPanel>
  );
}

export type VideoPlaylistItem = {
  id: string;
  title: string;
  progress?: number;
  completed?: boolean;
};

export function VideoPlaylistSidebar({
  playlist,
  currentId,
  mode = "resources",
  parentResourceId,
  currentEpIndex = 0,
}: {
  playlist: VideoPlaylistItem[];
  currentId: string;
  mode?: "resources" | "episodes";
  parentResourceId?: string;
  currentEpIndex?: number;
}) {
  return (
    <GznuPanel className="lg:sticky lg:top-24">
      <div className="gznu-section-head flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h2 className="gznu-section-title inline-flex items-center gap-2">
          <ListVideo className="h-4 w-4 text-primary" />
          视频选集
        </h2>
      </div>
      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
        {playlist.length === 0 ? (
          <p className="px-5 pb-4 text-sm text-gray-400">暂无选集内容</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {playlist.map((item, index) => {
              const active =
                mode === "episodes" ? index === currentEpIndex : item.id === currentId;
              const done = item.completed;
              const pct = item.progress ?? 0;
              const href =
                mode === "episodes" && parentResourceId
                  ? `/resources/${parentResourceId}?ep=${index}`
                  : `/resources/${item.id}`;
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    className={`flex items-start gap-3 px-5 py-3 text-left transition-colors ${
                      active
                        ? "bg-primary/5 text-primary"
                        : "text-gray-700 hover:bg-[#f8fafc] hover:text-primary"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold ${
                        done
                          ? "bg-green-500 text-white"
                          : active
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`line-clamp-2 text-sm font-medium ${active ? "text-primary" : ""}`}>
                        {item.title}
                      </p>
                      {active ? (
                        <p className="mt-0.5 text-xs text-primary/80">正在播放</p>
                      ) : done ? (
                        <p className="mt-0.5 text-xs text-green-600">已完成</p>
                      ) : pct > 0 ? (
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </GznuPanel>
  );
}
