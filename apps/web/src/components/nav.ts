import { IconBook, IconCalculator, IconChat, IconFlask, IconHome, IconNews } from "@electricademy/ui";

/** Primary sections, shared by the desktop header and the mobile tab bar. */
export const NAV_ITEMS = [
  { href: "/tracks", label: "מסלולים", Icon: IconBook },
  { href: "/simulators", label: "סימולטורים", Icon: IconFlask },
  { href: "/tools", label: "כלים", Icon: IconCalculator },
  { href: "/community", label: "קהילה", Icon: IconChat },
  { href: "/articles", label: "מאמרים", Icon: IconNews },
] as const;

/** Mobile tab bar: Home first so there is always one tap back to the start. */
export const MOBILE_NAV_ITEMS = [
  { href: "/", label: "בית", Icon: IconHome },
  NAV_ITEMS[0],
  NAV_ITEMS[2],
  NAV_ITEMS[1],
  NAV_ITEMS[3],
] as const;

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
