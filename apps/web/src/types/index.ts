export type Appointment = {
  id: string;
  clientId: string;
  serviceId: string;
  date: string;
  time: string;
  notes?: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

// Doula types
export type Doula = {
  id: number;
  name_korean?: string;
  name_english?: string;
  name_preferred?: string;
  date_of_birth?: string;
  phone_number?: string;
  email?: string;
  legal_status?: string;
  languages?: string;
  service_area?: string;
  start_year?: number;
  has_tdap: boolean;
  has_mmr: boolean;
  has_varicella: boolean;
  has_hep_b: boolean;
  vaccination_status: string; // Computed field: fully_vaccinated, partially_vaccinated, not_vaccinated
  pet_allergies?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type DoulaCreate = {
  name_korean?: string;
  name_english?: string;
  name_preferred?: string;
  date_of_birth?: string;
  phone_number?: string;
  email?: string;
  legal_status?: string;
  languages?: string;
  service_area?: string;
  start_year?: number;
  has_tdap?: boolean;
  has_mmr?: boolean;
  has_varicella?: boolean;
  has_hep_b?: boolean;
  pet_allergies?: string;
  is_active?: boolean;
  notes?: string;
};

export type DoulaUpdate = {
  name_korean?: string;
  name_english?: string;
  name_preferred?: string;
  date_of_birth?: string;
  phone_number?: string;
  email?: string;
  legal_status?: string;
  languages?: string;
  service_area?: string;
  start_year?: number;
  has_tdap?: boolean;
  has_mmr?: boolean;
  has_varicella?: boolean;
  has_hep_b?: boolean;
  pet_allergies?: string;
  is_active?: boolean;
  notes?: string;
};

export type AvailableDoula = {
  id: number;
  name_korean?: string;
  name_english?: string;
  name_preferred?: string;
  phone_number?: string;
  email?: string;
  is_available: boolean;
};

// Assignment types
export type AssignmentStatus = "in_progress" | "completed" | "cancelled";
export type SwitchCategory =
  | "client_request"
  | "doula_unavailable"
  | "performance_issue"
  | "mutual_agreement"
  | "scheduling_conflict"
  | "personality_mismatch"
  | "language_barrier"
  | "other";

export type Assignment = {
  id: number;
  client_id: number;
  doula_id: number;
  current_doula_id?: number;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  service_type: string;
  days_per_week?: number;
  total_weeks?: number;
  status: AssignmentStatus;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
};

export type AssignmentCreate = {
  client_id: number;
  doula_id: number;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  service_type?: string;
  days_per_week?: number;
  total_weeks?: number;
  status?: AssignmentStatus;
  notes?: string;
};

export type AssignmentUpdate = {
  doula_id?: number;
  current_doula_id?: number;
  start_date?: string;
  end_date?: string;
  service_type?: string;
  days_per_week?: number;
  total_weeks?: number;
  status?: AssignmentStatus;
  notes?: string;
  cancellation_reason?: string;
};

export type ClientSummary = {
  id: number;
  name_korean?: string;
  name_english?: string;
  email: string;
  phone_number?: string;
  due_date?: string;
};

export type DoulaSummary = {
  id: number;
  name_korean?: string;
  name_english?: string;
  name_preferred?: string;
  phone_number?: string;
  email?: string;
};

export type AssignmentDoulaHistory = {
  id: number;
  assignment_id: number;
  doula_id: number;
  start_date: string;
  end_date?: string;
  switch_reason?: string;
  switch_category?: SwitchCategory;
  notes?: string;
  created_at: string;
  created_by?: string;
  doula: DoulaSummary;
};

export type AssignmentDoulaSwitchRequest = {
  new_doula_id: number;
  effective_start_date: string;
  switch_reason: string;
  switch_category: SwitchCategory;
  notes?: string;
  created_by?: string;
};

export type AssignmentWithDetails = Assignment & {
  client: ClientSummary;
  doula: DoulaSummary;
  current_doula?: DoulaSummary;
  doula_history?: AssignmentDoulaHistory[];
};

// Calendar event type extending Assignment
export type CalendarEvent = AssignmentWithDetails & {
  title: string; // Computed for calendar display
  start: string; // ISO date string for FullCalendar
  end: string; // ISO date string for FullCalendar
};
