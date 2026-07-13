"use client";

import {
  Star, Megaphone, DollarSign, Package, GraduationCap, Monitor, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudentAdminItem, StudentAdminRole } from "@/lib/site-content";

const ROLE_ICON: Record<StudentAdminRole, typeof Star> = {
  principal: Star,
  publicist: Megaphone,
  finance: DollarSign,
  logistics: Package,
  credit: GraduationCap,
  it_ops: Monitor,
};

const ROLE_ICON_COLOR: Record<StudentAdminRole, string> = {
  principal: "#2563eb",
  publicist: "#ec4899",
  finance: "#059669",
  logistics: "#d97706",
  credit: "#7c3aed",
  it_ops: "#0891b2",
};

const STUDENT_ADMIN_ROLE_ORDER: StudentAdminRole[] = [
  "principal", "publicist", "finance", "logistics", "credit", "it_ops",
];

const STUDENT_ADMIN_ROLE_META: Record<StudentAdminRole, { label: string; color: string; order: number }> = {
  principal:  { label: "实验室主要负责人",   color: "bg-blue-600",   order: 1 },
  publicist:  { label: "实验室宣传员",       color: "bg-pink-500",   order: 2 },
  finance:    { label: "实验室财务",         color: "bg-emerald-600", order: 3 },
  logistics:  { label: "实验室后勤",         color: "bg-amber-600",  order: 4 },
  credit:     { label: "实验室学分管理员",   color: "bg-purple-600", order: 5 },
  it_ops:     { label: "信息化运维管理员",   color: "bg-cyan-600",   order: 6 },
};

export { STUDENT_ADMIN_ROLE_ORDER, STUDENT_ADMIN_ROLE_META, ROLE_ICON_COLOR };

/** 按角色分组展示学生管理员 */
export function StudentAdminPanel({
  items,
  onCardClick,
}: {
  items?: StudentAdminItem[] | null;
  onCardClick?: (item: StudentAdminItem) => void;
}) {
  const list = items ?? [];

  const ordered = STUDENT_ADMIN_ROLE_ORDER
    .map((role) => {
      const match = list.find((item) => item.role === role);
      if (match) return match;
      return { name: "", role, description: "暂未指定" } as StudentAdminItem;
    });

  if (ordered.length === 0) return null;

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">实验室管理团队</h2>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Student Leadership</p>
        <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
          学生自主管理，各司其职，保障实验室高效有序运转
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {ordered.map((item) => {
          const meta = STUDENT_ADMIN_ROLE_META[item.role];
          const vacant = !item.name;
          const clickable = !vacant && onCardClick;

          return (
            <div
              key={item.role}
              onClick={() => clickable && onCardClick(item)}
              className={cn(
                "bg-white border border-gray-100 rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-primary/20 group",
                vacant && "opacity-60",
                clickable && "cursor-pointer"
              )}
            >
              <div className={cn("h-16 relative", meta.color)}>
                <span className="absolute top-3 right-3 text-white/85 text-[11px] font-medium px-2 py-0.5 bg-white/15 rounded-full">
                  {meta.label}
                </span>
              </div>

              <div className="flex justify-center -mt-9 relative z-10">
                {item.photo ? (
                  <img
                    src={item.photo}
                    alt={item.name || meta.label}
                    className="rounded-full object-cover shadow-md border-[3px] border-white bg-white"
                    style={{ width: 72, height: 72 }}
                  />
                ) : vacant ? (
                  <div
                    className="rounded-full flex items-center justify-center shadow-md border-[3px] border-white bg-gray-100"
                    style={{ width: 72, height: 72 }}
                  >
                    <User className="w-8 h-8 text-gray-300" />
                  </div>
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center shadow-md border-[3px] border-white text-white font-bold text-2xl"
                    style={{ width: 72, height: 72, backgroundColor: ROLE_ICON_COLOR[item.role] }}
                  >
                    {item.name.slice(0, 1)}
                  </div>
                )}
              </div>

              <div className="px-5 pb-5 pt-3 text-center">
                {vacant ? (
                  <h3 className="font-bold text-gray-400 text-base italic">虚位以待</h3>
                ) : (
                  <h3 className="font-bold text-gray-900 text-base group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                )}
                <p className="text-[11px] font-medium mt-0.5" style={{ color: ROLE_ICON_COLOR[item.role] }}>
                  {meta.label}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed mt-3 line-clamp-3">
                  {item.description || "暂无职责说明"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
