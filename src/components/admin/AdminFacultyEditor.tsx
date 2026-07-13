"use client";

import { useState, useRef } from "react";
import { Upload, X, ImageIcon, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import type {
  FacultyItem,
  StudentAdminItem,
  StudentAdminRole,
} from "@/lib/site-content";

// 这些是纯数据常量，运行时导入不会引入 fs
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

const ROLE_COLORS: Record<StudentAdminRole, string> = {
  principal: "#2563eb",
  publicist: "#ec4899",
  finance: "#059669",
  logistics: "#d97706",
  credit: "#7c3aed",
  it_ops: "#0891b2",
};

// ========= 教师卡片编辑器 =========
function FacultyCard({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: FacultyItem;
  index: number;
  onChange: (item: FacultyItem) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        onChange({ ...item, photo: data.url });
        toast.success("照片上传成功");
      } else {
        toast.error(data.error || "上传失败");
      }
    } catch {
      toast.error("上传失败");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">教师 #{index + 1}</span>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600" title="删除">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4">
        {/* 头像区 */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          {item.photo ? (
            <img src={item.photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-gray-200">
              <User className="w-7 h-7 text-primary/40" />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button variant="ghost" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
            <Upload className="w-3 h-3" />
            <span className="text-[11px]">上传</span>
          </Button>
        </div>

        {/* 信息区 */}
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={item.name}
              onChange={(e) => onChange({ ...item, name: e.target.value })}
              placeholder="姓名"
              className="px-3 py-1.5 border rounded text-sm w-full"
            />
            <input
              value={item.title}
              onChange={(e) => onChange({ ...item, title: e.target.value })}
              placeholder="职称"
              className="px-3 py-1.5 border rounded text-sm w-full"
            />
          </div>
          <input
            value={item.research || ""}
            onChange={(e) => onChange({ ...item, research: e.target.value })}
            placeholder="研究方向（如：机器人控制 · 智能感知）"
            className="px-3 py-1.5 border rounded text-sm w-full"
          />
          <textarea
            value={item.description || ""}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
            placeholder="职责介绍..."
            rows={2}
            className="px-3 py-1.5 border rounded text-sm w-full resize-none"
          />
          <textarea
            value={(item.honors || []).join("\n")}
            onChange={(e) => onChange({ ...item, honors: e.target.value.split("\n").filter(Boolean) })}
            placeholder="荣誉证书（每行一项）"
            rows={2}
            className="px-3 py-1.5 border rounded text-sm w-full resize-none"
          />
          {item.photo && (
            <input
              value={item.photo}
              onChange={(e) => onChange({ ...item, photo: e.target.value })}
              placeholder="照片 URL"
              className="px-3 py-1.5 border rounded text-xs w-full text-gray-400"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ========= 学生管理卡片编辑器 =========
function StudentAdminCard({
  role,
  item,
  onChange,
}: {
  role: StudentAdminRole;
  item: StudentAdminItem;
  onChange: (item: StudentAdminItem) => void;
}) {
  const meta = STUDENT_ADMIN_ROLE_META[role];
  const color = ROLE_COLORS[role];
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        onChange({ ...item, photo: data.url });
        toast.success(`${meta.label} 照片上传成功`);
      } else {
        toast.error(data.error || "上传失败");
      }
    } catch {
      toast.error("上传失败");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* 色带标题 */}
      <div className="px-4 py-2 text-white text-sm font-medium" style={{ backgroundColor: color }}>
        {meta.label}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          {/* 头像区 */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            {item.photo ? (
              <img src={item.photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-gray-200 text-white text-xl font-bold" style={{ backgroundColor: color }}>
                {item.name ? item.name.slice(0, 1) : <User className="w-7 h-7 text-white/60" />}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <Button variant="ghost" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
              <Upload className="w-3 h-3" />
              <span className="text-[11px]">上传照片</span>
            </Button>
          </div>

          {/* 信息区 */}
          <div className="flex-1 space-y-2">
            <input
              value={item.name}
              onChange={(e) => onChange({ ...item, name: e.target.value })}
              placeholder="成员姓名"
              className="px-3 py-1.5 border rounded text-sm w-full font-medium"
            />
            <textarea
              value={item.description || ""}
              onChange={(e) => onChange({ ...item, description: e.target.value })}
              placeholder="职责简介..."
              rows={3}
              className="px-3 py-1.5 border rounded text-sm w-full resize-none"
            />
            <textarea
              value={(item.honors || []).join("\n")}
              onChange={(e) => onChange({ ...item, honors: e.target.value.split("\n").filter(Boolean) })}
              placeholder="荣誉证书（每行一项）"
              rows={2}
              className="px-3 py-1.5 border rounded text-sm w-full resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ========= 主组件 =========
export function AdminFacultyEditor({
  faculty,
  studentAdmins,
  onFacultyChange,
  onStudentAdminsChange,
}: {
  faculty: FacultyItem[];
  studentAdmins: StudentAdminItem[];
  onFacultyChange: (items: FacultyItem[]) => void;
  onStudentAdminsChange: (items: StudentAdminItem[]) => void;
}) {
  // 确保每个角色都存在
  const roleMap = new Map(studentAdmins.map((s) => [s.role, s]));
  const orderedAdmins = STUDENT_ADMIN_ROLE_ORDER.map((role) =>
    roleMap.get(role) || { name: "", role, photo: "", description: "" } as StudentAdminItem
  );

  function updateAdmin(role: StudentAdminRole, update: StudentAdminItem) {
    const idx = orderedAdmins.findIndex((s) => s.role === role);
    if (idx < 0) return;
    const next = [...orderedAdmins];
    next[idx] = update;
    onStudentAdminsChange(next);
  }

  return (
    <div className="space-y-8">
      {/* 指导教师 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">指导教师</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const next = [...faculty, { name: "", title: "指导教师", photo: "", research: "", description: "" }];
              onFacultyChange(next);
            }}
          >
            + 添加教师
          </Button>
        </div>
        <div className="space-y-3">
          {faculty.map((item, i) => (
            <FacultyCard
              key={i}
              item={item}
              index={i}
              onChange={(updated) => {
                const next = [...faculty];
                next[i] = updated;
                onFacultyChange(next);
              }}
              onRemove={() => onFacultyChange(faculty.filter((_, j) => j !== i))}
            />
          ))}
          {faculty.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">暂无教师，点击上方按钮添加</p>
          )}
        </div>
      </div>

      {/* 学生管理团队 */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3">学生管理团队</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orderedAdmins.map((item) => (
            <StudentAdminCard
              key={item.role}
              role={item.role}
              item={item}
              onChange={(updated) => updateAdmin(item.role, updated)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
