/**
 * AmriTravel System - AI Assistant Dashboard API
 * 
 * This module provides API endpoints for the AI Assistant web dashboard,
 * allowing the frontend to interact with the chat engine and task runner.
 */

// Import required modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const ChatEngine = require('./chat-engine');
const TaskRunner = require('./task-runner');

// Create router
const router = express.Router();

// Initialize the chat engine and task runner
const chatEngine = new ChatEngine();
const taskRunner = new TaskRunner();

/**
 * Middleware to check if the user is authenticated
 */
function isAuthenticated(req, res, next) {
    // For demo purposes, we'll assume the user is authenticated
    // In a real implementation, this would check for a valid session
    
    // If not authenticated, redirect to login page
    // return res.redirect('/login');
    
    next();
}

/**
 * Serve the dashboard HTML
 */
router.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

/**
 * Get system information
 */
router.get('/api/system-info', isAuthenticated, (req, res) => {
    try {
        // Get package.json for version info
        const packageJson = require('../package.json');
        
        // Get system status
        const systemStatus = 'Online';
        
        // Get last update time from logs
        const logs = JSON.parse(fs.readFileSync(path.join(__dirname, 'logs.json'), 'utf8'));
        const lastUpdate = logs.system.length > 0 ? logs.system[0].timestamp : new Date().toISOString();
        
        res.json({
            version: packageJson.version || '1.0.0',
            status: systemStatus,
            lastUpdate
        });
    } catch (error) {
        console.error('Error getting system info:', error);
        res.status(500).json({ error: 'Failed to get system information' });
    }
});

/**
 * Get statistics
 */
router.get('/api/statistics', isAuthenticated, (req, res) => {
    try {
        // Get logs
        const logs = JSON.parse(fs.readFileSync(path.join(__dirname, 'logs.json'), 'utf8'));
        
        // Calculate statistics
        const activeTasks = Object.keys(taskRunner.scheduledTasks || {}).length;
        
        // Count completed tasks in the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const completedTasks = logs.tasks.filter(log => 
            log.message.startsWith('Completed') && 
            new Date(log.timestamp) > oneDayAgo
        ).length;
        
        // Calculate error rate
        const totalTaskRuns = logs.tasks.filter(log => 
            (log.message.startsWith('Starting') || log.message.startsWith('Completed')) && 
            new Date(log.timestamp) > oneDayAgo
        ).length;
        
        const errors = logs.errors.filter(log => 
            new Date(log.timestamp) > oneDayAgo
        ).length;
        
        const errorRate = totalTaskRuns > 0 ? ((errors / totalTaskRuns) * 100).toFixed(1) + '%' : '0%';
        
        // Count chat sessions
        const chatSessions = Object.keys(chatEngine.conversations || {}).length;
        
        res.json({
            activeTasks,
            completedTasks,
            errorRate,
            chatSessions
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

/**
 * Get recent errors
 */
router.get('/api/recent-errors', isAuthenticated, (req, res) => {
    try {
        // Get logs
        const logs = JSON.parse(fs.readFileSync(path.join(__dirname, 'logs.json'), 'utf8'));
        
        // Get recent errors (last 10)
        const recentErrors = logs.errors.slice(0, 10);
        
        res.json(recentErrors);
    } catch (error) {
        console.error('Error getting recent errors:', error);
        res.status(500).json({ error: 'Failed to get recent errors' });
    }
});

/**
 * Get chat history
 */
router.get('/api/chat-history/:conversationId', isAuthenticated, (req, res) => {
    try {
        const { conversationId } = req.params;
        
        // Get conversation
        const conversation = chatEngine.conversations[conversationId];
        
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        // Get messages
        const messages = conversation.messages.filter(msg => msg.role !== 'system');
        
        res.json(messages);
    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({ error: 'Failed to get chat history' });
    }
});

/**
 * Create a new conversation
 */
router.post('/api/conversations', isAuthenticated, (req, res) => {
    try {
        // Create a new conversation
        const conversationId = chatEngine.createConversation('general');
        
        res.json({ conversationId });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

/**
 * Send a message
 */
router.post('/api/send-message', isAuthenticated, async (req, res) => {
    try {
        const { conversationId, message } = req.body;
        
        if (!conversationId || !message) {
            return res.status(400).json({ error: 'Conversation ID and message are required' });
        }
        
        // Send message
        const response = await chatEngine.sendMessage(conversationId, message);
        
        res.json({ response });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

/**
 * Get tasks
 */
router.get('/api/tasks', isAuthenticated, (req, res) => {
    try {
        // Get tasks
        const tasks = Object.keys(taskRunner.tasks || {}).map(name => {
            const schedule = taskRunner.scheduledTasks[name] ? 
                taskRunner.scheduledTasks[name].cronTime.source : 
                'Not scheduled';
            
            return {
                name,
                schedule
            };
        });
        
        res.json(tasks);
    } catch (error) {
        console.error('Error getting tasks:', error);
        res.status(500).json({ error: 'Failed to get tasks' });
    }
});

/**
 * Run a task
 */
router.post('/api/run-task', isAuthenticated, async (req, res) => {
    try {
        const { taskName } = req.body;
        
        if (!taskName) {
            return res.status(400).json({ error: 'Task name is required' });
        }
        
        // Run task
        const result = await taskRunner.runTask(taskName);
        
        res.json({ result });
    } catch (error) {
        console.error('Error running task:', error);
        res.status(500).json({ error: 'Failed to run task' });
    }
});

/**
 * Get logs
 */
router.get('/api/logs/:type', isAuthenticated, (req, res) => {
    try {
        const { type } = req.params;
        
        // Get logs
        const logs = JSON.parse(fs.readFileSync(path.join(__dirname, 'logs.json'), 'utf8'));
        
        if (type === 'all') {
            // Combine all logs and sort by timestamp
            const allLogs = [
                ...logs.system.map(log => ({ ...log, type: 'system' })),
                ...logs.tasks.map(log => ({ ...log, type: 'tasks' })),
                ...logs.errors.map(log => ({ ...log, type: 'errors' }))
            ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return res.json(allLogs);
        }
        
        if (!logs[type]) {
            return res.status(400).json({ error: 'Invalid log type' });
        }
        
        // Add type to each log
        const typedLogs = logs[type].map(log => ({ ...log, type }));
        
        res.json(typedLogs);
    } catch (error) {
        console.error('Error getting logs:', error);
        res.status(500).json({ error: 'Failed to get logs' });
    }
});

/**
 * Get settings
 */
router.get('/api/settings', isAuthenticated, (req, res) => {
    try {
        // Get settings from chat engine
        const settings = {
            aiModel: chatEngine.model,
            maxTokens: chatEngine.maxTokens,
            temperature: chatEngine.temperature
        };
        
        res.json(settings);
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

/**
 * Save settings
 */
router.post('/api/settings', isAuthenticated, (req, res) => {
    try {
        const { aiModel, maxTokens, temperature } = req.body;
        
        // Update chat engine settings
        if (aiModel) chatEngine.model = aiModel;
        if (maxTokens) chatEngine.maxTokens = parseInt(maxTokens);
        if (temperature) chatEngine.temperature = parseFloat(temperature);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

module.exports = router;
