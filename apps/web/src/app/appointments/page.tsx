'use client';

import React from 'react';
import { Construction } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const AppointmentsPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <Construction className="h-24 w-24 text-muted-foreground mb-6" />
            <h1 className="text-3xl font-bold mb-2">Appointments</h1>
            <p className="text-lg text-muted-foreground text-center max-w-md">
                This page is currently under construction. Check back soon!
            </p>
        </div>
    );
};

export default function ProtectedAppointmentsPage() {
  return (
    <ProtectedRoute>
      <AppointmentsPage />
    </ProtectedRoute>
  );
}