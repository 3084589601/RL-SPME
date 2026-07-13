export type NavItem = { href: string; label: string };
export type NavGroup = {
  label: string;
  href?: string;
  children?: NavItem[];
};

export const aboutSubNav: NavItem[] = [
  { href: "/about", label: "实验室简介" },
  { href: "/about/research", label: "研究方向" },
  { href: "/about/competitions", label: "竞赛赛事" },
  { href: "/about/equipment", label: "设备资源" },
  { href: "/about/faculty", label: "师资力量" },
];

export const mainNav: NavGroup[] = [
  { label: "首页", href: "/" },
  { label: "实验室概况", children: aboutSubNav },
  { label: "荣誉证书", href: "/certificates" },
  { label: "作品展示", href: "/gallery" },
  { label: "联系我们", href: "/contact" },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname === "";
  if (href === "/about") return pathname === "/about" || pathname === "/about/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavGroupActive(pathname: string, group: NavGroup): boolean {
  if (group.href) return isNavActive(pathname, group.href);
  return group.children?.some((c) => isNavActive(pathname, c.href)) ?? false;
}
