"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCalendar, IconChart, IconGear, IconList } from "./icons";

const ITEMS = [
  { href: "/", label: "รายการ", Icon: IconList },
  { href: "/calendar", label: "ปฏิทิน", Icon: IconCalendar },
  { href: "/stats", label: "สถิติ", Icon: IconChart },
  { href: "/settings", label: "ตั้งค่า", Icon: IconGear },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E6E8EC] bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid h-[72px] max-w-[480px] grid-cols-4">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${active ? "font-semibold text-brand" : "text-muted"}`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
