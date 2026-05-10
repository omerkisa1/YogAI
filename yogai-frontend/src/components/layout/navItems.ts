export const DASHBOARD_NAV = [
  { href: "/dashboard", labelKey: "dashboard" as const, icon: "🏠" },
  { href: "/plans", labelKey: "plans" as const, icon: "📋" },
  { href: "/explore", labelKey: "explore" as const, icon: "🧭" },
  { href: "/training", labelKey: "training" as const, icon: "💪" },
  { href: "/pose-test", labelKey: "poseTest" as const, icon: "📷" },
  { href: "/profile", labelKey: "profile" as const, icon: "👤" },
] as const;

export type NavLabelKey = (typeof DASHBOARD_NAV)[number]["labelKey"];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
