'use client';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
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

  // Update the 'ghost' height when content changes
  useEffect(() => {
    if (isExcluded) return;

    const updateHeight = () => {
      if (scrollRef.current) {
        // Use getBoundingClientRect for more precise measurement of the rendered content
        const height = scrollRef.current.getBoundingClientRect().height;
        setContentHeight(height);
      }
    };

    // Use ResizeObserver for high-fidelity height tracking
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    // Initial check
    updateHeight();
    
    // Fallback for dynamic content/images loading
    const timeout = setTimeout(updateHeight, 1000);
    
    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeout);
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
