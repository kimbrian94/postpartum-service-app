export const SERVICE_AREAS = [
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

export const RESIDENTIAL_AREAS = SERVICE_AREAS.filter((area) => area !== 'All Areas');

export const LEGAL_STATUS_OPTIONS = [
  { value: 'citizen', label: 'Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident' },
  { value: 'work_permit', label: 'Work Permit' },
] as const;

export const VACCINATION_STATUS_OPTIONS = [
  { value: 'fully_vaccinated', label: 'Fully vaccinated' },
  { value: 'partially_vaccinated', label: 'Partially vaccinated' },
  { value: 'not_vaccinated', label: 'Not vaccinated' },
] as const;

export const ACTIVE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;
