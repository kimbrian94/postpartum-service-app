import { getAccessToken, refreshAccessToken } from './auth';
import { getApiBaseUrl } from './config';

const API_BASE_URL = getApiBaseUrl();

// Helper function to make authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('No access token available');
  }

  const authHeaders = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  let response = await fetch(url, {
    ...options,
    headers: authHeaders,
  });

  // If token expired, try to refresh and retry
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getAccessToken();
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    }
  }

  return response;
}

export interface Client {
  id: number;
  email: string;
  name_korean?: string;
  name_english?: string;
  due_date: string;
  actual_delivery_date?: string;
  residential_area?: string;
  home_address?: string;
  phone_number?: string;
  has_pets: boolean;
  visitor_parking_available: boolean;
  other_household_members?: string;
  pregnancy_number?: number;
  cultural_background?: string;
  familiar_with_korean_food: boolean;
  preferred_cuisine?: string;
  referral_source?: string;
  contact_platform?: string;
  platform_username?: string;
  referrer_name?: string;
  preferred_language?: string;
  night_nurse_weeks?: number;
  internal_notes?: string;
  // Intake denormalized fields
  is_twins: boolean;
  postpartum_care_requested: boolean;
  postpartum_care_days_per_week?: number;
  postpartum_care_weeks?: number;
  special_massage_requested: boolean;
  special_massage_sessions?: number;
  facial_massage_requested: boolean;
  facial_massage_sessions?: number;
  rmt_massage_requested: boolean;
  night_nurse_requested: boolean;
  status: 'pending_deposit' | 'deposit_received' | 'full_payment_received' | 'service_in_progress' | 'service_completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export type ClientCreate = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type ClientUpdate = Partial<ClientCreate>;

export interface DepositBreakdown {
  service: string;
  rate: number;
  quantity: number;
  unit: string;
  subtotal: number;
  notes?: string;
}

export interface DepositCalculation {
  client_id: number;
  client_name: string;
  total_service_cost: number;
  tax_amount: number;
  cash_price_tax_amount?: number;
  total_with_tax: number;
  total_cash_price?: number;
  deposit_percentage: number;
  deposit_amount: number;
  deposit_amount_cash_price?: number;
  remaining_balance: number;
  remaining_balance_cash_price?: number;
  breakdown: DepositBreakdown[];
  deposit_rule_applied: string;
  cash_price_eligible: boolean;
  cash_price_note?: string;
  calculated_at: string;
  admin_summary: string;
}

export interface DepositEmailPreview {
  subject: string;
  body: string;
}

export interface DepositResponse {
  calculation: DepositCalculation;
  email_preview: DepositEmailPreview;
  email_preview_korean: DepositEmailPreview;
}

export interface GetClientsParams {
  skip?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export async function getClients(params?: GetClientsParams): Promise<Client[]> {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);

  const url = `${API_BASE_URL}/api/clients/?${queryParams.toString()}`;
  
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch clients: ${response.statusText}`);
  }

  return response.json();
}

export async function getClient(id: number): Promise<Client> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/clients/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch client: ${response.statusText}`);
  }

  return response.json();
}

export async function updateClientStatus(id: number, status: string): Promise<Client> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/clients/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update client: ${response.statusText}`);
  }

  return response.json();
}

export async function createClient(payload: ClientCreate): Promise<Client> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/clients/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create client: ${response.statusText}`);
  }

  return response.json();
}

export async function updateClient(id: number, payload: ClientUpdate): Promise<Client> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const error: any = new Error(`Failed to update client: ${response.statusText}`);
    error.response = {
      status: response.status,
      data: errorData,
    };
    throw error;
  }

  return response.json();
}

export async function getDepositInfo(clientId: number): Promise<DepositResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/deposits/${clientId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch deposit info: ${response.statusText}`);
  }

  return response.json();
}
