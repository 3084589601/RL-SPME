import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  canAccessResources,
  isAdmin,
  isMember,
} from "./permissions";

export {
  canAccessResources,
  isAdmin,
  isMember,
} from "./permissions";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect("/");
  }
  return session;
}

export async function requireAdmin() {
  return requireAuth([Role.ADMIN]);
}

export async function requireMember() {
  return requireAuth([Role.ADMIN, Role.MEMBER]);
}

export function isAdminRole(role?: Role): boolean {
  return isAdmin(role);
}
