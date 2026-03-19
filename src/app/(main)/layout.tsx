'use client';

import { useSession } from 'next-auth/react';
import TopBar from '@/components/layout/TopBar';
import SideNav from '@/components/layout/SideNav';
import { useSocket } from '@/lib/hooks/useSocket';
import { useUIStore } from '@/lib/stores/useUIStore';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || null;
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  // Connect Socket.IO for real-time task updates
  useSocket(userId);

  return (
    <>
      <TopBar />
      <SideNav />
      <main className={`pt-14 min-h-screen transition-all duration-300 ${collapsed ? 'pl-16' : 'pl-60'}`}>
        <div className="p-6 max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>
    </>
  );
}
