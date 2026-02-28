'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
} from 'lucide-react';
import { logout } from '@/lib/auth';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Services', href: '/services', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname === href;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">
                Hanna&apos;s Mom Care
              </span>
            </div>
          )}
          {isCollapsed && (
            <div className="flex items-center justify-center w-full">
              <span className="text-xl font-bold text-indigo-600">HMC</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center px-3 py-2 rounded-lg text-sm font-medium
                      transition-colors duration-150
                      ${
                        isActive(item.href)
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon
                      className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`}
                      aria-hidden="true"
                    />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section: Collapse and Logout buttons */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          {/* Collapse button (desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              hidden lg:flex items-center w-full px-3 py-2 rounded-lg
              text-gray-500 hover:bg-gray-50 hover:text-gray-700
              transition-colors duration-150
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={`
              flex items-center w-full px-3 py-2 rounded-lg
              text-gray-700 hover:bg-red-50 hover:text-red-600
              transition-colors duration-150
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut
              className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`}
              aria-hidden="true"
            />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Spacer for main content */}
      <div
        className={`
          hidden lg:block transition-all duration-300 flex-shrink-0
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      />
    </>
  );
}
