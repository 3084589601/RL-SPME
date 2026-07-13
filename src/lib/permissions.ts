import { Role } from "@prisma/client";

/** 游客 = 未登录访问者，无需账号 */
export type EffectiveRole = Role | "GUEST";

export const PUBLIC_PATH_PREFIXES = [
  "/about",
  "/certificates",
  "/gallery",
  "/contact",
  "/login",
] as const;

export const MEMBER_PATH_PREFIXES = ["/resources", "/learning", "/profile"] as const;
export const ADMIN_PATH_PREFIXES = ["/admin"] as const;

export function getEffectiveRole(role?: Role): EffectiveRole {
  return role ?? "GUEST";
}

export function isGuest(role?: Role): boolean {
  return !role;
}

export function isMember(role?: Role): boolean {
  return role === Role.ADMIN || role === Role.MEMBER;
}

export function isAdmin(role?: Role): boolean {
  return role === Role.ADMIN;
}

export function canAccessResources(role?: Role): boolean {
  return isMember(role);
}

export function canDownloadResources(role?: Role): boolean {
  return isMember(role);
}

export function canTrackLearning(role?: Role): boolean {
  return isMember(role);
}

export function canUploadResources(role?: Role): boolean {
  return isMember(role);
}

export function canCommentResources(role?: Role): boolean {
  return isMember(role);
}

/** 成员可删自己的内容，管理员可删任意成员内容 */
export function canDeleteUserContent(role: Role | undefined, userId: string, ownerId: string): boolean {
  if (!isMember(role)) return false;
  if (isAdmin(role)) return true;
  return userId === ownerId;
}

export function canManageUsers(role?: Role): boolean {
  return isAdmin(role);
}

export function canApproveResources(role?: Role): boolean {
  return isAdmin(role);
}

export function canViewAllDownloadLogs(role?: Role): boolean {
  return isAdmin(role);
}

export function canManageSiteContent(role?: Role): boolean {
  return isAdmin(role);
}

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isMemberPath(pathname: string): boolean {
  return MEMBER_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isAdminPath(pathname: string): boolean {
  return ADMIN_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const ANONYMOUS_ROLE_LABEL = "游客";

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: "管理员",
  [Role.MEMBER]: "实验室成员",
  [Role.GUEST]: "游客（不可登录）",
};

export const PERMISSION_MATRIX = [
  {
    role: "游客",
    description: "无需登录，浏览公开页面",
    permissions: [
      "访问首页、实验室概况、荣誉证书、作品展示、联系我们",
      "不可访问学习资源库与学习追踪",
      "不可下载程序、上传资源或评论",
    ],
  },
  {
    role: "实验室成员",
    description: "登录后可使用学习功能",
    permissions: [
      "浏览全部已审核学习资源",
      "下载程序代码、预览源码",
      "记录并查看个人学习时长、完成度与观看历史",
      "喜欢、收藏学习资源，上传资源（需审核）、发表评论",
    ],
  },
  {
    role: "管理员",
    description: "实验室系统管理权限",
    permissions: [
      "管理用户账号（创建、删除、调整角色）",
      "审核成员上传的资源，管理学习资源（上传、编辑、删除）",
      "查看全部用户的程序下载记录",
      "管理首页轮播图、实验室概况、荣誉证书、作品展示等内容",
    ],
  },
] as const;
