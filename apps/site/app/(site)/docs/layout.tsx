import type { ReactNode } from 'react';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { SiteFooter, SiteHeader } from '@/components/home/SiteChrome';

// The frame of every page of the documentation: the header, the pages beside,
// and the page itself. As Rebodocs' (site)/docs/layout.tsx, with the landing's
// header until there are pages enough for a search box.
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="home min-h-screen bg-white text-ink">
      <SiteHeader />
      <div className="mx-auto flex max-w-[1240px] flex-wrap gap-x-12 px-6 lg:flex-nowrap">
        <DocsSidebar />
        <main className="min-w-0 flex-[999_1_600px] pb-24 pt-8">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
