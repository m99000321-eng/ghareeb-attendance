"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCalendar, IconHome, IconUsers } from "./Icons";

const items = [
  { href: "/", label: "لوحة التحكم", icon: IconHome },
  { href: "/members", label: "اللاعبون والمدربون", icon: IconUsers },
  { href: "/attendance", label: "سجل الحضور", icon: IconCalendar },
];

export default function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <nav className="flex items-center gap-1 overflow-x-auto">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] transition ${
                active
                  ? "bg-lime text-ink font-bold"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] transition ${
              active
                ? "bg-lime text-ink font-bold shadow-[0_14px_40px_-18px_rgba(200,255,46,0.8)]"
                : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span
              className={`grid size-9 place-items-center rounded-xl border ${
                active
                  ? "border-ink/15 bg-ink/10"
                  : "border-white/10 bg-white/[0.04] group-hover:border-white/20"
              }`}
            >
              <Icon className="size-[18px]" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
