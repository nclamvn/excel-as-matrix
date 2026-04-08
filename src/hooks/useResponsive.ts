// ============================================================
// RESPONSIVE HOOK — Breakpoint detection + touch detection
// ============================================================

import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveState {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  isTouch: boolean;
  isLandscape: boolean;
}

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
};

function getResponsiveState(): ResponsiveState {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isLandscape = width > height;

  let breakpoint: Breakpoint = 'desktop';
  if (width < BREAKPOINTS.mobile) breakpoint = 'mobile';
  else if (width < BREAKPOINTS.tablet) breakpoint = 'tablet';

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    width,
    height,
    isTouch,
    isLandscape,
  };
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(getResponsiveState);

  useEffect(() => {
    const handleResize = () => setState(getResponsiveState());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

export function useResponsiveClass(): string {
  const { breakpoint, isTouch } = useResponsive();
  return `bp-${breakpoint} ${isTouch ? 'touch' : 'no-touch'}`;
}
