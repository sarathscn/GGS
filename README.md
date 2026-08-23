# GGS - Game Gear Swap (MERN Stack)

Kerala's premier marketplace for buying and selling gaming gear, built completely on the **MERN Stack** (MongoDB + Express.js + React.js + Node.js).

## Architecture

- **Database**: MongoDB with Mongoose ODM
- **Backend**: Node.js + Express.js REST API with WebSocket real-time chat support
- **Frontend**: React.js 19 with Tailwind CSS, Lucide React, and Radix UI

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (running on `localhost:27017` or via Docker)

### Database Setup
1. Start MongoDB:
   ```bash
   docker-compose up -d
   ```
2. Seed the database with initial categories, listings, and admin accounts (one-time setup):
   ```bash
   # In backend directory or via curl:
   curl -X POST http://localhost:8000/api/seed
   ```

### Running the Backend
```bash
cd backend
npm install
npm start # or npm run dev for nodemon hot-reloading
```
The Express backend server runs on `http://localhost:8000`.

### Running the Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```
The React frontend application runs on `http://localhost:3000`.

### Running Automated Tests
```bash
cd backend
npm test
```

## Administrator Account
- **Admin**: `admin@ggs.com` (Administrator role with access to Admin Control Center at `/admin`)
