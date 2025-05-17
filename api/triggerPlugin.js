/**
 * AmriTravel System - Plugin Trigger API Handler
 * 
 * This API handler allows triggering plugin hooks from external services
 * or scheduled tasks. It provides a way to integrate with the plugin system
 * for automation and third-party service integration.
 */

// Import required modules
const pluginManager = require('../plugin-manager');

/**
 * Main handler function for plugin triggers
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // Get trigger data from request body
        const { hook, data, apiKey } = req.body;
        
        // Validate API key
        if (!validateApiKey(apiKey)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Validate hook name
        if (!validateHook(hook)) {
            return res.status(400).json({ error: 'Invalid hook name' });
        }
        
        // Trigger the plugin hook
        const results = pluginManager.trigger(hook, data || {});
        
        // Return the results
        return res.status(200).json({
            success: true,
            hook,
            results
        });
    } catch (error) {
        console.error('Error triggering plugin:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Validate API key
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} True if the API key is valid
 */
function validateApiKey(apiKey) {
    // Get the valid API key from environment variables
    const validApiKey = process.env.AI_ASSISTANT_API_KEY;
    
    // If no API key is configured, reject all requests
    if (!validApiKey) {
        console.error('No API key configured');
        return false;
    }
    
    // Compare the provided API key with the valid one
    return apiKey === validApiKey;
}

/**
 * Validate hook name
 * @param {string} hook - The hook name to validate
 * @returns {boolean} True if the hook name is valid
 */
function validateHook(hook) {
    // Check if the hook name is provided
    if (!hook) {
        console.error('No hook name provided');
        return false;
    }
    
    // Check if the hook exists in the plugin manager
    const validHooks = [
        'onBooking',
        'onLead',
        'onPayment',
        'onMessage',
        'onAdTrack',
        'onTaskCreate',
        'onVehicleUpdate'
    ];
    
    return validHooks.includes(hook);
}
