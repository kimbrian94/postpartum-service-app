'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AssignmentsTable } from '@/components/appointments/AssignmentsTable';
import { CreateAssignmentDialog } from '@/components/appointments/CreateAssignmentDialog';
import { AssignmentDetailsDialog } from '@/components/appointments/AssignmentDetailsDialog';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, List, RefreshCw } from 'lucide-react';
import type { CalendarEvent, AssignmentWithDetails } from '@/types';
import { formatDoulaName } from '@/lib/displayNames';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);

    setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

const AppointmentsPage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<CalendarEvent | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [view, setView] = useState<'calendar' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appointmentsView');
      return (saved as 'calendar' | 'table') || 'calendar';
    }
    return 'calendar';
  });

  // Save view preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appointmentsView', view);
    }
  }, [view]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedAssignment(event);
    setDetailsDialogOpen(true);
  };

  const handleSelectAssignment = (assignment: AssignmentWithDetails) => {
    // Convert AssignmentWithDetails to CalendarEvent
    const currentDoula = assignment.current_doula || assignment.doula;
    const doulaName = formatDoulaName(currentDoula, 'Doula');
    const calendarEvent: CalendarEvent = {
      ...assignment,
      title: `${assignment.client.name_english || assignment.client.name_korean || 'Client'} - ${doulaName}`,
      start: assignment.start_date,
      end: assignment.end_date,
    };
    setSelectedAssignment(calendarEvent);
    setDetailsDialogOpen(true);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const effectiveView = isMobile ? 'calendar' : view;

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col gap-3 md:gap-4">
      <div className="flex items-center justify-between gap-3 border-b pb-3 md:items-end md:pb-4">
        <div className="min-w-0 pl-14 lg:pl-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">Appointments</h1>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <div className="hidden items-center rounded-md border bg-background p-0.5 md:flex" role="tablist" aria-label="Appointments view">
            <Button
              variant={view === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('calendar')}
              className="h-8 rounded-sm px-2 sm:px-3"
              role="tab"
              aria-selected={view === 'calendar'}
            >
              <Calendar className="h-4 w-4 sm:mr-2" aria-hidden="true" />
              <span>Calendar</span>
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('table')}
              className="h-8 rounded-sm px-2 sm:px-3"
              role="tab"
              aria-selected={view === 'table'}
            >
              <List className="h-4 w-4 sm:mr-2" aria-hidden="true" />
              <span>Table</span>
            </Button>
          </div>

          <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh} aria-label="Refresh appointments">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="h-9 sm:w-auto">
            <Plus className="h-4 w-4 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Create Assignment</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      <section className="min-h-0 flex-1" aria-label={effectiveView === 'calendar' ? 'Appointments calendar' : 'Appointments table'}>
        {effectiveView === 'calendar' ? (
          <AppointmentCalendar
            onSelectEvent={handleSelectEvent}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <AssignmentsTable
            onSelectAssignment={handleSelectAssignment}
            refreshTrigger={refreshTrigger}
          />
        )}
      </section>

      <CreateAssignmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleRefresh}
      />

      <AssignmentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        assignment={selectedAssignment}
        onUpdate={handleRefresh}
      />
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
