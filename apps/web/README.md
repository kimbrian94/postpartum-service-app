# Postpartum Service Management - Web UI Setup

## Installation

1. **Install dependencies**:
   ```bash
   cd apps/web
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your API URL (default: `http://localhost:8000`):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**: http://localhost:3000

## Features

### Clients Page (`/clients`)
- **Data Table**: Full client list with TanStack Table
- **Search**: Real-time client search by name or email
- **Sorting**: Sort by name, due date, and other columns
- **Pagination**: Navigate through large client lists
- **Status Badges**: Visual indicators for client status
- **Responsive**: Mobile-friendly design

### UI Components (shadcn/ui)
- Button
- Input
- Table
- Badge
- And more...

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI Library**: shadcn/ui
- **Table**: TanStack Table (React Table v8)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## API Integration

The frontend calls the FastAPI backend at `/clients/` endpoint:

```typescript
// Example API call
import { getClients } from '@/lib/api';

const clients = await getClients({
  skip: 0,
  limit: 100,
  status: 'service_in_progress',
  search: 'Kim'
});
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with navbar
│   │   ├── page.tsx          # Home page
│   │   ├── clients/
│   │   │   └── page.tsx      # Clients page
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   └── badge.tsx
│   │   ├── clients/
│   │   │   └── ClientsTable.tsx  # TanStack Table component
│   │   └── layout/
│   │       └── navbar.tsx    # Navigation bar
│   ├── lib/
│   │   ├── api.ts           # API client functions
│   │   └── utils.ts         # Utility functions
│   └── types/
│       └── index.ts         # TypeScript types
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Development

- Run dev server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`
- Lint code: `npm run lint`

## Notes

- Make sure the FastAPI backend is running on port 8000
- The API URL can be configured via the `NEXT_PUBLIC_API_URL` environment variable
- Client data is fetched on page load and can be refreshed with the refresh button
