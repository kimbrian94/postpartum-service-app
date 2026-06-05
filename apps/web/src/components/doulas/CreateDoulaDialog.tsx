'use client';

import { useState, type FormEvent } from 'react';
import { createDoula } from '@/lib/api';
import type { DoulaCreate } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface CreateDoulaDialogProps {
  onDoulaCreated: () => void;
}

export function CreateDoulaDialog({ onDoulaCreated }: CreateDoulaDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DoulaCreate>({
    name_korean: '',
    name_english: '',
    name_preferred: '',
    date_of_birth: '',
    phone_number: '',
    email: '',
    legal_status: '',
    languages: '',
    service_area: '',
    start_year: undefined,
    has_tdap: false,
    has_mmr: false,
    has_varicella: false,
    has_hep_b: false,
    pet_allergies: '',
    is_active: true,
    notes: '',
  });
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleChange = (field: keyof DoulaCreate, value: any) => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

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
      const cleanData: DoulaCreate = {
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

      await createDoula(cleanData);

      toast({
        title: 'Success',
        description: 'Doula created successfully',
      });

      // Reset form and close dialog
      setFormData({
        name_korean: '',
        name_english: '',
        name_preferred: '',
        date_of_birth: '',
        phone_number: '',
        email: '',
        legal_status: '',
        languages: '',
        service_area: '',
        start_year: undefined,
        has_tdap: false,
        has_mmr: false,
        has_varicella: false,
        has_hep_b: false,
        pet_allergies: '',
        is_active: true,
        notes: '',
      });
      setSelectedServiceAreas([]);
      setErrors({});
      setOpen(false);
      onDoulaCreated();
    } catch (error) {
      console.error('Error creating doula:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create doula',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New Doula
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-2xl flex-col overflow-hidden sm:max-h-[90vh] sm:w-full"
        onOpenAutoFocus={(event: Event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add New Doula</DialogTitle>
          <DialogDescription>
            Create a new doula profile. Fields marked with <span className="text-destructive">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-1 pb-4 pt-1">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_preferred">
                  Preferred Name {!formData.name_korean && !formData.name_english && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="name_preferred"
                  value={formData.name_preferred}
                  onChange={(e) => handleChange('name_preferred', e.target.value)}
                  placeholder="Cecilia"
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
                  placeholder="김미소"
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
                  placeholder="Miso Kim"
                />
                {errors.name_english && (
                  <p className="text-sm text-destructive">{errors.name_english}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
              />
              {errors.date_of_birth && (
                <p className="text-sm text-destructive">{errors.date_of_birth}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">
                  Phone Number
                </Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  placeholder="010-1234-5678"
                />
                {errors.phone_number && (
                  <p className="text-sm text-destructive">{errors.phone_number}</p>
                )}
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Professional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legal_status">
                  Legal Status
                </Label>
                <Select
                  value={formData.legal_status}
                  onValueChange={(value: string) => handleChange('legal_status', value)}
                >
                  <SelectTrigger id="legal_status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen">Citizen</SelectItem>
                    <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                    <SelectItem value="work_permit">Work Permit</SelectItem>
                  </SelectContent>
                </Select>
                {errors.legal_status && (
                  <p className="text-sm text-destructive">{errors.legal_status}</p>
                )}
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
                  placeholder="2020"
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
                          disabled={isDisabled}
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
                        <button
                          type="button"
                          onClick={() => handleServiceAreaToggle(area)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
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
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional information about the doula..."
              rows={3}
            />
          </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Doula'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
