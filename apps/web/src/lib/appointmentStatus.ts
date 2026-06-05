import type { AssignmentStatus } from '@/types';

type StatusStyle = {
  label: string;
  badgeClassName: string;
  eventColor: string;
};

export const appointmentStatusStyles: Record<AssignmentStatus, StatusStyle> = {
  in_progress: {
    label: 'In Progress',
    badgeClassName: 'bg-blue-50 text-blue-700 border-blue-200',
    eventColor: '#2563eb',
  },
  completed: {
    label: 'Completed',
    badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    eventColor: '#059669',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClassName: 'bg-rose-50 text-rose-700 border-rose-200',
    eventColor: '#e11d48',
  },
};

export function getAppointmentStatusStyle(status: string) {
  return appointmentStatusStyles[status as AssignmentStatus] || {
    label: status,
    badgeClassName: 'bg-slate-50 text-slate-700 border-slate-200',
    eventColor: '#64748b',
  };
}
