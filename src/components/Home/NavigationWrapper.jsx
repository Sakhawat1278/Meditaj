'use client';
import { usePathname } from 'next/navigation';
import CurateHeader from '@/components/Home/CurateHeader';

export default function NavigationWrapper() {
  const pathname = usePathname();
  
  // Routes where the CurateHeader should NOT be shown
  const excludedRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/dashboard'
  ];

  // Check if current path starts with any of the excluded routes
  const isExcluded = excludedRoutes.some(route => pathname.startsWith(route));

  if (isExcluded) return null;

  return <CurateHeader />;
}
