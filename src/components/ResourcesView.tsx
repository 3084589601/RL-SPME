"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Plus, Code, Video, Trophy,
  Download, MessageSquare, ChevronRight, X,
  LayoutGrid, List, User, Filter, GraduationCap,
} from "lucide-react";
import {
  RESOURCE_TYPES,
  RESOURCE_STAT_CARDS,
  EXAM_STAT_CARDS,
  RESOURCE_ZONES,
  getCategoryMeta,
  getCategoriesForZone,
  getCategoryFilterLabel,
  getResourceTypeLabel,
  type ResourceZoneKey,
  type ResourceTypeKey,
  type AllCategoryKey,
} from "@/lib/utils";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ResourceUploadModal } from "./ResourceUploadModal";
import { GznuPanel } from "@/components/InnerPageLayout";
import { GznuTabs } from "@/components/GznuTabs";
import { FastImg } from "@/components/FastImg";
import { isDisplayableMedia } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  status: string;
  coverUrl: string | null;
  videoUrl: string | null;
  competition: string | null;
  year: number | null;
  fileName: string | null;
  filePath: string | null;
  author: { name: string };
  _count: { comments: number; downloadLogs: number };
  createdAt: string | Date;
}

const typeIcons = {
  TEMPLATE: Code,
  VIDEO: Video,
  COURSE_VIDEO: GraduationCap,
  COMPETITION: Trophy,
} as const;

const typeColors = {
  TEMPLATE: "from-blue-600 to-blue-700",
  VIDEO: "from-red-500 to-red-600",
  COURSE_VIDEO: "from-violet-500 to-violet-600",
  COMPETITION: "from-amber-500 to-amber-600",
} as const;

