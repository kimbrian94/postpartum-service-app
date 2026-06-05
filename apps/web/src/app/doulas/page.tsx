'use client';

import React, { useEffect, useState } from 'react';
import { getDoulas } from '@/lib/api';
import type { Doula } from '@/types';
import { DoulasTable } from '@/components/doulas/DoulasTable';
import { CreateDoulaDialog } from '@/components/doulas/CreateDoulaDialog';
import { DoulaDetailsDialog } from '@/components/doulas/DoulaDetailsDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const DoulasPage = () => {
  const [doulas, setDoulas] = useState<Doula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoula, setSelectedDoula] = useState<Doula | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const fetchDoulas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDoulas(false); // Get all doulas (active and inactive)
      setDoulas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doulas');
      console.error('Error fetching doulas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoulas();
  }, []);

  const handleSelectDoula = (doula: Doula) => {
    setSelectedDoula(doula);
    setDetailsDialogOpen(true);
  };

  const handleDoulaUpdated = () => {
    fetchDoulas();
  };

  return (
    <div className="h-full max-w-full flex flex-col">
      <div className="flex justify-between items-center mb-4 md:mb-6 pl-14 lg:pl-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Doulas</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchDoulas} 
            disabled={loading} 
            variant="outline" 
            size="icon" 
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <CreateDoulaDialog onDoulaCreated={handleDoulaUpdated} />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-6">
          <p className="font-medium">Error loading doulas</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && doulas.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading doulas...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <DoulasTable data={doulas} onSelectDoula={handleSelectDoula} />
        </div>
      )}

      <DoulaDetailsDialog
        doula={selectedDoula}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onUpdate={handleDoulaUpdated}
      />
    </div>
  );
};

export default function ProtectedDoulasPage() {
  return (
    <ProtectedRoute>
      <DoulasPage />
    </ProtectedRoute>
  );
}
