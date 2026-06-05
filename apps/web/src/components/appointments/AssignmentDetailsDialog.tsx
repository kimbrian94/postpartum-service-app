"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { updateAssignment, deleteAssignment } from '@/lib/api';
import type { CalendarEvent, AssignmentStatus, AssignmentUpdate, SwitchCategory } from '@/types';
import { Calendar, User, Phone, Mail, FileText, Trash2, RefreshCw, Edit2, X, Repeat2 } from 'lucide-react';
import { format } from 'date-fns';
import { calculateEndDate } from '@/lib/dateUtils';
import { Checkbox } from '@/components/ui/checkbox';
import { SwitchDoulaDialog } from './SwitchDoulaDialog';
import { formatDoulaName } from '@/lib/displayNames';
import { getAppointmentStatusStyle } from '@/lib/appointmentStatus';

interface AssignmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: CalendarEvent | null;
  onUpdate: () => void;
}

export function AssignmentDetailsDialog({
  open,
  onOpenChange,
  assignment,
  onUpdate,
}: AssignmentDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit form state
  const [editedData, setEditedData] = useState<AssignmentUpdate>({});
  const [autoCalculateEnd, setAutoCalculateEnd] = useState(false);

  // Reset edit mode when assignment changes or dialog closes
  useEffect(() => {
    if (open && assignment) {
      setIsEditing(false);
      setEditedData({});
      setError(null);
    }
  }, [open, assignment]);

  // Auto-calculate end date when parameters change
  useEffect(() => {
    if (autoCalculateEnd && isEditing && assignment) {
      const startDate = editedData.start_date || assignment.start_date;
      const daysPerWeek = editedData.days_per_week ?? assignment.days_per_week;
      const totalWeeks = editedData.total_weeks ?? assignment.total_weeks;
      
      if (startDate && daysPerWeek && totalWeeks) {
        const calculated = calculateEndDate(startDate, daysPerWeek, totalWeeks);
        if (calculated && calculated !== (editedData.end_date || assignment.end_date)) {
          setEditedData(prev => ({ ...prev, end_date: calculated }));
        }
      }
    }
  }, [autoCalculateEnd, editedData.start_date, editedData.days_per_week, editedData.total_weeks, isEditing, assignment]);

  if (!assignment) return null;

  const currentDoula = assignment.current_doula || assignment.doula;
  const doulaHistory = assignment.doula_history || [];
  const hasSwitchHistory = doulaHistory.length > 1;
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

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedData({});
      setError(null);
      setAutoCalculateEnd(false);
    } else {
      setAutoCalculateEnd(true);
      // Scroll to top when entering edit mode
      setTimeout(() => {
        const dialogContent = document.querySelector('[role="dialog"] .overflow-y-auto');
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
      }, 0);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdit = async () => {
    setError(null);
    setUpdating(true);

    try {
      // Only send fields that have been changed
      const updates = Object.keys(editedData).reduce((acc, key) => {
        const value = editedData[key as keyof AssignmentUpdate];
        if (value !== undefined) {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as AssignmentUpdate);

      if (Object.keys(updates).length > 0) {
        await updateAssignment(assignment.id, updates);
        onUpdate(); // Refresh the list
        onOpenChange(false); // Close dialog to show updated data when reopened
        setIsEditing(false);
        setEditedData({});
      } else {
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error('Error updating assignment:', err);
      setError(err.message || 'Failed to update assignment');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);

    try {
      await deleteAssignment(assignment.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
      onUpdate();
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      setError(err.message || 'Failed to delete assignment');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    const style = getAppointmentStatusStyle(status);
    return <Badge variant="outline" className={style.badgeClassName}>{style.label}</Badge>;
  };

  const getValue = (field: keyof AssignmentUpdate) => {
    return editedData[field] !== undefined
      ? editedData[field]
      : (assignment as any)[field];
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto overflow-x-hidden max-h-[calc(90vh-14rem)] pb-4 px-2">
            <div className="mt-4 space-y-6">
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              {isEditing ? (
                <>
                  <Select
                    value={(getValue('status') as AssignmentStatus) || assignment.status}
                    onValueChange={(value: string) => setEditedData({ ...editedData, status: value as AssignmentStatus })}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Cancellation Reason - Only shown when Cancelled is selected */}
                  {(getValue('status') === 'cancelled' || assignment.status === 'cancelled') && (
                    <div className="mt-2">
                      <Label htmlFor="cancellation_reason" className="text-destructive">Reason for Cancellation *</Label>
                      <Textarea
                        id="cancellation_reason"
                        value={(editedData.cancellation_reason !== undefined ? editedData.cancellation_reason : assignment.cancellation_reason) || ''}
                        onChange={(e) => setEditedData({ ...editedData, cancellation_reason: e.target.value })}
                        rows={3}
                        placeholder="Please provide the reason for cancellation..."
                        className="mt-1 text-destructive placeholder:text-destructive/50"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>{getStatusBadge(assignment.status)}</div>
                  {assignment.status === 'cancelled' && assignment.cancellation_reason && (
                    <div className="mt-2 p-3 rounded-lg border border-destructive bg-destructive/10">
                      <p className="text-xs font-medium text-destructive mb-1">Cancellation Reason:</p>
                      <p className="text-sm text-destructive whitespace-pre-wrap">{assignment.cancellation_reason}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Service Period
              </div>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex justify-between gap-3">
                    <div className="space-y-1 flex-none" style={{width: '47%'}}>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={(editedData.start_date || assignment.start_date) as string}
                        onChange={(e) => setEditedData({ ...editedData, start_date: e.target.value })}
                        className="w-full min-w-0 px-2"
                      />
                    </div>
                    <div className="space-y-1 flex-none" style={{width: '47%'}}>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={(editedData.end_date || assignment.end_date) as string}
                        onChange={(e) => setEditedData({ ...editedData, end_date: e.target.value })}
                        disabled={autoCalculateEnd}
                        className="w-full min-w-0 px-2"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between gap-4">
                    <div className="space-y-1" style={{width: 'calc(50% - 0.5rem)'}}>
                      <Label htmlFor="days_per_week">Days/Week</Label>
                      <Input
                        id="days_per_week"
                        type="number"
                        min="1"
                        max="6"
                        value={(editedData.days_per_week ?? assignment.days_per_week) || ''}
                        onChange={(e) => setEditedData({ ...editedData, days_per_week: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-1" style={{width: 'calc(50% - 0.5rem)'}}>
                      <Label htmlFor="total_weeks">Total Weeks</Label>
                      <Input
                        id="total_weeks"
                        type="number"
                        min="1"
                        value={(editedData.total_weeks ?? assignment.total_weeks) || ''}
                        onChange={(e) => setEditedData({ ...editedData, total_weeks: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoCalculate"
                      checked={autoCalculateEnd}
                      onCheckedChange={(checked: boolean | 'indeterminate') => setAutoCalculateEnd(checked === true)}
                    />
                    <label
                      htmlFor="autoCalculate"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Auto-calculate end date
                    </label>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Start:</span>
                    <span className="font-medium">{format(new Date(assignment.start_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">End:</span>
                    <span className="font-medium">{format(new Date(assignment.end_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                  </div>
                  {assignment.days_per_week && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Days/Week:</span>
                      <span className="font-medium">{assignment.days_per_week}</span>
                    </div>
                  )}
                  {assignment.total_weeks && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Weeks:</span>
                      <span className="font-medium">{assignment.total_weeks}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Client Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Client Information
              </div>
              <div className="rounded-lg border p-3 space-y-2">
                <div>
                  <div className="text-sm font-medium">
                    {assignment.client.name_english || assignment.client.name_korean}
                  </div>
                  {assignment.client.name_korean && assignment.client.name_english && (
                    <div className="text-sm text-muted-foreground">
                      {assignment.client.name_korean}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {assignment.client.email}
                </div>
                {assignment.client.phone_number && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {assignment.client.phone_number}
                  </div>
                )}
                {assignment.client.due_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Due: {format(new Date(assignment.client.due_date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>

            {/* Doula Information - View Mode */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Assigned Doula
                {hasSwitchHistory && (
                  <Badge variant="secondary" className="text-xs">
                    Switched
                  </Badge>
                )}
              </div>
              <div className="rounded-lg border p-3 space-y-2">
                <div className="text-sm font-medium">
                  {formatDoulaName(currentDoula)}
                </div>
                {currentDoula.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {currentDoula.email}
                  </div>
                )}
                {currentDoula.phone_number && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {currentDoula.phone_number}
                  </div>
                )}
              </div>
            </div>

            {/* Doula History */}
            {!isEditing && doulaHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Repeat2 className="h-4 w-4" />
                  Doula History
                </div>
                <div className="rounded-lg border divide-y">
                  {doulaHistory.map((history) => {
                    const doulaName = formatDoulaName(history.doula);
                    return (
                      <div key={history.id} className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{doulaName}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(history.start_date + 'T00:00:00'), 'MMM d, yyyy')} - {' '}
                              {history.end_date
                                ? format(new Date(history.end_date + 'T00:00:00'), 'MMM d, yyyy')
                                : 'Current'}
                            </div>
                          </div>
                          {!history.end_date && (
                            <Badge className="text-xs">Current</Badge>
                          )}
                        </div>
                        {history.switch_category && (
                          <div className="text-xs text-muted-foreground">
                            Category: {switchCategoryLabels[history.switch_category] || history.switch_category}
                          </div>
                        )}
                        {history.switch_reason && (
                          <div className="text-sm whitespace-pre-wrap">{history.switch_reason}</div>
                        )}
                        {history.notes && (
                          <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                            Notes: {history.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {(assignment.notes || isEditing) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Notes
                </div>
                {isEditing ? (
                  <Textarea
                    value={(editedData.notes !== undefined ? editedData.notes : assignment.notes) || ''}
                    onChange={(e) => setEditedData({ ...editedData, notes: e.target.value })}
                    rows={4}
                    placeholder="Add notes about this assignment..."
                  />
                ) : (
                  <div className="rounded-lg border p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                    {assignment.notes}
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            {!isEditing && (
              <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                <div>Created: {format(new Date(assignment.created_at), 'MMM d, yyyy h:mm a')}</div>
                <div>Updated: {format(new Date(assignment.updated_at), 'MMM d, yyyy h:mm a')}</div>
              </div>
            )}
            </div>
          </div>

          {/* Actions */}
          <DialogFooter className="flex-shrink-0">
            {isEditing ? (
              <div className="flex w-full gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleEditToggle}
                  disabled={updating}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleEditToggle}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSwitchDialog(true)}
                  disabled={deleting || assignment.status === 'cancelled'}
                >
                  <Repeat2 className="mr-2 h-4 w-4" />
                  Switch
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
              <div className="mt-2 text-sm font-medium">
                {assignment.client.name_english || assignment.client.name_korean} - {formatDoulaName(currentDoula)}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SwitchDoulaDialog
        open={showSwitchDialog}
        onOpenChange={setShowSwitchDialog}
        assignment={assignment}
        onSuccess={() => {
          onUpdate();
          onOpenChange(false);
        }}
      />
    </>
  );
}
