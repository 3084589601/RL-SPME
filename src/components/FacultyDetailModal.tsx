"use client";

import { useEffect, useCallback } from "react";
import { X, BookOpen, User, Award, Trophy } from "lucide-react";
import type { FacultyItem, StudentAdminItem } from "@/lib/site-content";

const ROLE_LABELS: Record<string, string> = {
  principal: "实验室主要负责人",
  publicist: "实验室宣传员",
  finance: "实验室财务",
  logistics: "实验室后勤",
  credit: "实验室学分管理员",
  it_ops: "信息化运维管理员",
};

const ROLE_COLORS: Record<string, string> = {
  principal: "#2563eb",
  publicist: "#ec4899",
  finance: "#059669",
  logistics: "#d97706",
  credit: "#7c3aed",
  it_ops: "#0891b2",
};

export type DetailPerson =
  | { type: "faculty"; data: FacultyItem }
  | { type: "student"; data: StudentAdminItem };

export function FacultyDetailModal({
  person,
  onClose,
}: {
  person: DetailPerson | null;
  onClose: () => void;
}) {
  // ESC 关闭
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (person) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [person, handleKey]);

  if (!person) return null;

  const isTeacher = person.type === "faculty";
  const data = person.data;
  const name = data.name;
  const photo = data.photo || "";
  const description = data.description || "";
  const roleLabel =
    isTeacher
      ? (data as FacultyItem).title
      : ROLE_LABELS[(data as StudentAdminItem).role] || "";
  const roleColor =
    isTeacher
      ? "#2563eb"
      : ROLE_COLORS[(data as StudentAdminItem).role] || "#2563eb";
  const research = isTeacher ? (data as FacultyItem).research : "";
  const honors: string[] = (data as { honors?: string[] }).honors || [];
  const subtitle = isTeacher ? "指导教师" : "学生管理团队";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/90 hover:bg-gray-100 transition-colors shadow-sm"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* 顶部色带 */}
        <div
          className="h-32 relative rounded-t-2xl"
          style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}dd)` }}
        >
          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
            {photo ? (
              <img
                src={photo}
                alt={name}
                className="w-28 h-28 rounded-full object-cover shadow-xl border-4 border-white"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-xl border-4 border-white">
                <span className="text-4xl font-bold" style={{ color: roleColor }}>
                  {name ? name.slice(0, 1) : <User className="w-12 h-12" style={{ color: roleColor + "80" }} />}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 信息区 */}
        <div className="pt-16 px-6 pb-8 text-center space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{name || "虚位以待"}</h2>
            <p className="text-sm font-medium mt-1" style={{ color: roleColor }}>
              {roleLabel}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>

          {research && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm text-gray-700">{research}</span>
            </div>
          )}

          {description && (
            <div className="text-left p-5 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-primary" />
                个人简介
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {honors.length > 0 && (
            <div className="text-left p-5 rounded-xl" style={{ background: `linear-gradient(135deg, ${roleColor}08, ${roleColor}15)` }}>
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" style={{ color: roleColor }} />
                荣誉证书
              </h3>
              <ul className="space-y-2">
                {honors.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: roleColor }} />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
