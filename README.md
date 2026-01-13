# Postpartum Service Management Application

This repository contains a monorepo for a Postpartum Service Management application built with the following technologies:

- **Frontend**: React with Next.js and Tailwind CSS
- **Backend**: FastAPI
- **Database**: PostgreSQL

## Project Structure

```
postpartum-service-app
├── apps
│   ├── web                # Frontend application
│   └── api                # Backend application
├── packages
│   └── shared             # Shared types and interfaces
├── package.json           # Root package.json for monorepo
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Python (v3.7 or later)
- PostgreSQL

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd postpartum-service-app
   ```

2. **Install frontend dependencies:**

   Navigate to the `apps/web` directory and run:

   ```bash
   npm install
   ```

3. **Install backend dependencies:**

   Navigate to the `apps/api` directory and run:

   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start the PostgreSQL database.**

2. **Run the backend server:**

   Navigate to the `apps/api` directory and run:

   ```bash
   uvicorn app.main:app --reload
   ```

3. **Run the frontend application:**

   Navigate to the `apps/web` directory and run:

   ```bash
   npm run dev
   ```

### Accessing the Application

- The frontend will be available at `http://localhost:3000`.
- The backend API will be available at `http://localhost:8000`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License. See the LICENSE file for details.