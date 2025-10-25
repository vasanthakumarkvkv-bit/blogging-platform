// server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');

const app = express();

// Connect DB
connectDB(process.env.MONGODB_URI);

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);

// basic health
app.get('/', (req, res) => res.send('Blogging API is running'));

// Global error handler (simple)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));