# Postpartum Service Management API

## Setup Instructions

### 1. Install Dependencies

```bash
cd apps/api
pip install -r requirements.txt
```

### 2. Configure Database

Create a `.env` file in `apps/api/` directory:

```bash
cp .env.example .env
```

Update the `.env` file with your PostgreSQL credentials:

```
DATABASE_URL=postgresql://username:password@localhost:5432/postpartum_service
```

### 3. Initialize Database

Run the SQL initialization script:

```bash
psql -U your_username -d postpartum_service -f resources/init_db.sql
```

Or if you're using Docker:

```bash
docker-compose up -d
# Then connect to the database and run the init script
```

### 4. Run the Server

```bash
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

Interactive API documentation (Swagger UI): `http://localhost:8000/docs`

## API Endpoints

### Clients

#### Get All Clients
```
GET /clients/
```

Query Parameters:
- `skip` (int, default: 0): Number of records to skip (pagination)
- `limit` (int, default: 100, max: 1000): Maximum records to return
- `status` (string, optional): Filter by client status
  - `pending_deposit`
  - `deposit_received`
  - `full_payment_received`
  - `service_in_progress`
  - `service_completed`
  - `cancelled`
- `search` (string, optional): Search by name or email

Example:
```bash
curl "http://localhost:8000/clients/?status=pending_deposit&limit=10"
```

#### Get Single Client
```
GET /clients/{client_id}
```

Example:
```bash
curl "http://localhost:8000/clients/1"
```

#### Create Client
```
POST /clients/
```

Example:
```bash
curl -X POST "http://localhost:8000/clients/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "name_korean": "김민지",
    "name_english": "Minji Kim",
    "due_date": "2026-03-15",
    "phone_number": "647-123-4567",
    "residential_area": "Toronto",
    "home_address": "123 Main St, Toronto, ON",
    "status": "pending_deposit"
  }'
```

#### Update Client
```
PATCH /clients/{client_id}
```

Example:
```bash
curl -X PATCH "http://localhost:8000/clients/1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "deposit_received",
    "actual_delivery_date": "2026-03-10"
  }'
```

#### Delete Client
```
DELETE /clients/{client_id}
```

Example:
```bash
curl -X DELETE "http://localhost:8000/clients/1"
```

## Testing with Frontend

### React/Next.js Integration

Example API service file (`src/services/api.ts`):

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  status: string;
  // ... other fields
}

export async function getClients(params?: {
  skip?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<Client[]> {
  const queryParams = new URLSearchParams();
  if (params?.skip) queryParams.append('skip', params.skip.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);

  const response = await fetch(
    `${API_BASE_URL}/clients/?${queryParams.toString()}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }
  
  return response.json();
}

export async function getClient(id: number): Promise<Client> {
  const response = await fetch(`${API_BASE_URL}/clients/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch client');
  }
  
  return response.json();
}
```

Example React component usage:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getClients, Client } from '@/services/api';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const data = await getClients({ limit: 50 });
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Clients</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.name_english || client.name_korean}</td>
              <td>{client.email}</td>
              <td>{client.due_date}</td>
              <td>{client.status}</td>
              <td>{client.phone_number}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Status Values

The `status` field tracks the client's journey through the service lifecycle:

- `pending_deposit`: Initial state, waiting for deposit
- `deposit_received`: Deposit has been received
- `full_payment_received`: Full payment completed
- `service_in_progress`: Currently receiving services
- `service_completed`: Services have been completed
- `cancelled`: Service was cancelled

## Development Notes

- CORS is enabled for all origins in development. Update `main.py` for production.
- The API uses SQLAlchemy ORM with PostgreSQL.
- All timestamps are stored in UTC.
- Pagination is implemented with `skip` and `limit` parameters.
- Search functionality is case-insensitive.
