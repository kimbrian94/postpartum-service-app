'use client';

import { useState, useEffect } from 'react';
import { updateDoula, deactivateDoula } from '@/lib/api';
import type { Doula, DoulaUpdate } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit2, Save, Trash2, X } from 'lucide-react';
import { formatDoulaName } from '@/lib/displayNames';

const SERVICE_AREAS = [
  'Ajax',
  'Aurora/ King City',
  'Barrie',
  'Brampton',
  'Downtown',
  'Etobicoke',
  'Hamilton',
  'Markham/ Scarborough',
  'Midtown',
  'Milton',
  'Mississauga',
  'Newmarket',
  'Niagara',
  'North York/ Thornhill',
  'Oakville',
  'Richmond Hill',
  'Vaughan',
  'All Areas',
] as const;

interface DoulaDetailsDialogProps {
  doula: Doula | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function DoulaDetailsDialog({
  doula,
  open,
  onOpenChange,
  onUpdate,
}: DoulaDetailsDialogProps) {
  const [formData, setFormData] = useState<DoulaUpdate>({});
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const { toast } = useToast();

  // Reset form to original doula values whenever dialog opens or doula changes
  useEffect(() => {
    if (doula && open) {
      setFormData({
        name_korean: doula.name_korean || '',
        name_english: doula.name_english || '',
        name_preferred: doula.name_preferred || '',
        date_of_birth: doula.date_of_birth || '',
        phone_number: doula.phone_number || '',
        email: doula.email || '',
        legal_status: doula.legal_status || '',
        languages: doula.languages || '',
        service_area: doula.service_area || '',
        start_year: doula.start_year,
        has_tdap: doula.has_tdap ?? false,
        has_mmr: doula.has_mmr ?? false,
        has_varicella: doula.has_varicella ?? false,
        has_hep_b: doula.has_hep_b ?? false,
        pet_allergies: doula.pet_allergies || '',
        is_active: doula.is_active,
        notes: doula.notes || '',
      });
      
      // Parse service_area string to array
      if (doula.service_area) {
        setSelectedServiceAreas(
          doula.service_area.split(',').map((area) => area.trim()).filter(Boolean)
        );
      } else {
        setSelectedServiceAreas([]);
      }
      
      setErrors({});
      setIsEditing(false);
    }
  }, [doula, open]);

  const resetForm = () => {
    if (!doula) return;

    setFormData({
      name_korean: doula.name_korean || '',
      name_english: doula.name_english || '',
      name_preferred: doula.name_preferred || '',
      date_of_birth: doula.date_of_birth || '',
      phone_number: doula.phone_number || '',
      email: doula.email || '',
      legal_status: doula.legal_status || '',
      languages: doula.languages || '',
      service_area: doula.service_area || '',
      start_year: doula.start_year,
      has_tdap: doula.has_tdap ?? false,
      has_mmr: doula.has_mmr ?? false,
      has_varicella: doula.has_varicella ?? false,
      has_hep_b: doula.has_hep_b ?? false,
      pet_allergies: doula.pet_allergies || '',
      is_active: doula.is_active,
      notes: doula.notes || '',
    });

    if (doula.service_area) {
      setSelectedServiceAreas(
        doula.service_area.split(',').map((area) => area.trim()).filter(Boolean)
      );
    } else {
      setSelectedServiceAreas([]);
    }

    setErrors({});
  };

  const handleEditToggle = () => {
    if (isEditing) {
      resetForm();
    }

    setIsEditing(!isEditing);
  };

  const handleChange = (field: keyof DoulaUpdate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleServiceAreaToggle = (area: string) => {
    setSelectedServiceAreas((prev) => {
      let newAreas: string[];
      
      if (area === 'All Areas') {
        // If "All Areas" is selected, clear all other selections
        newAreas = prev.includes('All Areas') ? [] : ['All Areas'];
      } else {
        // If selecting a specific area, remove "All Areas" if present
        const filtered = prev.filter((a) => a !== 'All Areas');
        if (filtered.includes(area)) {
          newAreas = filtered.filter((a) => a !== area);
        } else {
          newAreas = [...filtered, area];
        }
      }
      
      // Update formData with comma-separated string
      handleChange('service_area', newAreas.join(', '));
      return newAreas;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name_preferred?.trim() && !formData.name_korean?.trim() && !formData.name_english?.trim()) {
      newErrors.name_preferred = 'At least one name is required';
      newErrors.name_korean = 'At least one name is required';
      newErrors.name_english = 'At least one name is required';
    }

    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      if (dob > new Date()) {
        newErrors.date_of_birth = 'Date of birth must be in the past';
      }
    }

    // Start year validation (if provided)
    if (formData.start_year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (formData.start_year < 1900 || formData.start_year > currentYear) {
        newErrors.start_year = `Start year must be between 1900 and ${currentYear}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!doula) return;

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please check the form for errors',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean up the data before sending
      const cleanData: DoulaUpdate = {
        name_korean: formData.name_korean?.trim() || undefined,
        name_english: formData.name_english?.trim() || undefined,
        name_preferred: formData.name_preferred?.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        phone_number: formData.phone_number?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        legal_status: formData.legal_status || undefined,
        languages: formData.languages?.trim() || undefined,
        service_area: formData.service_area?.trim() || undefined,
        start_year: formData.start_year,
        has_tdap: formData.has_tdap,
        has_mmr: formData.has_mmr,
        has_varicella: formData.has_varicella,
        has_hep_b: formData.has_hep_b,
        pet_allergies: formData.pet_allergies?.trim() || undefined,
        is_active: formData.is_active,
        notes: formData.notes?.trim() || undefined,
      };

      await updateDoula(doula.id, cleanData);

      toast({
        title: 'Success',
        description: 'Doula updated successfully',
      });

      onUpdate();
      onOpenChange(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating doula:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update doula',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!doula) return;

    setIsDeactivating(true);

    try {
      await deactivateDoula(doula.id);

      toast({
        title: 'Success',
        description: 'Doula deactivated successfully',
      });

      onUpdate();
      onOpenChange(false);
      setConfirmDeactivateOpen(false);
    } catch (error) {
      console.error('Error deactivating doula:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to deactivate doula',
        variant: 'destructive',
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  if (!doula) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-8">
              <DialogTitle className="min-w-0 truncate">
                {formatDoulaName(formData, 'N/A')}
              </DialogTitle>
              <Badge variant={doula.is_active ? 'default' : 'secondary'} className="shrink-0">
                {doula.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </DialogHeader>

          <div className="max-h-[calc(90vh-14rem)] min-w-0 overflow-y-auto overflow-x-hidden px-2 pb-4">
          <div className="mt-4 min-w-0 space-y-6">
            {/* Names Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">Names</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_preferred">
                    Preferred Name {!formData.name_korean && !formData.name_english && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="name_preferred"
                    value={formData.name_preferred}
                    onChange={(e) => handleChange('name_preferred', e.target.value)}
                    placeholder="N/A"
                    disabled={!isEditing}
                  />
                  {errors.name_preferred && (
                    <p className="text-sm text-destructive">{errors.name_preferred}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_korean">
                    Korean Name {!formData.name_preferred && !formData.name_english && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="name_korean"
                    value={formData.name_korean}
                    onChange={(e) => handleChange('name_korean', e.target.value)}
                    placeholder="N/A"
                    disabled={!isEditing}
                  />
                  {errors.name_korean && (
                    <p className="text-sm text-destructive">{errors.name_korean}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_english">
                    English Name {!formData.name_preferred && !formData.name_korean && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="name_english"
                    value={formData.name_english}
                    onChange={(e) => handleChange('name_english', e.target.value)}
                    placeholder="N/A"
                    disabled={!isEditing}
                  />
                  {errors.name_english && (
                    <p className="text-sm text-destructive">{errors.name_english}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="N/A"
                    disabled={!isEditing}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => handleChange('phone_number', e.target.value)}
                    placeholder="N/A"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  disabled={!isEditing}
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-destructive">{errors.date_of_birth}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legal_status">Legal Status</Label>
                  <Select
                    value={formData.legal_status}
                    onValueChange={(value: string) => handleChange('legal_status', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="legal_status">
                      <SelectValue placeholder="N/A" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">Citizen</SelectItem>
                      <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                      <SelectItem value="work_permit">Work Permit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_year">Start Year</Label>
                  <Input
                    id="start_year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.start_year ?? ''}
                    onChange={(e) =>
                      handleChange('start_year', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="N/A"
                    disabled={!isEditing}
                  />
                  {errors.start_year && (
                    <p className="text-sm text-destructive">{errors.start_year}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="languages">Languages</Label>
                <Input
                  id="languages"
                  value={formData.languages}
                  onChange={(e) => handleChange('languages', e.target.value)}
                  placeholder="Korean, English, Spanish"
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>Service Area</Label>
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {SERVICE_AREAS.map((area) => {
                      const isAllAreas = area === 'All Areas';
                      const isDisabled = !isAllAreas && selectedServiceAreas.includes('All Areas');
                      const isChecked = selectedServiceAreas.includes(area);
                      
                      return (
                        <div key={area} className="flex min-w-0 items-start gap-2">
                          <input
                            type="checkbox"
                            id={`service_area_${area}`}
                            checked={isChecked}
                            disabled={!isEditing || isDisabled}
                            onChange={() => handleServiceAreaToggle(area)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 disabled:opacity-50"
                          />
                          <Label 
                            htmlFor={`service_area_${area}`} 
                            className={`min-w-0 cursor-pointer whitespace-normal break-words font-normal leading-snug ${isDisabled ? 'opacity-50' : ''} ${isAllAreas ? 'font-semibold' : ''}`}
                          >
                            {area}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  {selectedServiceAreas.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {selectedServiceAreas.map((area) => (
                        <Badge key={area} variant="secondary" className="min-w-0 max-w-full gap-1 whitespace-normal break-words text-left">
                          {area}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleServiceAreaToggle(area)}
                              className="ml-1 hover:text-destructive"
                              aria-label={`Remove ${area}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vaccinations</Label>
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex min-w-0 items-start gap-2">
                    <input
                      type="checkbox"
                      id="has_tdap"
                      checked={formData.has_tdap}
                      onChange={(e) => handleChange('has_tdap', e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
                      disabled={!isEditing}
                    />
                    <Label htmlFor="has_tdap" className="min-w-0 cursor-pointer whitespace-normal break-words font-normal leading-snug">
                      Tdap (Tetanus, Diphtheria, Pertussis)
                    </Label>
                  </div>
                  
                  <div className="flex min-w-0 items-start gap-2">
                    <input
                      type="checkbox"
                      id="has_mmr"
                      checked={formData.has_mmr}
                      onChange={(e) => handleChange('has_mmr', e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
                      disabled={!isEditing}
                    />
                    <Label htmlFor="has_mmr" className="min-w-0 cursor-pointer whitespace-normal break-words font-normal leading-snug">
                      MMR (Measles, Mumps, Rubella)
                    </Label>
                  </div>
                  
                  <div className="flex min-w-0 items-start gap-2">
                    <input
                      type="checkbox"
                      id="has_varicella"
                      checked={formData.has_varicella}
                      onChange={(e) => handleChange('has_varicella', e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
                      disabled={!isEditing}
                    />
                    <Label htmlFor="has_varicella" className="min-w-0 cursor-pointer whitespace-normal break-words font-normal leading-snug">
                      Varicella (Chickenpox)
                    </Label>
                  </div>
                  
                  <div className="flex min-w-0 items-start gap-2">
                    <input
                      type="checkbox"
                      id="has_hep_b"
                      checked={formData.has_hep_b}
                      onChange={(e) => handleChange('has_hep_b', e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
                      disabled={!isEditing}
                    />
                    <Label htmlFor="has_hep_b" className="min-w-0 cursor-pointer whitespace-normal break-words font-normal leading-snug">
                      Hepatitis B
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pet_allergies">Pet Allergies</Label>
                <Input
                  id="pet_allergies"
                  value={formData.pet_allergies}
                  onChange={(e) => handleChange('pet_allergies', e.target.value)}
                  placeholder="None, Cats, Dogs, etc."
                  disabled={!isEditing}
                />
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">Notes</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Information</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Additional information about the doula..."
                  rows={4}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <Separator />

            {/* Metadata */}
            <div className="text-sm text-muted-foreground">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(doula.created_at).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{' '}
                  {new Date(doula.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          </div>

          <Separator />

          <div className="flex w-full gap-2">
            {isEditing ? (
              <div className="flex w-full justify-end gap-2">
                <Button variant="outline" onClick={handleEditToggle} disabled={isSubmitting}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDeactivateOpen(true)}
                  disabled={!doula.is_active}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
                <Button variant="outline" onClick={handleEditToggle} className="flex-1">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={confirmDeactivateOpen} onOpenChange={setConfirmDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Doula?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this doula? They will no longer appear in active listings.
              <div className="mt-2 text-sm font-medium">
                {formatDoulaName(doula, 'N/A')}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
