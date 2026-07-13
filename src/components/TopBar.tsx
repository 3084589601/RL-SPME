"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessResources } from "@/lib/permissions";
import { UserAvatar } from "@/components/UserAvatar";
import { signOut } from "next-auth/react";
import { Role } from "@prisma/client";

export function TopBar({
  onSearchClick,
  transparent = false,
}: {
  onSearchClick?: () => void;
  transparent?: boolean;
}) {
  const { data: session } = useSession();
  const canAccess = canAccessResources(session?.user?.role);
  const isAdmin = session?.user?.role === Role.ADMIN;

  const links = [
    { href: "/about", label: "实验室简介" },
    { href: "/certificates", label: "荣誉证书" },
    { href: "/gallery", label: "作品展示" },
    { href: "/contact", label: "联系我们" },
    ...(isAdmin ? [{ href: "/admin", label: "后台管理" }] : []),
    ...(canAccess
      ? [{ href: "/resources", label: "学习资源" }]
      : [{ href: "/login", label: "成员登录" }]),
  ];

  return (
    <div
      className={cn(
        "top-bar-inner border-b text-xs transition-colors",
        transparent
          ? "bg-black/15 border-white/10 text-white/85 backdrop-blur-sm"
          : "bg-[#f5f7fa] border-gray-200/80 text-gray-600"
      )}
    >
      <div className="max-w-[1200px] mx-auto px-4 h-9 flex items-center justify-between">
        <div className="flex items-center">
          {links.map((link, i) => (
            <span key={link.href} className="flex items-center">
              {i > 0 && (
                <span className={cn("mx-2.5", transparent ? "text-white/30" : "text-gray-300")}>|</span>
              )}
              <Link
                href={link.href}
                className={cn(
                  "hover:text-primary transition-colors whitespace-nowrap",
                  transparent && "hover:text-white"
                )}
              >
                {link.label}
              </Link>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className={cn("hidden md:inline whitespace-nowrap", transparent ? "text-white/50" : "text-gray-400")}>
            贵州民族大学物理与机电工程学院
          </span>
          <button
            type="button"
            onClick={onSearchClick}
            className={cn(
              "flex items-center gap-1 hover:text-primary transition-colors",
              transparent && "hover:text-white"
            )}
          >
            <Search className="w-3.5 h-3.5" />
            搜索
          </button>
          {session?.user && canAccess ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                title={`${session.user.name} · 个人中心`}
                className="flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <UserAvatar name={session.user.name} src={session.user.avatar} size={26} transparent={transparent} />
                <span className={cn("hidden sm:inline", transparent ? "text-white/85" : "text-primary")}>
                  {session.user.name}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                title="退出登录"
                className={cn(
                  "p-0.5 rounded transition-colors",
                  transparent ? "text-white/60 hover:text-white" : "text-gray-400 hover:text-red-500"
                )}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}
          {!session?.user && (
            <Link
              href="/login"
              className={cn(
                "flex items-center gap-1 hover:text-primary",
                transparent && "hover:text-white"
              )}
            >
              <LogIn className="w-3.5 h-3.5" />
              登录
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
