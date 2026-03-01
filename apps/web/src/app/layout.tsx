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
    const buildId = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_ID || 'local';
    const timestamp = new Date().toISOString();
    
    return (
        <html lang="en">
          <body className="overflow-hidden">
            <ConditionalLayout>{children}</ConditionalLayout>
            <Toaster />
            
            {/* DEBUG: Build version indicator - REMOVE AFTER TESTING */}
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              background: 'red',
              color: 'white',
              padding: '4px 8px',
              fontSize: '11px',
              fontFamily: 'monospace',
              zIndex: 99999,
              textAlign: 'center'
            }}>
              BUILD: {buildId.slice(0, 7)} | RENDERED: {timestamp}
            </div>
          </body>
        </html>
    );
};

export default Layout;