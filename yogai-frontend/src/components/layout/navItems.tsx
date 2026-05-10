import type { LucideIcon } from "lucide-react";
import { Home, ClipboardList, Compass, Dumbbell, Camera, User } from "lucide-react";

export type NavLabelKey = "dashboard" | "plans" | "explore" | "training" | "poseTest" | "profile";

export const DASHBOARD_NAV: readonly {
  href: string;
  labelKey: NavLabelKey;
  Icon: LucideIcon;
}[] = [
  { href: "/dashboard", labelKey: "dashboard", Icon: Home },
  { href: "/plans", labelKey: "plans", Icon: ClipboardList },
  { href: "/explore", labelKey: "explore", Icon: Compass },
  { href: "/training", labelKey: "training", Icon: Dumbbell },
  { href: "/pose-test", labelKey: "poseTest", Icon: Camera },
  { href: "/profile", labelKey: "profile", Icon: User },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
