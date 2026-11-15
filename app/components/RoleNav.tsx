"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { currentNavHref, type NavItem } from "@/lib/nav";

export function RoleNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const currentHref = currentNavHref(items, pathname);
  return (
    <nav aria-label="Pages" className="overflow-x-auto py-2">
      <ul className="flex gap-1">
        {items.map((item) => {
          const current = item.href === currentHref;
          return (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} aria-current={current ? "page" : undefined} className="nav-tab">
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