function formatDate(d: string | Date) {
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function ResourceCategorySidebar({
  currentCategory,
  currentZone,
  preservedParams,
}: {
  currentCategory: string;
  currentZone: ResourceZoneKey;
  preservedParams: { type?: string; q?: string };
}) {
  const categories = getCategoriesForZone(currentZone);

  function categoryHref(key: string) {
    const params = new URLSearchParams();
    params.set("zone", currentZone);
    if (preservedParams.type) params.set("type", preservedParams.type);
    if (preservedParams.q) params.set("q", preservedParams.q);
    if (key) params.set("category", key);
    return `/resources?${params.toString()}`;
  }

  return (
    <div className="gznu-panel bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      <div className="gznu-section-head flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h2 className="gznu-section-title">{getCategoryFilterLabel(currentZone)}</h2>
      </div>
      <ul className="divide-y divide-gray-50">
        <li>
          <Link
            href={categoryHref("")}
            className={cn(
              "block px-5 py-2.5 text-sm transition-colors",
              !currentCategory
                ? "text-primary font-medium bg-primary/5"
                : "text-gray-700 hover:text-primary hover:bg-[#f8fafc]"
            )}
          >
            全部{getCategoryFilterLabel(currentZone)}
          </Link>
        </li>
        {Object.entries(categories).map(([key, cat]) => (
          <li key={key}>
            <Link
              href={categoryHref(key)}
              className={cn(
                "block px-5 py-2.5 text-sm transition-colors",
                currentCategory === key
                  ? "text-primary font-medium bg-primary/5"
                  : "text-gray-700 hover:text-primary hover:bg-[#f8fafc]"
              )}
            >
              {cat.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResourceCard({
  resource,
  isAdmin,
}: {
  resource: Resource;
  isAdmin: boolean;
}) {
  const TypeIcon = typeIcons[resource.type as ResourceTypeKey] || Code;
  const cat = getCategoryMeta(resource.category);
  const typeInfo =
    RESOURCE_TYPES[resource.type as ResourceTypeKey] ?? {
      label: getResourceTypeLabel(resource.type),
      icon: "File",
    };
  const gradient = typeColors[resource.type as ResourceTypeKey] || "from-slate-500 to-slate-600";
  const canDownload = resource.type === "TEMPLATE" && resource.filePath;
  const hasCover = resource.coverUrl && isDisplayableMedia(resource.coverUrl);

  function handleDownload() {
    window.location.href = `/api/resources/${resource.id}/download`;
  }

  return (
    <div className="gznu-panel gznu-card-hover bg-white border border-gray-100 overflow-hidden flex flex-col h-full group rounded-xl">
      <Link href={`/resources/${resource.id}`} className="block">
        <div
          className={cn(
            "relative h-28 overflow-hidden",
            !hasCover && `bg-gradient-to-br flex items-center justify-center ${gradient}`,
          )}
        >
          {hasCover ? (
            <>
              <FastImg
                src={resource.coverUrl!}
                alt={resource.title}
                fill
                useThumb
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.5),transparent_50%)]" />
              </div>
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.3),transparent_40%)]" />
              </div>
              <TypeIcon className="w-12 h-12 text-white/90 relative z-10 group-hover:scale-110 transition-transform duration-300" />
            </>
          )}
          {cat ? (
            <span
              className={cn(
                "absolute top-3 left-3 px-2.5 py-1 text-xs font-medium rounded z-10",
                hasCover ? "bg-black/55 backdrop-blur-sm text-white" : "bg-white/20 backdrop-blur-sm text-white",
              )}
            >
              {cat.label}
            </span>
          ) : null}
          {isAdmin && resource.status !== "APPROVED" ? (
            <span
              className={cn(
                "absolute top-3 right-3 px-2.5 py-1 text-xs font-medium rounded z-10",
                resource.status === "PENDING"
                  ? "bg-yellow-400/90 text-yellow-900"
                  : "bg-red-400/90 text-white"
              )}
            >
              {resource.status === "PENDING" ? "待审核" : "已拒绝"}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-col flex-1 p-4 border-t border-gray-50">
        <Link href={`/resources/${resource.id}`} className="block flex-1">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-snug">
            {resource.title}
          </h3>
          {resource.description ? (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{resource.description}</p>
          ) : (
            <div className="mt-2" />
          )}
        </Link>
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
          <Badge className="bg-gray-100 text-gray-600 px-2 py-0.5">{typeInfo?.label}</Badge>
          <span className="flex items-center gap-0.5">
            <User className="w-3 h-3" />
            {resource.author.name}
          </span>
          {resource._count.downloadLogs > 0 ? (
            <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Download className="w-3 h-3" />
              {resource._count.downloadLogs}
            </span>
          ) : null}
          {resource._count.comments > 0 ? (
            <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <MessageSquare className="w-3 h-3" />
              {resource._count.comments}
            </span>
          ) : null}
          {canDownload ? (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/5 transition-colors"
            >
              <Download className="w-3 h-3" />
              下载
            </button>
          ) : null}
          <span className="ml-auto text-gray-300">{formatDate(resource.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function ResourceListItem({
  resource,
  isAdmin,
}: {
  resource: Resource;
  isAdmin: boolean;
}) {
  const TypeIcon = typeIcons[resource.type as ResourceTypeKey] || Code;
  const cat = getCategoryMeta(resource.category);
  const typeInfo =
    RESOURCE_TYPES[resource.type as ResourceTypeKey] ?? {
      label: getResourceTypeLabel(resource.type),
      icon: "File",
    };
  const canDownload = resource.type === "TEMPLATE" && resource.filePath;

  function handleDownload() {
    window.location.href = `/api/resources/${resource.id}/download`;
  }

  return (
    <li className="border-b border-gray-50 last:border-0">
      <div className="gznu-list-item group">
        <Link href={`/resources/${resource.id}`} className="flex flex-1 items-center gap-3 min-w-0">
          <span className="gznu-date-badge hidden sm:block">{formatDate(resource.createdAt)}</span>
          <div className={cn("w-9 h-9 flex items-center justify-center shrink-0 sm:hidden", cat?.color || "bg-gray-500")}>
            <TypeIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="gznu-list-item-title font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                {resource.title}
              </h3>
              {isAdmin && resource.status !== "APPROVED" ? (
                <Badge className={resource.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                  {resource.status === "PENDING" ? "待审核" : "已拒绝"}
                </Badge>
              ) : null}
            </div>
            {resource.description ? (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{resource.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
              <Badge className="bg-blue-50 text-blue-700">{cat?.label}</Badge>
              <Badge className="bg-gray-100 text-gray-600">{typeInfo?.label}</Badge>
              <span className="flex items-center gap-0.5">
                <User className="w-3 h-3" />
                {resource.author.name}
              </span>
              {resource._count.downloadLogs > 0 ? (
                <span className="flex items-center gap-0.5">
                  <Download className="w-3 h-3" />
                  {resource._count.downloadLogs}
                </span>
              ) : null}
              {resource._count.comments > 0 ? (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="w-3 h-3" />
                  {resource._count.comments}
                </span>
              ) : null}
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {canDownload ? (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              下载
            </button>
          ) : null}
          <Link href={`/resources/${resource.id}`} className="text-gray-300 group-hover:text-primary transition-colors">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </li>
  );
}

export function ResourcesView({
  resources,
  isAdmin,
  userId,
  zone,
  zoneCount,
  competitionCount,
  examCount,
  typeStats,
}: {
  resources: Resource[];
  isAdmin: boolean;
  userId: string;
  zone: ResourceZoneKey;
  zoneCount: number;
  competitionCount: number;
  examCount: number;
  typeStats: Partial<Record<keyof typeof RESOURCE_TYPES, number>>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showUpload, setShowUpload] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const zoneConfig = RESOURCE_ZONES[zone];
  const zoneCategories = getCategoriesForZone(zone);
  const categoryFilterLabel = getCategoryFilterLabel(zone);
  const statCards = zone === "exam" ? EXAM_STAT_CARDS : RESOURCE_STAT_CARDS;

  const currentCategory = searchParams.get("category") || "";
  const currentType = searchParams.get("type") || "";
  const currentQuery = searchParams.get("q") || "";
  const hasActiveFilters = !!(currentCategory || currentType || currentQuery);

  function buildParams() {
    return new URLSearchParams(searchParams.toString());
  }

  function applyFilter(key: string, value: string) {
    const params = buildParams();
    params.set("zone", zone);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/resources?${params.toString()}`);
  }

  function switchZone(nextZone: ResourceZoneKey) {
    const params = new URLSearchParams();
    params.set("zone", nextZone);
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    router.push(`/resources?${params.toString()}`);
  }

  function clearAllFilters() {
    setQuery("");
    router.push(`/resources?zone=${zone}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilter("q", query.trim());
  }

  const typeTabs = useMemo(
    () => [
      { key: "", label: `全部 (${zoneCount})` },
      ...zoneConfig.types.map((key) => ({
        key,
        label: `${RESOURCE_TYPES[key].label} (${typeStats[key] ?? 0})`,
      })),
    ],
    [zoneCount, typeStats, zoneConfig.types]
  );

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {(Object.keys(RESOURCE_ZONES) as ResourceZoneKey[]).map((zoneKey) => {
          const config = RESOURCE_ZONES[zoneKey];
          const count = zoneKey === "competition" ? competitionCount : examCount;
          const active = zone === zoneKey;
          return (
            <button
              key={zoneKey}
              type="button"
              onClick={() => switchZone(zoneKey)}
              className={cn(
                "gznu-panel p-5 text-left transition-all duration-300",
                active
                  ? "ring-2 ring-primary/40 border-primary bg-primary/5"
                  : "hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md"
              )}
            >
              <p className="text-lg font-bold text-gray-900">{config.label}</p>
              <p className="text-xs text-gray-500 mt-1">{config.description}</p>
              <p className="text-sm text-primary mt-3 font-medium">
                {count} 项资源 · {config.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statCards.map(({ type, label }, index) => {
          const Icon = typeIcons[type] || Code;
          const count = typeStats[type] ?? 0;
          const active = currentType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => applyFilter("type", active ? "" : type)}
              className={cn(
                "gznu-panel p-4 flex items-center gap-3 text-left transition-all duration-300 ease-out",
                "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10",
                active
                  ? "ring-2 ring-primary/40 border-primary bg-primary/5 scale-[1.02]"
                  : "hover:border-primary/30",
                zone === "exam" && "sm:col-span-3"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "bg-primary/10 text-primary hover:bg-primary/20 hover:scale-110"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl md:text-3xl font-bold text-gray-900 transition-colors duration-200">
                  {count}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </button>
          );
        })}
      </div>

      <GznuPanel className="p-4 md:p-5 rounded-xl">
        <div className="flex flex-col lg:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors duration-200" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`在${zoneConfig.label}内搜索资源标题或描述...`}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 text-sm focus-visible:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white rounded-lg transition-all duration-200"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                  aria-label="清除搜索"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white text-sm font-medium hover:bg-primary-dark shrink-0 rounded-lg transition-all duration-200 hover:shadow-md hover:shadow-primary/30"
            >
              搜索
            </button>
          </form>
          <div className="flex gap-2 shrink-0">
            {hasActiveFilters ? (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="shrink-0 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
              >
                <X className="w-4 h-4" />
                清除筛选
              </Button>
            ) : null}
            <Button
              onClick={() => setShowUpload(true)}
              variant="secondary"
              className="shrink-0 rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              上传资源
            </Button>
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              当前筛选
            </span>
            {currentQuery ? (
              <FilterChip
                label={`搜索：${currentQuery}`}
                onRemove={() => {
                  setQuery("");
                  applyFilter("q", "");
                }}
              />
            ) : null}
            {currentType ? (
              <FilterChip
                label={RESOURCE_TYPES[currentType as keyof typeof RESOURCE_TYPES]?.label || currentType}
                onRemove={() => applyFilter("type", "")}
              />
            ) : null}
            {currentCategory ? (
              <FilterChip
                label={getCategoryMeta(currentCategory).label || currentCategory}
                onRemove={() => applyFilter("category", "")}
              />
            ) : null}
          </div>
        ) : null}
      </GznuPanel>

      {zone === "competition" && typeTabs.length > 1 ? (
        <GznuTabs items={typeTabs} active={currentType} onChange={(key) => applyFilter("type", key)} />
      ) : null}

      <GznuPanel className="border-t-0 p-4 md:p-5 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <span className="text-xs text-gray-400 shrink-0">{categoryFilterLabel}</span>
            <FilterPill active={!currentCategory} onClick={() => applyFilter("category", "")} label="全部" />
            {Object.entries(zoneCategories).map(([key, cat]) => (
              <FilterPill
                key={key}
                active={currentCategory === key}
                onClick={() => applyFilter("category", currentCategory === key ? "" : key)}
                label={cat.label}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <span className="text-xs text-gray-400">
              共 <strong className="text-gray-700 font-semibold">{resources.length}</strong> 条
            </span>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2.5 transition-all duration-200",
                  viewMode === "grid" ? "bg-primary text-white" : "text-gray-500 hover:text-primary hover:bg-gray-50"
                )}
                aria-label="卡片视图"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2.5 transition-all duration-200 border-l border-gray-200",
                  viewMode === "list" ? "bg-primary text-white" : "text-gray-500 hover:text-primary hover:bg-gray-50"
                )}
                aria-label="列表视图"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {resources.length === 0 ? (
          <EmptyState
            icon={Code}
            title={hasActiveFilters ? "暂无匹配的资源" : "暂无资源"}
            description={hasActiveFilters ? undefined : "成为第一个上传资源的人吧"}
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-all duration-200"
                >
                  清除筛选条件
                </button>
              ) : undefined
            }
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {resources.map((resource, index) => (
              <div key={resource.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <ResourceCard resource={resource} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        ) : (
          <ul className="-mx-4 md:-mx-5 border-t border-gray-50">
            {resources.map((resource, index) => (
              <li key={resource.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                <ResourceListItem resource={resource} isAdmin={isAdmin} />
              </li>
            ))}
          </ul>
        )}
      </GznuPanel>

      {showUpload ? (
        <ResourceUploadModal
          userId={userId}
          defaultZone={zone}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs border rounded-lg transition-all duration-200 whitespace-nowrap shrink-0",
        active
          ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
          : "bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:bg-primary/5"
      )}
    >
      {label}
    </button>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg">
      {label}
      <button 
        type="button" 
        onClick={onRemove} 
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/50 transition-all duration-200" 
        aria-label="移除筛选"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
