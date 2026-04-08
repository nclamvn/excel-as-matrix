// ═══════════════════════════════════════════════════════════════════════════
// SKIP TO CONTENT — WCAG 2.1 AA requirement
// Provides keyboard-only users a way to skip navigation and jump to grid
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';

interface SkipLink {
  targetId: string;
  label: string;
}

const SKIP_LINKS: SkipLink[] = [
  { targetId: 'main-grid', label: 'Skip to spreadsheet' },
  { targetId: 'formula-bar', label: 'Skip to formula bar' },
  { targetId: 'sr-announce-polite', label: 'Skip to notifications' },
];

export const SkipToContent: React.FC = () => {
  return (
    <nav aria-label="Skip links" className="skip-to-content">
      {SKIP_LINKS.map((link) => (
        <a
          key={link.targetId}
          href={`#${link.targetId}`}
          className="
            sr-only focus:not-sr-only
            focus:fixed focus:top-2 focus:left-2 focus:z-[999]
            focus:px-4 focus:py-2 focus:rounded-md
            focus:bg-emerald-600 focus:text-white focus:text-sm focus:font-medium
            focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400
          "
          onClick={(e) => {
            e.preventDefault();
            const target = document.getElementById(link.targetId);
            if (target) {
              target.focus();
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};

export default SkipToContent;
