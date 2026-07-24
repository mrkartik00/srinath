const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const { defaultLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const path = require('path');

// Register event listeners
require('./events/listeners/notificationEvents');
require('./events/listeners/appointmentEvents');
require('./events/listeners/prescriptionEvents');

const app = express();

// Trust proxy (behind nginx)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(
  cors({
    origin: [config.CLIENT_URL, config.ADMIN_URL, config.SUPER_ADMIN_URL, 'http://localhost:8081', 'http://localhost:19006'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api', defaultLimiter);

// Serve local static upload files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
