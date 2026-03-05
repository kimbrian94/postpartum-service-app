'use client';

import React, { useEffect, useState } from 'react';
import { getClients, Client } from '@/lib/api';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClients({ limit: 1000 });
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="h-full max-w-full flex flex-col">
      <div className="flex justify-between items-center mb-4 md:mb-6 pl-14 lg:pl-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Clients</h1>
        </div>
        <Button onClick={fetchClients} disabled={loading} variant="outline" size="icon" className="h-9 w-9">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-6">
          <p className="font-medium">Error loading clients</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && clients.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ClientsTable data={clients} onClientUpdated={fetchClients} />
        </div>
      )}
    </div>
  );
};

export default function ProtectedClientsPage() {
  return (
    <ProtectedRoute>
      <ClientsPage />
    </ProtectedRoute>
  );
}