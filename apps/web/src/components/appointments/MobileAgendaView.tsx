"use client";

import { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { CalendarEvent } from '@/types';
import { formatDoulaName } from '@/lib/displayNames';
import { getAppointmentStatusStyle } from '@/lib/appointmentStatus';

interface MobileAgendaViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export function MobileAgendaView({ events, onSelectEvent }: MobileAgendaViewProps) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mobileAgenda_weekStart');
      if (saved) {
        return new Date(saved);
      }
    }
    return startOfWeek(new Date(), { weekStartsOn: 0 });
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mobileAgenda_selectedDate');
      if (saved) {
        return new Date(saved);
      }
    }
    return new Date();
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobileAgenda_weekStart', currentWeekStart.toISOString());
    }
  }, [currentWeekStart]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobileAgenda_selectedDate', selectedDate.toISOString());
    }
  }, [selectedDate]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [selectedDate]);

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 0 }));
    setSelectedDate(today);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getEventsForDate = (date: Date) => {
    const dateStart = startOfDay(date);
    return events.filter(event => {
      const eventStart = parseISO(event.start);
      const eventEnd = event.end ? parseISO(event.end) : eventStart;

      return dateStart >= startOfDay(eventStart) && dateStart < startOfDay(eventEnd);
    });
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  const getEventCountForDay = (date: Date) => {
    return getEventsForDate(date).length;
  };

  return (
    <div className="flex h-full flex-col rounded-md border bg-card">
      <div className="flex flex-shrink-0 items-center justify-between gap-1 border-b px-2 py-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousWeek} aria-label="Previous week">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="flex-1 text-center">
          <h2 className="text-sm font-semibold leading-tight">
            {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
          </h2>
          <p className="text-[11px] text-muted-foreground">Weekly agenda</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToToday} aria-label="Go to today">
          <CalendarIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextWeek} aria-label="Next week">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="grid flex-shrink-0 grid-cols-7 gap-1 border-b bg-muted/20 p-2">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const eventCount = getEventCountForDay(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              aria-pressed={isSelected}
              aria-label={`${format(day, 'EEEE, MMMM d')}, ${eventCount} ${eventCount === 1 ? 'assignment' : 'assignments'}`}
              className={`
                flex min-h-[56px] flex-col items-center justify-center rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                ${isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isToday
                  ? 'bg-accent'
                  : 'hover:bg-muted'
                }
              `}
            >
              <span className="mb-0.5 text-[10px] font-medium">
                {format(day, 'EEE')}
              </span>
              <span className={`text-base font-semibold ${isToday && !isSelected ? 'text-primary' : ''}`}>
                {format(day, 'd')}
              </span>
              {eventCount > 0 && (
                <div className="mt-0.5 flex gap-0.5">
                  {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? 'bg-primary-foreground' : 'bg-primary'
                      }`}
                    />
                  ))}
                  {eventCount > 3 && (
                    <span className="ml-0.5 text-[9px]">+</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-3"
      >
        <div className="mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')} | {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'assignment' : 'assignments'}
          </h3>
        </div>

        {selectedDateEvents.length === 0 ? (
          <Card className="rounded-md border-dashed p-8 text-center shadow-none">
            <CalendarIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-60" aria-hidden="true" />
            <p className="text-sm font-medium">No assignments for this date</p>
            <p className="mt-1 text-xs text-muted-foreground">Pick another day or create a new assignment.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {selectedDateEvents.map((event) => {
              const statusStyle = getAppointmentStatusStyle(event.status);
              const clientName = event.client.name_english || event.client.name_korean || 'Unknown Client';

              return (
                <Card
                  key={event.id}
                  className="cursor-pointer rounded-md p-4 shadow-none transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onSelectEvent(event)}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                      keyboardEvent.preventDefault();
                      onSelectEvent(event);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open assignment for ${clientName}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="mb-1 truncate text-base font-semibold">
                        {clientName}
                      </h4>
                      <p className="mb-2 truncate text-sm text-muted-foreground">
                        Doula: {formatDoulaName(event.current_doula || event.doula, 'Unassigned')}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" aria-hidden="true" />
                        <span>
                          {format(parseISO(event.start_date), 'MMM d')} - {format(parseISO(event.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${statusStyle.badgeClassName} shrink-0 font-semibold`}>
                      {statusStyle.label}
                    </Badge>
                  </div>

                  {(event.days_per_week || event.total_weeks) && (
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                      {event.days_per_week && (
                        <div>
                          <span className="text-muted-foreground">Days/week</span>
                          <span className="ml-1 font-medium">{event.days_per_week}</span>
                        </div>
                      )}
                      {event.total_weeks && (
                        <div>
                          <span className="text-muted-foreground">Total weeks</span>
                          <span className="ml-1 font-medium">{event.total_weeks}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {event.notes && (
                    <div className="mt-2 border-t pt-2">
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {event.notes}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
