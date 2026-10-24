'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Pastel } from '@/lib/home';
import { NAV, hrefOf } from '@/lib/site';

/** Whole class names, so Tailwind finds them. */
const DOT: Record<Pastel, string> = {
  blue: 'bg-pastel-blue-fg',
  yellow: 'bg-pastel-yellow-fg',
  green: 'bg-pastel-green-fg',
  pink: 'bg-pastel-pink-fg',
  purple: 'bg-pastel-purple-fg',
  orange: 'bg-pastel-orange-fg',
};

/** The pages, by group, as Rebodocs' sidebar has them. */
export function SidebarNav() {
  const path = usePathname().replace(/\/?$/, '/');
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-5.5">
      {NAV.map((group) => (
        <div key={group.title}>
          <p className="m-0 flex items-center gap-2 px-2.5 pb-1.5 text-xs font-semibold uppercase tracking-[0.04em] text-muted">
            <span className={`size-2 rounded-[3px] ${DOT[group.color]}`} aria-hidden="true" />
            {group.title}
          </p>
          <ul className="m-0 list-none p-0">
            {group.items.map((item) => {
              const href = hrefOf(item.slug);
              const on = href === path;
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    aria-current={on ? 'page' : undefined}
                    className={`block rounded-[7px] px-2.5 py-1.25 text-sm transition-colors ${on ? 'bg-brand-light font-semibold text-brand' : 'text-ink-soft hover:bg-hover hover:text-ink'}`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** The column on a wide screen; on a narrow one, the pages fold above the page. */
export function DocsSidebar() {
  return (
    <>
      <aside className="sticky top-6 hidden h-[calc(100vh-48px)] max-w-[260px] flex-[1_1_220px] overflow-y-auto py-8 lg:block">
        <SidebarNav />
      </aside>
      <details className="mt-4 w-full rounded-xl border border-border px-4 py-3 lg:hidden">
        <summary className="cursor-pointer text-sm font-semibold">Pages</summary>
        <div className="mt-3">
          <SidebarNav />
        </div>
      </details>
    </>
  );
}
