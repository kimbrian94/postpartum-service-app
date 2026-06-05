"use client";

import { useEffect, useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getAvailableDoulas, switchAssignmentDoula } from '@/lib/api';
import type { AvailableDoula, CalendarEvent, SwitchCategory } from '@/types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { formatDoulaName } from '@/lib/displayNames';

interface SwitchDoulaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: CalendarEvent;
  onSuccess: () => void;
}

const switchCategoryLabels: Record<SwitchCategory, string> = {
  client_request: 'Client Request',
  doula_unavailable: 'Doula Unavailable',
  performance_issue: 'Performance Issue',
  mutual_agreement: 'Mutual Agreement',
  scheduling_conflict: 'Scheduling Conflict',
  personality_mismatch: 'Personality Mismatch',
  language_barrier: 'Language Barrier',
  other: 'Other',
};

const switchCategories = Object.keys(switchCategoryLabels) as SwitchCategory[];

export function SwitchDoulaDialog({
  open,
  onOpenChange,
  assignment,
  onSuccess,
}: SwitchDoulaDialogProps) {
  const [effectiveStartDate, setEffectiveStartDate] = useState('');
  const [newDoulaId, setNewDoulaId] = useState('');
  const [switchCategory, setSwitchCategory] = useState<SwitchCategory>('client_request');
  const [switchReason, setSwitchReason] = useState('');
  const [notes, setNotes] = useState('');
  const [availableDoulas, setAvailableDoulas] = useState<AvailableDoula[]>([]);
  const [loadingDoulas, setLoadingDoulas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentDoulaId = assignment.current_doula_id || assignment.doula_id;

  useEffect(() => {
    if (open) {
      setEffectiveStartDate('');
      setNewDoulaId('');
      setSwitchCategory('client_request');
      setSwitchReason('');
      setNotes('');
      setAvailableDoulas([]);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !effectiveStartDate) {
      setAvailableDoulas([]);
      return;
    }

    const loadDoulas = async () => {
      setLoadingDoulas(true);
      setError(null);
      try {
        const doulas = await getAvailableDoulas(effectiveStartDate, assignment.end_date, assignment.id);
        setAvailableDoulas(doulas);
        if (newDoulaId) {
          const selected = doulas.find((doula) => doula.id.toString() === newDoulaId);
          if (!selected?.is_available || selected.id === currentDoulaId) {
            setNewDoulaId('');
          }
        }
      } catch (err) {
        console.error('Error loading doulas for switch:', err);
        setError('Failed to check doula availability');
      } finally {
        setLoadingDoulas(false);
      }
    };

    loadDoulas();
  }, [open, effectiveStartDate, assignment.end_date, assignment.id, currentDoulaId, newDoulaId]);

  const availableDoulasOnly = useMemo(
    () => availableDoulas.filter((doula) => doula.is_available && doula.id !== currentDoulaId),
    [availableDoulas, currentDoulaId]
  );

  const handleSubmit = async () => {
    setError(null);

    if (!effectiveStartDate) {
      setError('Effective switch date is required');
      return;
    }
    if (effectiveStartDate <= assignment.start_date) {
      setError('Switch date must be after the assignment start date');
      return;
    }
    if (effectiveStartDate > assignment.end_date) {
      setError('Switch date must be within the assignment date range');
      return;
    }
    if (!newDoulaId) {
      setError('New doula is required');
      return;
    }
    if (parseInt(newDoulaId) === currentDoulaId) {
      setError('New doula must be different from the current doula');
      return;
    }
    if (!switchReason.trim()) {
      setError('Switch reason is required');
      return;
    }

    setSubmitting(true);
    try {
      await switchAssignmentDoula(assignment.id, {
        new_doula_id: parseInt(newDoulaId),
        effective_start_date: effectiveStartDate,
        switch_category: switchCategory,
        switch_reason: switchReason.trim(),
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error switching doula:', err);
      setError(err.message || 'Failed to switch doula');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Switch Doula</DialogTitle>
          <DialogDescription>
            Record the reason and effective date for changing the assigned doula.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="effective-start-date">Effective Switch Date *</Label>
            <Input
              id="effective-start-date"
              type="date"
              value={effectiveStartDate}
              min={assignment.start_date}
              max={assignment.end_date}
              onChange={(event) => setEffectiveStartDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-doula">New Doula *</Label>
            {loadingDoulas ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking availability...
              </div>
            ) : !effectiveStartDate ? (
              <p className="text-sm text-muted-foreground p-2">
                Select a switch date first.
              </p>
            ) : availableDoulasOnly.length === 0 ? (
              <p className="text-sm text-destructive p-2">
                No other doulas are available from the switch date through the assignment end date.
              </p>
            ) : (
              <Select value={newDoulaId} onValueChange={setNewDoulaId}>
                <SelectTrigger id="new-doula">
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

          <div className="space-y-2">
            <Label htmlFor="switch-category">Switch Category *</Label>
            <Select value={switchCategory} onValueChange={(value: string) => setSwitchCategory(value as SwitchCategory)}>
              <SelectTrigger id="switch-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {switchCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {switchCategoryLabels[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="switch-reason">Reason *</Label>
            <Textarea
              id="switch-reason"
              value={switchReason}
              onChange={(event) => setSwitchReason(event.target.value)}
              rows={3}
              placeholder="Describe why the doula is being switched..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="switch-notes">Notes</Label>
            <Textarea
              id="switch-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Optional internal notes..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loadingDoulas}>
            {submitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Switching...
              </>
            ) : (
              'Switch Doula'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
