'use client';

import React, { useState, useEffect } from 'react';
import { Client, updateClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  AlertDialogTrigger,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Home, 
  Globe, 
  MessageSquare, 
  Briefcase,
} from 'lucide-react';

interface ClientDetailsDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (updatedClient: Partial<Client>) => void;
}

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="h-5 w-5 text-muted-foreground" />
    <h3 className="text-base font-semibold">{title}</h3>
  </div>
);

export function ClientDetailsDialog({
  client,
  open,
  onOpenChange,
  onUpdate,
}: ClientDetailsDialogProps) {
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (client && open) {
      // Reset form data to original client data when dialog opens
      setFormData(client);
      setErrors({});
    }
  }, [client, open]);

  useEffect(() => {
    // Reset form when dialog closes
    if (!open) {
      setErrors({});
      setIsSubmitting(false);
      setConfirmOpen(false);
    }
  }, [open]);

  const handleChange = (field: keyof Client, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleUpdate = async () => {
    if (!client?.id) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const updatedClient = await updateClient(client.id, formData);
      
      toast({
        title: 'Success',
        description: 'Client information updated successfully.',
        variant: 'success',
      });

      // Call parent's onUpdate callback if provided
      if (onUpdate) {
        onUpdate(updatedClient);
      }

      // Close dialog after successful update
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to update client:', error);
      
      // Handle validation errors from the server
      if (error.response?.status === 422) {
        const detail = error.response.data?.detail;
        
        if (typeof detail === 'string') {
          // Single error message (legacy format)
          toast({
            title: 'Validation Error',
            description: detail,
            variant: 'destructive',
          });
        } else if (detail?.errors && Array.isArray(detail.errors)) {
          // New structured error format with list of errors
          const fieldErrors: Record<string, string> = {};
          detail.errors.forEach((err: any) => {
            if (err.field && err.message) {
              fieldErrors[err.field] = err.message;
            }
          });
          setErrors(fieldErrors);
          
          toast({
            title: 'Validation Error',
            description: detail.message || 'Please fix the errors in the form.',
            variant: 'destructive',
          });
        } else if (Array.isArray(detail)) {
          // Pydantic validation errors (from schema validators)
          const fieldErrors: Record<string, string> = {};
          detail.forEach((err: any) => {
            const field = err.loc?.[err.loc.length - 1];
            if (field) {
              fieldErrors[field] = err.msg;
            }
          });
          setErrors(fieldErrors);
          
          toast({
            title: 'Validation Error',
            description: 'Please fix the errors in the form.',
            variant: 'destructive',
          });
        }
      } else if (error.response?.status === 404) {
        toast({
          title: 'Error',
          description: 'Client not found.',
          variant: 'destructive',
        });
      } else if (error.response?.status === 500) {
        toast({
          title: 'Server Error',
          description: error.response.data?.detail || 'An error occurred on the server.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update client. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <DialogTitle className="text-2xl">
            {client.name_english || client.name_korean || `Client #${client.id}`}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {client.email}
          </DialogDescription>
          
          <div className="space-y-2 pt-2">
            <Label htmlFor="current_status" className="text-base font-semibold">Current Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger id="current_status" className="w-full max-w-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_deposit">Pending Deposit</SelectItem>
                <SelectItem value="deposit_received">Deposit Received</SelectItem>
                <SelectItem value="full_payment_received">Full Payment Received</SelectItem>
                <SelectItem value="service_in_progress">Service In Progress</SelectItem>
                <SelectItem value="service_completed">Service Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <Separator />
        
        <ScrollArea className="max-h-[calc(90vh-220px)]">
          <div className="space-y-6 px-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <SectionHeader icon={User} title="Basic Information" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_english">Name (English)</Label>
                  <Input
                    id="name_english"
                    value={formData.name_english || ''}
                    onChange={(e) => handleChange('name_english', e.target.value)}
                    placeholder="Enter English name"
                    className={errors.name_english ? 'border-red-500' : ''}
                  />
                  {errors.name_english && <p className="text-sm text-red-500">{errors.name_english}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name_korean">Name (Korean)</Label>
                  <Input
                    id="name_korean"
                    value={formData.name_korean || ''}
                    onChange={(e) => handleChange('name_korean', e.target.value)}
                    placeholder="Enter Korean name"
                    className={errors.name_korean ? 'border-red-500' : ''}
                  />
                  {errors.name_korean && <p className="text-sm text-red-500">{errors.name_korean}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter email"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number || ''}
                    onChange={(e) => handleChange('phone_number', e.target.value)}
                    placeholder="Enter phone number"
                    className={errors.phone_number ? 'border-red-500' : ''}
                  />
                  {errors.phone_number && <p className="text-sm text-red-500">{errors.phone_number}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_language">Preferred Language</Label>
                <Input
                  id="preferred_language"
                  value={formData.preferred_language || ''}
                  onChange={(e) => handleChange('preferred_language', e.target.value)}
                  placeholder="Enter preferred language"
                />
              </div>
            </div>

            {/* Pregnancy & Delivery Information */}
            <div className="space-y-4">
              <SectionHeader icon={Calendar} title="Pregnancy & Delivery" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date?.split('T')[0] || ''}
                    onChange={(e) => handleChange('due_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="actual_delivery_date">Actual Delivery Date</Label>
                  <Input
                    id="actual_delivery_date"
                    type="date"
                    value={formData.actual_delivery_date?.split('T')[0] || ''}
                    onChange={(e) => handleChange('actual_delivery_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pregnancy_number">Pregnancy Number</Label>
                  <Input
                    id="pregnancy_number"
                    type="number"
                    value={formData.pregnancy_number || ''}
                    onChange={(e) => handleChange('pregnancy_number', parseInt(e.target.value) || undefined)}
                    placeholder="Enter pregnancy number"
                    className={errors.pregnancy_number ? 'border-red-500' : ''}
                  />
                  {errors.pregnancy_number && <p className="text-sm text-red-500">{errors.pregnancy_number}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_twins">Is Twins</Label>
                  <Select
                    value={formData.is_twins?.toString()}
                    onValueChange={(value) => handleChange('is_twins', value === 'true')}
                  >
                    <SelectTrigger id="is_twins">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <SectionHeader icon={MapPin} title="Address Information" />
              
              <div className="space-y-2">
                <Label htmlFor="residential_area">Residential Area</Label>
                <Input
                  id="residential_area"
                  value={formData.residential_area || ''}
                  onChange={(e) => handleChange('residential_area', e.target.value)}
                  placeholder="Enter residential area"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="home_address">Home Address</Label>
                <Textarea
                  id="home_address"
                  value={formData.home_address || ''}
                  onChange={(e) => handleChange('home_address', e.target.value)}
                  placeholder="Enter full home address"
                  rows={3}
                />
              </div>
            </div>

            {/* Household Information */}
            <div className="space-y-4">
              <SectionHeader icon={Home} title="Household Information" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="has_pets">Has Pets</Label>
                  <Select
                    value={formData.has_pets?.toString()}
                    onValueChange={(value) => handleChange('has_pets', value === 'true')}
                  >
                    <SelectTrigger id="has_pets">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="visitor_parking_available">Visitor Parking Available</Label>
                  <Select
                    value={formData.visitor_parking_available?.toString()}
                    onValueChange={(value) => handleChange('visitor_parking_available', value === 'true')}
                  >
                    <SelectTrigger id="visitor_parking_available">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="other_household_members">Other Household Members</Label>
                <Textarea
                  id="other_household_members"
                  value={formData.other_household_members || ''}
                  onChange={(e) => handleChange('other_household_members', e.target.value)}
                  placeholder="Enter other household members"
                  rows={2}
                />
              </div>
            </div>

            {/* Cultural & Food Preferences */}
            <div className="space-y-4">
              <SectionHeader icon={Globe} title="Cultural & Food Preferences" />
              
              <div className="space-y-2">
                <Label htmlFor="cultural_background">Cultural Background</Label>
                <Input
                  id="cultural_background"
                  value={formData.cultural_background || ''}
                  onChange={(e) => handleChange('cultural_background', e.target.value)}
                  placeholder="Enter cultural background"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="familiar_with_korean_food">Familiar with Korean Food</Label>
                  <Select
                    value={formData.familiar_with_korean_food?.toString()}
                    onValueChange={(value) => handleChange('familiar_with_korean_food', value === 'true')}
                  >
                    <SelectTrigger id="familiar_with_korean_food">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preferred_cuisine">Preferred Cuisine</Label>
                  <Input
                    id="preferred_cuisine"
                    value={formData.preferred_cuisine || ''}
                    onChange={(e) => handleChange('preferred_cuisine', e.target.value)}
                    placeholder="Enter preferred cuisine"
                  />
                </div>
              </div>
            </div>

            {/* Referral Information */}
            <div className="space-y-4">
              <SectionHeader icon={MessageSquare} title="Referral Information" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referral_source">Referral Source</Label>
                  <Input
                    id="referral_source"
                    value={formData.referral_source || ''}
                    onChange={(e) => handleChange('referral_source', e.target.value)}
                    placeholder="Enter referral source"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="referrer_name">Referrer Name</Label>
                  <Input
                    id="referrer_name"
                    value={formData.referrer_name || ''}
                    onChange={(e) => handleChange('referrer_name', e.target.value)}
                    placeholder="Enter referrer name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_platform">Contact Platform</Label>
                  <Input
                    id="contact_platform"
                    value={formData.contact_platform || ''}
                    onChange={(e) => handleChange('contact_platform', e.target.value)}
                    placeholder="Enter contact platform"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform_username">Platform Username</Label>
                  <Input
                    id="platform_username"
                    value={formData.platform_username || ''}
                    onChange={(e) => handleChange('platform_username', e.target.value)}
                    placeholder="Enter platform username"
                  />
                </div>
              </div>
            </div>

            {/* Service Information */}
            <div className="space-y-6">
              <SectionHeader icon={Briefcase} title="Service Information" />
              
              {/* Postpartum Care */}
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <h4 className="font-medium text-sm">Postpartum Care</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postpartum_care_requested">Care Requested</Label>
                    <Select
                      value={formData.postpartum_care_requested?.toString()}
                      onValueChange={(value) => handleChange('postpartum_care_requested', value === 'true')}
                    >
                      <SelectTrigger id="postpartum_care_requested">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postpartum_care_days_per_week">Days per Week</Label>
                    <Input
                      id="postpartum_care_days_per_week"
                      type="number"
                      value={formData.postpartum_care_days_per_week || ''}
                      onChange={(e) => handleChange('postpartum_care_days_per_week', parseInt(e.target.value) || undefined)}
                      placeholder="Enter days per week"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postpartum_care_weeks">Total Weeks</Label>
                    <Input
                      id="postpartum_care_weeks"
                      type="number"
                      value={formData.postpartum_care_weeks || ''}
                      onChange={(e) => handleChange('postpartum_care_weeks', parseInt(e.target.value) || undefined)}
                      placeholder="Enter number of weeks"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="night_nurse_requested">Night Nurse Requested</Label>
                    <Select
                      value={formData.night_nurse_requested?.toString()}
                      onValueChange={(value) => handleChange('night_nurse_requested', value === 'true')}
                    >
                      <SelectTrigger id="night_nurse_requested">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="night_nurse_weeks">Night Nurse Weeks</Label>
                    <Input
                      id="night_nurse_weeks"
                      type="number"
                      value={formData.night_nurse_weeks || ''}
                      onChange={(e) => handleChange('night_nurse_weeks', parseInt(e.target.value) || undefined)}
                      placeholder="Enter number of weeks"
                    />
                  </div>
                </div>
              </div>

              {/* Special Postpartum Massage */}
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <h4 className="font-medium text-sm">Special Postpartum Massage</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="special_massage_requested">Massage Requested</Label>
                    <Select
                      value={formData.special_massage_requested?.toString()}
                      onValueChange={(value) => handleChange('special_massage_requested', value === 'true')}
                    >
                      <SelectTrigger id="special_massage_requested">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="special_massage_sessions">Number of Sessions</Label>
                    <Input
                      id="special_massage_sessions"
                      type="number"
                      value={formData.special_massage_sessions || ''}
                      onChange={(e) => handleChange('special_massage_sessions', parseInt(e.target.value) || undefined)}
                      placeholder="Enter number of sessions"
                    />
                  </div>
                </div>
              </div>

              {/* Facial Massage */}
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <h4 className="font-medium text-sm">Facial Massage</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facial_massage_requested">Massage Requested</Label>
                    <Select
                      value={formData.facial_massage_requested?.toString()}
                      onValueChange={(value) => handleChange('facial_massage_requested', value === 'true')}
                    >
                      <SelectTrigger id="facial_massage_requested">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facial_massage_sessions">Number of Sessions</Label>
                    <Input
                      id="facial_massage_sessions"
                      type="number"
                      value={formData.facial_massage_sessions || ''}
                      onChange={(e) => handleChange('facial_massage_sessions', parseInt(e.target.value) || undefined)}
                      placeholder="Enter number of sessions"
                    />
                  </div>
                </div>
              </div>

              {/* RMT Massage */}
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <h4 className="font-medium text-sm">RMT Massage</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rmt_massage_requested">Massage Requested</Label>
                    <Select
                      value={formData.rmt_massage_requested?.toString()}
                      onValueChange={(value) => handleChange('rmt_massage_requested', value === 'true')}
                    >
                      <SelectTrigger id="rmt_massage_requested">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2 pt-2">
                <Label htmlFor="internal_notes">Internal Notes</Label>
                <Textarea
                  id="internal_notes"
                  value={formData.internal_notes || ''}
                  onChange={(e) => handleChange('internal_notes', e.target.value)}
                  placeholder="Enter internal notes"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button disabled={isSubmitting}>
                Save Changes
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Save changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will update the client record. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUpdate} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Yes, save'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
