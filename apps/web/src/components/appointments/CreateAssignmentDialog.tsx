"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getClients, getAvailableDoulas, createAssignment, type Client } from '@/lib/api';
import type { AvailableDoula, AssignmentCreate } from '@/types';
import { RefreshCw, AlertCircle, X } from 'lucide-react';
import { calculateEndDate, isSunday, getDayName, isValidStartDate, getServiceDaysDescription } from '@/lib/dateUtils';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDoulaName } from '@/lib/displayNames';

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAssignmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [availableDoulas, setAvailableDoulas] = useState<AvailableDoula[]>([]);
  const [loadingDoulas, setLoadingDoulas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDateError, setStartDateError] = useState<string | null>(null);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // Form fields
  const [clientId, setClientId] = useState<string>('');
  const [doulaId, setDoulaId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-populated from selected client
  const [daysPerWeek, setDaysPerWeek] = useState<number | undefined>(undefined);
  const [totalWeeks, setTotalWeeks] = useState<number | undefined>(undefined);
  
  // Auto-calculate end date toggle
  const [autoCalculateEnd, setAutoCalculateEnd] = useState(true);
  
  // Ref for click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load clients on mount
  useEffect(() => {
    if (open) {
      loadClients();
      resetForm();
    }
  }, [open]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setClientSearchOpen(false);
      }
    };

    if (clientSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [clientSearchOpen]);

  // Auto-populate service details when client is selected
  useEffect(() => {
    if (clientId) {
      const client = clients.find(c => c.id.toString() === clientId);
      if (client) {
        setDaysPerWeek(client.postpartum_care_days_per_week || undefined);
        setTotalWeeks(client.postpartum_care_weeks || undefined);
      }
    }
  }, [clientId, clients]);

  // Auto-calculate end date when parameters change
  useEffect(() => {
    if (autoCalculateEnd && startDate && daysPerWeek && totalWeeks) {
      const calculated = calculateEndDate(startDate, daysPerWeek, totalWeeks);
      if (calculated) {
        setEndDate(calculated);
      }
    }
  }, [autoCalculateEnd, startDate, daysPerWeek, totalWeeks]);

  // Re-validate start date when daysPerWeek changes
  useEffect(() => {
    if (startDate && daysPerWeek) {
      handleStartDateChange(startDate);
    }
  }, [daysPerWeek]);

  // Load available doulas when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      loadAvailableDoulas();
    } else {
      setAvailableDoulas([]);
      setDoulaId('');
    }
  }, [startDate, endDate]);

  const loadClients = async () => {
    try {
      const clientsList = await getClients({ limit: 1000 });
      setClients(clientsList);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError('Failed to load clients');
    }
  };

  const loadAvailableDoulas = async () => {
    if (!startDate || !endDate) return;

    setLoadingDoulas(true);
    try {
      const doulas = await getAvailableDoulas(startDate, endDate);
      setAvailableDoulas(doulas);
      
      // Reset doula selection if current selection is not available
      if (doulaId) {
        const selectedDoula = doulas.find(d => d.id.toString() === doulaId);
        if (selectedDoula && !selectedDoula.is_available) {
          setDoulaId('');
        }
      }
    } catch (err) {
      console.error('Error loading available doulas:', err);
      setError('Failed to check doula availability');
    } finally {
      setLoadingDoulas(false);
    }
  };

  const resetForm = () => {
    setClientId('');
    setDoulaId('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setDaysPerWeek(undefined);
    setTotalWeeks(undefined);
    setAutoCalculateEnd(true);
    setError(null);
    setStartDateError(null);
    setClientSearchQuery('');
    setClientSearchOpen(false);
  };

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    
    if (!newStartDate) {
      setStartDateError(null);
      return;
    }
    
    // Validate based on days per week if available
    if (daysPerWeek && !isValidStartDate(newStartDate, daysPerWeek)) {
      const dayName = getDayName(newStartDate);
      const validDays = getServiceDaysDescription(daysPerWeek);
      setStartDateError(`Start date must be ${validDays}. ${dayName} selected is not valid.`);
    } else if (isSunday(newStartDate)) {
      setStartDateError(`Start date cannot be Sunday. ${getDayName(newStartDate)} selected. Please choose Monday-Saturday.`);
    } else {
      setStartDateError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId || !doulaId || !startDate || !endDate) {
      setError('Please fill in all required fields');
      return;
    }

    // Prevent submission if start date is Sunday
    if (startDateError) {
      setError(startDateError);
      return;
    }

    setLoading(true);

    try {
      const payload: AssignmentCreate = {
        client_id: parseInt(clientId),
        doula_id: parseInt(doulaId),
        start_date: startDate,
        end_date: endDate,
        service_type: 'postpartum_care',
        days_per_week: daysPerWeek,
        total_weeks: totalWeeks,
        status: 'in_progress',
        notes: notes || undefined,
      };

      await createAssignment(payload);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      setError(err.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const availableDoulasOnly = availableDoulas.filter(d => d.is_available);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-2xl flex-col overflow-hidden sm:max-h-[90vh] sm:w-full"
        onOpenAutoFocus={(event: Event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>
            Assign a doula to a client for postpartum care services.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-1 pb-4 pt-1">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          {startDateError && (
            <div className="rounded-lg border border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-500 mt-0.5" />
              <p className="text-sm text-orange-600 dark:text-orange-500">{startDateError}</p>
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-2" ref={dropdownRef}>
            <Label htmlFor="client">Client *</Label>
            <div className="relative">
              <Input
                id="client"
                placeholder="Search by name or email..."
                value={clientSearchQuery}
                autoComplete="off"
                onChange={(e) => {
                  const value = e.target.value;
                  setClientSearchQuery(value);
                  setClientSearchOpen(value.trim().length > 0);
                  // Clear selection when typing
                  if (clientId) setClientId('');
                }}
              />
              {clientId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => {
                    setClientId('');
                    setClientSearchQuery('');
                    setClientSearchOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              
              {clientSearchOpen && clientSearchQuery.trim() && (() => {
                const filteredClients = clients.filter((client) => {
                  const searchLower = clientSearchQuery.toLowerCase();
                  const searchText = `${client.name_korean || ''} ${client.name_english || ''} ${client.email}`.toLowerCase();
                  return searchText.includes(searchLower);
                });

                return (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">No client found.</div>
                    ) : (
                      filteredClients.map((client) => {
                        const displayName = client.name_english || client.name_korean || 'Unknown';
                        return (
                          <div
                            key={client.id}
                            className="px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => {
                              setClientId(client.id.toString());
                              setClientSearchQuery(`${displayName} - ${client.email}`);
                              setClientSearchOpen(false);
                            }}
                          >
                            <div className="font-medium">{displayName}</div>
                            <div className="text-xs text-muted-foreground">{client.email}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <div className="flex w-full min-w-0 gap-2 sm:gap-4">
              <div className="min-w-0 flex-1 overflow-hidden space-y-2">
                <Label htmlFor="start-date" className="whitespace-nowrap text-xs sm:text-sm">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                  className={`block w-full min-w-0 max-w-full appearance-none overflow-hidden px-1 text-[13px] [color-scheme:light] [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:w-3 [&::-webkit-datetime-edit]:mx-auto [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit]:text-center [&::-webkit-datetime-edit]:text-[13px] sm:px-2 sm:text-sm sm:[&::-webkit-datetime-edit]:text-sm ${startDateError ? 'border-orange-500' : ''}`}
                  style={{ minInlineSize: 0, fontSize: 13, textAlign: 'center' }}
                />
                {startDate && daysPerWeek && (
                  <p className="text-xs text-muted-foreground">
                    {getDayName(startDate)} - Service days: {getServiceDaysDescription(daysPerWeek)}
                  </p>
                )}
                {startDate && !daysPerWeek && (
                  <p className="text-xs text-muted-foreground">
                    {getDayName(startDate)} - Select client first to see valid service days
                  </p>
                )}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden space-y-2">
                <Label htmlFor="end-date" className="whitespace-nowrap text-xs sm:text-sm">End Date *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate}
                  disabled={autoCalculateEnd}
                  className={`block w-full min-w-0 max-w-full appearance-none overflow-hidden px-1 text-[13px] [color-scheme:light] [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:w-3 [&::-webkit-datetime-edit]:mx-auto [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit]:text-center [&::-webkit-datetime-edit]:text-[13px] sm:px-2 sm:text-sm sm:[&::-webkit-datetime-edit]:text-sm ${autoCalculateEnd ? 'bg-muted' : ''}`}
                  style={{ minInlineSize: 0, fontSize: 13, textAlign: 'center' }}
                />
                {autoCalculateEnd && endDate && (
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated: {getDayName(endDate)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-calculate"
                checked={autoCalculateEnd}
                onCheckedChange={(checked: boolean) => setAutoCalculateEnd(checked)}
              />
              <Label
                htmlFor="auto-calculate"
                className="text-sm font-normal cursor-pointer"
              >
                Automatically calculate end date based on service schedule
              </Label>
            </div>
          </div>

          {/* Service Details (Auto-populated) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="days-per-week">Days Per Week</Label>
              <Input
                id="days-per-week"
                type="number"
                value={daysPerWeek || ''}
                onChange={(e) => setDaysPerWeek(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 5"
                min="1"
                max="7"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-weeks">Total Weeks</Label>
              <Input
                id="total-weeks"
                type="number"
                value={totalWeeks || ''}
                onChange={(e) => setTotalWeeks(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 2"
                min="1"
              />
            </div>
          </div>

          {/* Doula Selection */}
          <div className="space-y-2">
            <Label htmlFor="doula">Doula *</Label>
            {loadingDoulas ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking availability...
              </div>
            ) : !startDate || !endDate ? (
              <p className="text-sm text-muted-foreground p-2">
                Select date range first to check doula availability
              </p>
            ) : availableDoulasOnly.length === 0 ? (
              <p className="text-sm text-destructive p-2">
                No doulas available for the selected date range
              </p>
            ) : (
              <Select value={doulaId} onValueChange={setDoulaId}>
                <SelectTrigger id="doula">
                  <SelectValue placeholder="Select an available doula" />
                </SelectTrigger>
                <SelectContent>
                  {availableDoulasOnly.map((doula) => (
                    <SelectItem key={doula.id} value={doula.id.toString()}>
                      {formatDoulaName(doula)}
                      {doula.phone_number && ` - ${doula.phone_number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes..."
              rows={3}
            />
          </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !doulaId}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Assignment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
