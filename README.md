# Payroll Management System

Simple payroll and employee management system built with React (Vite) on the frontend and Node.js/Express + MySQL on the backend.

This project covers day-to-day HR/payroll work:

- employee records
- attendance tracking
- payroll generation
- reporting dashboard
- admin profile management

## Tech Stack

**Frontend**
- React
- Vite
- Axios
- Chart.js
- Tailwind CSS

**Backend**
- Node.js
- Express
- Sequelize
- MySQL
- JWT auth

## Project Structure

```text
Payroll Management System/
  backend/     -> REST API + database models
  frontend/    -> React web app
```

## Prerequisites

- Node.js (recommended: v18+)
- npm
- MySQL server running locally or remotely

## Backend Setup

1. Go to backend folder:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `backend/config.env` file:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=payroll_management
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   JWT_SECRET=change_this_secret
   JWT_EXPIRE=7d
   PORT=3000
   NODE_ENV=development
   ```

4. Create database:

   ```sql
   CREATE DATABASE payroll_management;
   ```

5. Start backend server:

   ```bash
   npm run dev
   ```

Backend API base URL:

```text
http://localhost:3000/api/v1
```

Health check:

```text
http://localhost:3000/health
```

## Frontend Setup

1. Open a new terminal and go to frontend folder:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. (Optional) Create `frontend/.env`:

   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

   If not set, frontend uses `http://localhost:3000/api/v1` by default.

4. Start frontend:

   ```bash
   npm run dev
   ```

Vite dev server usually runs on:

```text
http://localhost:5173
```

## Main API Routes

- `/api/v1/admin`
- `/api/v1/employees`
- `/api/v1/attendance`
- `/api/v1/payroll`
- `/api/v1/reports`
- `/api/v1/dashboard`

## Default Run (Quick Start)

From project root, open two terminals:

**Terminal 1**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2**
```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in browser.

## Notes

- Backend uses Sequelize and connects on startup.
- Keep your `config.env` private and do not commit real secrets.
- Uploaded profile images are saved under `backend/uploads/`.

## License

MIT
