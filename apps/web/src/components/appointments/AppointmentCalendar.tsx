"use client";

import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventContentArg, EventMountArg, type CalendarOptions } from '@fullcalendar/core';
import type { ComponentType } from 'react';
import { getAssignments } from '@/lib/api';
import type { CalendarEvent } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { MobileAgendaView } from './MobileAgendaView';
import { formatDoulaName } from '@/lib/displayNames';
import { appointmentStatusStyles, getAppointmentStatusStyle } from '@/lib/appointmentStatus';
import './calendar-styles.css';

const FullCalendarComponent = FullCalendar as unknown as ComponentType<CalendarOptions>;

// Custom hook for responsive breakpoint
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

interface AppointmentCalendarProps {
  onSelectEvent?: (event: CalendarEvent) => void;
  refreshTrigger?: number;
}

export function AppointmentCalendar({ onSelectEvent, refreshTrigger }: AppointmentCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const assignments = await getAssignments();
      
      // Transform assignments to FullCalendar events
      const calendarEvents: CalendarEvent[] = assignments.map((assignment) => {
        const clientName = assignment.client.name_english || assignment.client.name_korean || 'Unknown';
        const currentDoula = assignment.current_doula || assignment.doula;
        const doulaName = formatDoulaName(currentDoula, 'Doula');
        
        // FullCalendar expects end date to be exclusive (next day after the actual end)
        const endDate = new Date(`${assignment.end_date}T00:00:00`);
        endDate.setDate(endDate.getDate() + 1);
        
        return {
          ...assignment,
          title: `${clientName} - ${doulaName}`,
          start: assignment.start_date,
          end: endDate.toISOString().split('T')[0],
        };
      });
      
      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments, refreshTrigger]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events.find(e => e.id === parseInt(clickInfo.event.id));
    if (event && onSelectEvent) {
      onSelectEvent(event);
    }
  };

  const getEventColor = (status: string) => {
    return getAppointmentStatusStyle(status).eventColor;
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const event = eventInfo.event.extendedProps as CalendarEvent;
    const clientName = event.client.name_english || event.client.name_korean || 'Unknown Client';
    const doulaName = formatDoulaName(event.current_doula || event.doula, 'Unassigned');
    const statusStyle = getAppointmentStatusStyle(event.status);
    const dateRange = `${event.start_date} to ${event.end_date}`;

    return (
      <div className="appointment-event-content" aria-label={`${clientName}, ${doulaName}, ${statusStyle.label}, ${dateRange}`}>
        <div className="appointment-event-line">
          <span className="appointment-event-title">{clientName}</span>
          <span className="appointment-event-separator">-</span>
          <span className="appointment-event-doula">{doulaName}</span>
        </div>
      </div>
    );
  };

  const handleEventMount = (mountInfo: EventMountArg) => {
    const event = mountInfo.event.extendedProps as CalendarEvent;
    const clientName = event.client.name_english || event.client.name_korean || 'Unknown Client';
    const doulaName = formatDoulaName(event.current_doula || event.doula, 'Unassigned');
    const statusStyle = getAppointmentStatusStyle(event.status);
    const label = `${clientName}, doula ${doulaName}, ${statusStyle.label}, ${event.start_date} to ${event.end_date}`;

    mountInfo.el.setAttribute('aria-label', label);
    mountInfo.el.setAttribute('title', label);
  };

  if (error) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">Appointments could not be loaded.</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAssignments}
          className="mt-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-md border bg-card">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <RefreshCw className="h-7 w-7 animate-spin" aria-hidden="true" />
          <span>Loading appointments...</span>
        </div>
      </div>
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-6.5rem)] overflow-hidden">
        <MobileAgendaView events={events} onSelectEvent={(event) => onSelectEvent?.(event)} />
      </div>
    );
  }

  // Desktop view
  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-md border bg-card shadow-sm">
      <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Calendar Schedule</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Click an appointment to view details.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.entries(appointmentStatusStyles).map(([status, style]) => (
            <Badge key={status} variant="outline" className={`${style.badgeClassName} font-medium`}>
              {style.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 p-3">
        <FullCalendarComponent
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
          }}
          events={events.map(event => ({
            id: event.id.toString(),
            title: event.title,
            start: event.start,
            end: event.end,
            allDay: true,
            backgroundColor: getEventColor(event.status),
            borderColor: getEventColor(event.status),
            extendedProps: event
          }))}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          eventClassNames={() => ['appointment-event']}
          eventDidMount={handleEventMount}
          height="100%"
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          dayMaxEventRows={true}
          weekends={true}
          eventDisplay="block"
          fixedWeekCount={false}
        />
      </div>
    </div>
  );
}
