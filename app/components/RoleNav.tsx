"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { badgeText, currentNavHref, type NavItem } from "@/lib/nav";

export function RoleNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const currentHref = currentNavHref(items, pathname);
  return (
    <nav aria-label="Pages" className="overflow-x-auto py-2">
      <ul className="flex gap-1">
        {items.map((item) => {
          const current = item.href === currentHref;
          const badge = badgeText(item.badge ?? 0);
          return (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} aria-current={current ? "page" : undefined} className="nav-tab">
                {item.label}
                {badge ? (
                  <>
                    <span className="nav-badge" aria-hidden="true">{badge}</span>
                    <span className="sr-only">, {item.badge} waiting</span>
                  </>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
