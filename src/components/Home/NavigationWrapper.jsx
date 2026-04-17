'use client';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
const CurateHeader = dynamic(() => import('@/components/Home/CurateHeader'), { 
  ssr: true,
  loading: () => <div className="h-[88px] w-full bg-white border-b border-slate-200" />
});

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
