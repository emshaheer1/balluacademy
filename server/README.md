# Ball U Academy – API server (MongoDB)

Express API used by the React frontend for customers, orders, stats, and admin dashboard.

## Prerequisites

- **Node.js** 18+
- **MongoDB** running locally or a connection string (e.g. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

## Setup

1. Install dependencies:

   ```bash
   cd server
   npm install
   ```

2. Copy environment file and set your MongoDB URI and JWT secret:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   - `MONGODB_URI` – e.g. `mongodb://127.0.0.1:27017/ballu` or your Atlas URI
   - `JWT_SECRET` – a long random string for admin JWT signing
   - `PORT` – optional, default `3001`
   - `GOOGLE_APPLICATION_CREDENTIALS` – (optional) path to Firebase service account JSON for Google Sign-In. Download from [Firebase Console](https://console.firebase.google.com) → Project settings → Service accounts → Generate new private key.

## Run

```bash
npm start
```

Or with auto-restart on file changes:

```bash
npm run dev
```

Server runs at **http://localhost:3001** (or your `PORT`).

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Customer sign up (name, email, password) |
| POST | `/api/auth/login` | Customer login (email, password) |
| POST | `/api/auth/google` | Customer sign-in with Google (body: `{ idToken }`). Requires Firebase Admin; set `GOOGLE_APPLICATION_CREDENTIALS` to your service account JSON path. |
| PATCH | `/api/customers/profile` | Update customer (email, address, name, avatarUrl) |
| POST | `/api/orders` | Create order (checkout) |
| GET | `/api/orders?email=...` | List orders (optional filter by customer email) |
| POST | `/api/stats/visit` | Record a site visit |
| GET | `/api/stats` | Get stats (totalVisits, etc.) |
| POST | `/api/admin/signup` | Admin sign up |
| POST | `/api/admin/login` | Admin login (returns JWT) |
| GET | `/api/admin/customers` | List all customers (admin JWT required) |
| GET | `/api/admin/orders` | List all orders (admin JWT required) |
| GET | `/api/admin/stats` | Get stats (admin JWT required) |

Admin routes require header: `Authorization: Bearer <token>`.

## Frontend

Point the frontend at this API by setting:

```env
VITE_API_URL=http://localhost:3001
```

in the **client** project root (e.g. `client/.env`). Then run the Vite dev server from `client/` and use the store; data will be stored in MongoDB and shown on the admin dashboard.
