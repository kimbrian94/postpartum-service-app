import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'HMC Management',
  description: 'Internal management system for Hanna\'s Mom\'s Care',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <html lang="en">
          <body className="overflow-hidden">
            <ConditionalLayout>{children}</ConditionalLayout>
            <Toaster />
          </body>
        </html>
    );
};

export default Layout;