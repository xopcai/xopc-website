'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

/** A visual explanation of shared roles, never a live task progress indicator. */
export function CollaborationMotion({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const update = () => { element.dataset.running = String(visible && !document.hidden && !reduce.matches); };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    reduce.addEventListener('change', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      reduce.removeEventListener('change', update);
    };
  }, []);
  return <figure ref={ref} className="collaboration-model collaboration-motion" aria-label={label} data-running="false">
    <div className="collaboration-mark-shell" aria-hidden>
      <svg className="collaboration-logo" viewBox="0 0 1024 1024" fill="none" focusable="false">
        <defs>
          <linearGradient id={`${id}-flow`} x1="200" y1="180" x2="826" y2="844" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity=".08" /><stop offset=".5" stopColor="white" stopOpacity=".6" /><stop offset="1" stopColor="white" stopOpacity=".08" />
          </linearGradient>
          <mask id={`${id}-ai`}><circle cx="512" cy="512" r="330" stroke="white" strokeWidth="136" strokeLinecap="round" strokeDasharray="1419.162121 654.289030" transform="rotate(11.8 512 512)" /></mask>
        </defs>
        <g strokeWidth="136" strokeLinecap="round">
          <circle className="collaboration-arc-ai" cx="512" cy="512" r="330" stroke="var(--fg-head)" strokeDasharray="1419.162121 654.289030" transform="rotate(11.8 512 512)" />
          <circle cx="512" cy="512" r="330" stroke="var(--accent)" strokeDasharray="354.790530 1718.660621" transform="rotate(284.2 512 512)" />
        </g>
        <g mask={`url(#${id}-ai)`}>
          <circle className="collaboration-flow" cx="512" cy="512" r="330" stroke={`url(#${id}-flow)`} strokeWidth="112" strokeLinecap="round" strokeDasharray="160 1913.451151" transform="rotate(11.8 512 512)" />
        </g>
        <circle className="collaboration-human-light" cx="512" cy="512" r="330" stroke="#aed3ff" strokeWidth="112" strokeLinecap="round" strokeDasharray="354.790530 1718.660621" transform="rotate(284.2 512 512)" opacity="0" />
      </svg>
    </div>
    {children}
  </figure>;
}
