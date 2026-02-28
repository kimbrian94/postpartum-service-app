'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    // Login page - no sidebar or navbar
    return <>{children}</>;
  }

  // All other pages - show sidebar only
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
