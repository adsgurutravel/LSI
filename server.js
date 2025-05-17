/**
 * AmriTravel System - Local Development Server
 * 
 * This script provides a local development server for the AmriTravel system,
 * serving static files and API endpoints.
 */

// Import required modules
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const dashboardApi = require('./ai-assistant/dashboard-api');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'pages')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/ai-assistant', express.static(path.join(__dirname, 'ai-assistant')));

// API routes
app.use('/api/booking', require('./api/onBooking'));
app.use('/api/lead', require('./api/onLead'));
app.use('/api/plugin', require('./api/triggerPlugin'));

// Dashboard API routes
app.use('/admin/dashboard', dashboardApi);

// Route handlers
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.get('/booking', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'booking.html'));
});

app.get('/car', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'car.html'));
});

app.get('/thankyou', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'thankyou.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'contact.html'));
});

app.get('/admin', (req, res) => {
    res.redirect('/admin/dashboard');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
