'use client';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SessionNotification = dynamic(() => import('./SessionNotification'), { ssr: false });

export default function GlobalConsultationListener() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return <SessionNotification userId={user.uid} />;
}
