"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { currentNavHref, type NavItem } from "@/lib/nav";

/** Room left beside the current tab after scrolling, so the neighbouring tab shows it can scroll on. */
const SCROLL_MARGIN_PX = 32;

/**
 * On a phone the tabs can be wider than the screen: bring the current tab into view by scrolling the
 * tab row only (never the page), and mark the row with `data-more` while tabs are hidden to the right
 * (the CSS fades that edge). When every tab fits, as on a laptop, nothing moves and nothing fades.
 */
function useCurrentTabInView(currentHref: string | undefined) {
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const markMore = () => nav.toggleAttribute("data-more", nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 1);
    const showCurrent = () => {
      const tab = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (tab) {
        const navBox = nav.getBoundingClientRect();
        const tabBox = tab.getBoundingClientRect();
        if (tabBox.right > navBox.right) nav.scrollLeft += tabBox.right - navBox.right + SCROLL_MARGIN_PX;
        else if (tabBox.left < navBox.left) nav.scrollLeft -= navBox.left - tabBox.left + SCROLL_MARGIN_PX;
      }
      markMore();
    };
    showCurrent();
    // The display font loads after hydration and widens the tabs, so measure again once it is in.
    void document.fonts.ready.then(showCurrent);
    const resized = new ResizeObserver(markMore);
    resized.observe(nav);
    if (nav.firstElementChild) resized.observe(nav.firstElementChild);
    nav.addEventListener("scroll", markMore, { passive: true });
    return () => {
      resized.disconnect();
      nav.removeEventListener("scroll", markMore);
    };
  }, [currentHref]);
  return navRef;
}

export function RoleNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const currentHref = currentNavHref(items, pathname);
  const navRef = useCurrentTabInView(currentHref);
  return (
    <nav ref={navRef} aria-label="Pages" className="nav-scroll overflow-x-auto py-2">
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
