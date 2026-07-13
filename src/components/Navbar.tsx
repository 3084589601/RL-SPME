"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  Menu, X, LogIn, LogOut, ChevronDown, Grid3X3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessResources } from "@/lib/permissions";
import { mainNav, isNavActive, isNavGroupActive, type NavGroup } from "@/lib/nav";
import { useHotkey } from "@/hooks/useHotkey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { Role } from "@prisma/client";
import { UserAvatar } from "@/components/UserAvatar";
import { FastImg } from "@/components/FastImg";

const navGroups = mainNav;

export function Navbar({
  logoUrl,
  transparent = false,
  searchOpen = false,
  onSearchClose,
}: {
  logoUrl?: string | null;
  transparent?: boolean;
  searchOpen?: boolean;
  onSearchClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);

  const role = session?.user?.role;
  const isLoggedIn = !!session?.user;
  const canAccess = canAccessResources(role);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useHotkey("Escape", () => setMobileOpen(false), { enabled: mobileOpen });

  const mobileNavRef = useRef<HTMLDivElement>(null);
  useFocusTrap(mobileOpen, mobileNavRef);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (!canAccess) {
      router.push("/login");
      return;
    }
    router.push(`/resources?q=${encodeURIComponent(searchQuery.trim())}`);
    onSearchClose?.();
    setSearchQuery("");
  }

  function isActive(href: string) {
    return isNavActive(pathname, href);
  }

  function isGroupActive(group: NavGroup) {
    return isNavGroupActive(pathname, group);
  }

  const visibleGroups = navGroups;

  return (
    <header className={cn("nav-bar-inner border-b", transparent ? "border-white/10 bg-transparent" : "border-gray-100 bg-white")}>
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between h-[76px]">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div
              className={cn(
                "w-14 h-14 flex items-center justify-center overflow-hidden shrink-0 transition-transform group-hover:scale-105 bg-transparent",
                transparent && "drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
              )}
            >
              {logoUrl ? (
                <FastImg src={logoUrl} alt="实验室 LOGO" priority className="object-contain w-full h-full" />
              ) : (
                <span className="text-primary font-bold text-2xl">R</span>
              )}
            </div>
            <div className={cn("hidden sm:block border-l pl-3", transparent ? "border-white/25" : "border-gray-200/80")}>
              <div className={cn("font-bold text-lg leading-tight tracking-wide", transparent ? "text-white" : "text-primary")}>
                机器人实验室
              </div>
              <div className={cn("text-xs mt-0.5 leading-snug max-w-[220px]", transparent ? "text-white/75" : "text-gray-500")}>
                贵州民族大学物理与机电工程学院
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-stretch h-full flex-1 justify-end ml-8">
            {visibleGroups.map((group) => {
              if (group.href) {
                return (
                  <Link
                    key={group.label}
                    href={group.href}
                    className={cn(
                      "gznu-nav-item flex items-center px-5 text-[15px] font-medium transition-colors relative",
                      isActive(group.href)
                        ? transparent
                          ? "text-white after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-white"
                          : "text-primary after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary"
                        : transparent
                          ? "text-white/90 hover:text-white hover:bg-white/10"
                          : "text-gray-700 hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    {group.label}
                  </Link>
                );
              }

              return (
                <div
                  key={group.label}
                  className="relative h-full"
                  onMouseEnter={() => {
                    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
                    setOpenDropdown(group.label);
                  }}
                  onMouseLeave={() => {
                    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 120);
                  }}
                >
                  <button
                    className={cn(
                      "gznu-nav-item h-full flex items-center gap-1 px-5 text-[15px] font-medium transition-colors",
                      isGroupActive(group)
                        ? transparent ? "text-white bg-white/10" : "text-primary bg-primary/5"
                        : transparent
                          ? "text-white/90 hover:text-white hover:bg-white/10"
                          : "text-gray-700 hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    {group.label}
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", openDropdown === group.label && "rotate-180")} />
                  </button>

                  {openDropdown === group.label && group.children && (
                    <div className="absolute top-full left-0 min-w-[180px] pt-0">
                      <div className="bg-white shadow-xl border border-gray-100 py-2 animate-dropdown">
                        {group.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "block px-5 py-2.5 text-sm transition-colors hover:bg-[#f5f7fa]",
                              isActive(child.href) ? "text-primary font-medium" : "text-gray-700 hover:text-primary"
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {canAccess && (
              <Link
                href="/resources"
                className={cn(
                  "gznu-nav-item flex items-center px-5 text-[15px] font-medium transition-colors relative",
                  isActive("/resources")
                    ? transparent
                      ? "text-white after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-white"
                      : "text-primary after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary"
                    : transparent
                      ? "text-white/90 hover:text-white hover:bg-white/10"
                      : "text-gray-700 hover:text-primary hover:bg-primary/5"
                )}
              >
                学习资源
              </Link>
            )}

            {role === Role.ADMIN && (
              <Link
                href="/admin"
                className={cn(
                  "gznu-nav-item flex items-center px-5 text-[15px] font-medium",
                  pathname.startsWith("/admin")
                    ? transparent ? "text-white" : "text-primary"
                    : transparent ? "text-white/90 hover:bg-white/10" : "text-gray-700 hover:text-primary"
                )}
              >
                后台管理
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 lg:ml-2">
            {isLoggedIn && canAccess ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  title={`${session.user.name} · 个人中心`}
                  className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-90"
                >
                  <UserAvatar name={session.user.name} src={session.user.avatar} size={38} transparent={transparent} />
                  <span className={cn(
                    "hidden md:inline text-sm font-medium max-w-[80px] truncate",
                    transparent ? "text-white/90" : "text-gray-700"
                  )}>
                    {session.user.name}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="退出登录"
                  className={cn(
                    "hidden sm:flex p-1.5 rounded-full transition-colors",
                    transparent ? "text-white/70 hover:bg-white/10" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                  )}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "lg:hidden flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded transition-colors",
                transparent ? "text-white hover:bg-white/10" : "text-primary hover:bg-primary/5"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
              网站导航
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className={cn("border-t px-4 py-3", transparent ? "border-white/10 bg-black/25 backdrop-blur-md" : "border-gray-100 bg-[#f5f7fa]")}>
          <form onSubmit={handleSearch} className="max-w-[1200px] mx-auto flex gap-2">
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={canAccess ? "搜索学习资源..." : "登录后可搜索资源"}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-sm text-sm bg-white focus-visible:outline-none focus:border-primary"
            />
            <button type="submit" className="px-6 py-2 bg-primary text-white text-sm hover:bg-primary-dark">
              搜索
            </button>
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/40" onClick={() => setMobileOpen(false)}>
          <div
            ref={mobileNavRef}
            className="absolute right-0 top-0 bottom-0 w-[min(320px,85vw)] bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b bg-primary text-white">
              <span className="font-bold">网站导航</span>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <nav className="py-2">
              {visibleGroups.map((group) => {
                if (group.href) {
                  return (
                    <Link key={group.label} href={group.href} onClick={() => setMobileOpen(false)}
                      className={cn("block px-5 py-3 text-sm border-b border-gray-50", isActive(group.href) ? "text-primary font-medium bg-primary/5" : "text-gray-700")}>
                      {group.label}
                    </Link>
                  );
                }
                return (
                  <div key={group.label}>
                    <div className="px-5 py-2 text-xs font-bold text-primary bg-[#f5f7fa]">{group.label}</div>
                    {group.children?.map((child) => (
                      <Link key={child.href} href={child.href} onClick={() => setMobileOpen(false)}
                        className={cn("block px-8 py-2.5 text-sm", isActive(child.href) ? "text-primary font-medium" : "text-gray-600")}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                );
              })}
              {role === Role.ADMIN && (
                <Link href="/admin" onClick={() => setMobileOpen(false)}
                  className={cn("block px-5 py-3 text-sm border-b border-gray-50", pathname.startsWith("/admin") ? "text-primary font-medium bg-primary/5" : "text-gray-700")}>
                  后台管理
                </Link>
              )}
              {canAccess && (
                <Link href="/resources" onClick={() => setMobileOpen(false)}
                  className={cn("block px-5 py-3 text-sm border-b border-gray-50", pathname.startsWith("/resources") ? "text-primary font-medium bg-primary/5" : "text-gray-700")}>
                  学习资源
                </Link>
              )}
              {isLoggedIn && canAccess && (
                <Link href="/profile" onClick={() => setMobileOpen(false)}
                  className={cn("flex items-center gap-3 px-5 py-3 text-sm border-b border-gray-50", pathname.startsWith("/profile") ? "text-primary font-medium bg-primary/5" : "text-gray-700")}>
                  <UserAvatar name={session.user.name} src={session.user.avatar} size={32} />
                  个人中心
                </Link>
              )}
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="flex items-center gap-2 w-full px-5 py-3 text-sm text-red-600 border-b border-gray-50"
                >
                  <LogOut className="w-4 h-4" /> 退出登录
                </button>
              )}
              {!isLoggedIn && (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-5 py-3 text-sm text-primary font-medium">
                  <LogIn className="w-4 h-4" /> 成员登录
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
