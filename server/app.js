    const express = require('express');
    const cors = require('cors');
    const connectDB = require('./config/db');
    const { authenticateToken } = require('./middleware/auth');
    const errorHandler = require('./middleware/errorHandler');

    const app = express();

    // Connect to database
    connectDB();

    // Middleware
    app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
    }));
    app.use(express.json());
    app.use('/uploads', express.static('uploads'));

    // Routes
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/user', require('./routes/userRoutes'));
    app.use('/api/rooms', require('./routes/roomRoutes'));
    app.use('/api/messages', require('./routes/messageRoutes'));
    app.use('/api/upload', require('./routes/uploadRoutes'));

    // Health check
    app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
    });

    // Error handling
    app.use(errorHandler);

    module.exports = app;