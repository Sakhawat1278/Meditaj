'use client';
import { usePathname } from 'next/navigation';
import CurateFooter from '@/components/Home/CurateFooter';

export default function FooterWrapper() {
  const pathname = usePathname();
  
  // Routes where the CurateFooter should NOT be shown
  const excludedRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/dashboard'
  ];

  // Check if current path starts with any of the excluded routes
  const isExcluded = excludedRoutes.some(route => pathname.startsWith(route));

  if (isExcluded) return null;

  return <CurateFooter />;
}
