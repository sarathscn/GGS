# GGS - Game Gear Swap

## Getting Started

This project requires MongoDB to be running on `localhost:27017`.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Database Setup
1. Open a terminal in the project root.
2. Run `docker-compose up -d` to start the MongoDB service.
3. Once the database is running, trigger the seed endpoint (one-time setup):
   ```powershell
   Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/seed
   ```

### Running the Application
- **Backend**: `cd backend && python -m uvicorn server:app --reload --port 8000`
- **Frontend**: `cd frontend && npm start`
