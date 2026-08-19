const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRouter = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive CORS for development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploaded files
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/api/uploads', express.static(uploadsPath));

// Mount main API router
app.use('/api', apiRouter);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'GGS (Game Gear Swap) Express Backend Running', version: '2.0' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
