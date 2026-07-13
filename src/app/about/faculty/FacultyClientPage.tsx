"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { StudentAdminPanel } from "@/components/StudentAdminPanel";
import { FacultyDetailModal, type DetailPerson } from "@/components/FacultyDetailModal";
import type { FacultyItem, StudentAdminItem } from "@/lib/site-content";

export function FacultyClientPage({
  faculty,
  studentAdmins,
}: {
  faculty: FacultyItem[];
  studentAdmins: StudentAdminItem[];
}) {
  const [selected, setSelected] = useState<DetailPerson | null>(null);

  return (
    <>
      {/* 指导教师 */}
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">指导教师</h2>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Faculty Advisors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
        {faculty.map((person, i) => (
          <div
            key={i}
            onClick={() => setSelected({ type: "faculty", data: person })}
            className="gznu-panel bg-white border border-gray-100 overflow-hidden group hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
          >
            {/* 色带头部 */}
            <div className="h-24 bg-gradient-to-r from-primary to-primary/80 relative">
              <div className="absolute -bottom-12 left-5">
                {person.photo ? (
                  <img
                    src={person.photo}
                    alt={person.name}
                    className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-primary font-bold text-3xl shadow-lg border-4 border-white">
                    {person.name.slice(0, 1)}
                  </div>
                )}
              </div>
            </div>

            {/* 信息区 */}
            <div className="pt-14 p-5">
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">
                {person.name}
              </h3>
              <p className="text-primary text-sm mt-0.5 font-medium">{person.title}</p>
              {person.research && (
                <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>{person.research}</span>
                </div>
              )}
              {person.description && (
                <p className="text-sm text-gray-600 leading-relaxed mt-3 pt-3 border-t border-gray-100 line-clamp-3">
                  {person.description}
                </p>
              )}
              <p className="text-xs text-primary/60 mt-3 font-medium">点击查看详情 →</p>
            </div>
          </div>
        ))}
      </div>

      {/* 分隔线 */}
      <div className="border-t border-gray-200 pt-14">
        <StudentAdminPanel
          items={studentAdmins}
          onCardClick={(item) => setSelected({ type: "student", data: item })}
        />
      </div>

      {/* 详情弹窗 */}
      <FacultyDetailModal person={selected} onClose={() => setSelected(null)} />
    </>
  );
}
