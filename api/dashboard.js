/**
 * AmriTravel System - Dashboard API Handler for Vercel
 * 
 * This API handler serves the AI Assistant dashboard and its API endpoints
 * when deployed to Vercel.
 */

// Import required modules
const express = require('express');
const serverless = require('serverless-http');
const dashboardApi = require('../ai-assistant/dashboard-api');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use dashboard API routes
app.use('/', dashboardApi);

// Export the serverless handler
module.exports = serverless(app);
