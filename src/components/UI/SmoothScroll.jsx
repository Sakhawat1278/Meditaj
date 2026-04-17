'use client';
import { m as motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * SmoothScroll - Implements world-class inertial scrolling using Framer Motion.
 * It creates a 'ghost' height to capture native scrolling and maps it 
 * to a spring-smoothed transform for the main content.
 */
export default function SmoothScroll({ children }) {
  const pathname = usePathname();
  const scrollRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Routes where smooth scroll should be disabled
  const excludedRoutes = ['/login', '/signup', '/forgot-password', '/dashboard'];
  const isExcluded = excludedRoutes.some(route => pathname.startsWith(route));
  
  // Capture native scroll progress
  const { scrollY } = useScroll();
  
  // Apply spring physics for that "premium" momentum feel
  const smoothY = useSpring(scrollY, {
    damping: 25,
    stiffness: 100,
    mass: 0.5,
    restDelta: 0.001
  });

  // Map the scrolled value to a translation
  const y = useTransform(smoothY, (value) => -value);

  // Respect users who prefer reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) setContentHeight(0);
  }, []);

  // Update the 'ghost' height when content changes
  useEffect(() => {
    if (isExcluded) return;

    let rafId;
    const updateHeight = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (scrollRef.current) {
          const height = scrollRef.current.getBoundingClientRect().height;
          setContentHeight(height);
        }
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    updateHeight();
    const timeout = setTimeout(updateHeight, 1500);
    
    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeout);
      cancelAnimationFrame(rafId);
    };
  }, [children, isExcluded, pathname]);

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <>
      <motion.div
        ref={scrollRef}
        style={{ y }}
        className="fixed top-0 left-0 w-full overflow-hidden pointer-events-auto"
      >
        {children}
      </motion.div>
      
      {/* Ghost div to preserve naturally scrollable height */}
      <div style={{ height: contentHeight, pointerEvents: 'none', visibility: 'hidden' }} aria-hidden="true" />
    </>
  );
}
