'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const INACTIVITY_LIMIT = 5 * 60 * 1000;
const SESSION_KEYS = [
  'staff_phone', 'staff_username', 'staff_name', 'staff_role', 'staff_grade',
  'admin_phone', 'admin_username', 'admin_name', 'admin_role',
  'parent_phone', 'parent_username', 'parent_name',
  'hq_phone'
];

export default function SessionTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef(null);

  useEffect(() => {
    const hasSession = () => SESSION_KEYS.some((key) => localStorage.getItem(key));

    const getLoginPath = () => {
      if (pathname.startsWith('/hq')) return '/hq';
      if (pathname.startsWith('/admin')) return '/admin';
      if (pathname.startsWith('/register/parent')) return '/register/parent/dashboard';
      return '/staff/login';
    };

    const logout = () => {
      SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
      window.dispatchEvent(new Event('kidshield-session-end'));
      router.replace(getLoginPath());
    };

    const resetTimer = () => {
      window.clearTimeout(timerRef.current);
      if (!hasSession()) return;
      timerRef.current = window.setTimeout(logout, INACTIVITY_LIMIT);
    };

    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    window.addEventListener('kidshield-session-start', resetTimer);
    window.addEventListener('kidshield-session-end', resetTimer);
    window.addEventListener('storage', resetTimer);
    resetTimer();

    return () => {
      window.clearTimeout(timerRef.current);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
      window.removeEventListener('kidshield-session-start', resetTimer);
      window.removeEventListener('kidshield-session-end', resetTimer);
      window.removeEventListener('storage', resetTimer);
    };
  }, [pathname, router]);

  return null;
}
