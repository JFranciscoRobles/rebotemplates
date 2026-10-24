'use client';

// The demo of apps/demo, on the page: the template filled by the real core in
// the browser. Loaded in the browser only.

import dynamic from 'next/dynamic';

const Demo = dynamic(() => import('../../../demo/src/Demo').then((m) => m.Demo), {
  ssr: false,
  loading: () => <div className="h-[600px] min-w-[980px] rounded-[14px] border border-border bg-white" />,
});

export function LiveDemo() {
  // Scrolls sideways only where the window is narrower than the demo, so Claude's card may hang over the frame elsewhere.
  return (
    <div className="max-lg:overflow-x-auto">
      <Demo />
    </div>
  );
}
