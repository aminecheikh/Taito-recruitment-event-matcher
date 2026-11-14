"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";

export function RoleNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Pages" className="-mb-px overflow-x-auto">
      <ul className="flex gap-1">
        {items.map((item) => {
          const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-12 items-center border-b-[3px] px-3 text-[0.9375rem] font-semibold transition-colors focus-visible:outline-offset-[-2px] ${
                  current ? "border-accent text-ink" : "border-transparent text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
