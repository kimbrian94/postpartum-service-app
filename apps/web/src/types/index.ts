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