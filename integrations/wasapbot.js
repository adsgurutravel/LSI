/**
 * AmriTravel System - WasapBot Integration
 * 
 * This module integrates with the WasapBot API for automated WhatsApp messaging.
 * It provides functions to send messages, templates, and media files.
 */

// Import required modules
const axios = require('axios');

/**
 * WasapBot API client
 */
class WasapBotClient {
    /**
     * Create a new WasapBot client
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.WASAPBOT_API_KEY;
        this.baseUrl = config.baseUrl || 'https://api.wasapbot.my/api/v1';
        this.timeout = config.timeout || 10000; // 10 seconds
        
        // Validate API key
        if (!this.apiKey) {
            throw new Error('WasapBot API key is required');
        }
    }
    
    /**
     * Make an API request to WasapBot
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data (for POST and PUT requests)
     * @returns {Promise} A promise that resolves with the API response
     */
    async request(method, endpoint, data = null) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            
            const config = {
                method,
                url,
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                config.data = data;
            }
            
            const response = await axios(config);
            return response.data;
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                throw new Error(`WasapBot API error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
                // The request was made but no response was received
                throw new Error('WasapBot API error: No response received');
            } else {
                // Something happened in setting up the request that triggered an Error
                throw new Error(`WasapBot API error: ${error.message}`);
            }
        }
    }
    
    /**
     * Send a text message
     * @param {string} to - The recipient's phone number
     * @param {string} message - The message to send
     * @returns {Promise} A promise that resolves with the API response
     */
    async sendMessage(to, message) {
        return this.request('POST', '/send', {
            to,
            message
        });
    }
    
    /**
     * Send a template message
     * @param {string} to - The recipient's phone number
     * @param {string} templateId - The template ID
     * @param {Object} params - Template parameters
     * @returns {Promise} A promise that resolves with the API response
     */
    async sendTemplate(to, templateId, params = {}) {
        return this.request('POST', '/template', {
            to,
            template_id: templateId,
            params
        });
    }
    
    /**
     * Send an image
     * @param {string} to - The recipient's phone number
     * @param {string} imageUrl - The image URL
     * @param {string} caption - The image caption
     * @returns {Promise} A promise that resolves with the API response
     */
    async sendImage(to, imageUrl, caption = '') {
        return this.request('POST', '/media', {
            to,
            type: 'image',
            url: imageUrl,
            caption
        });
    }
    
    /**
     * Send a document
     * @param {string} to - The recipient's phone number
     * @param {string} documentUrl - The document URL
     * @param {string} filename - The document filename
     * @returns {Promise} A promise that resolves with the API response
     */
    async sendDocument(to, documentUrl, filename) {
        return this.request('POST', '/media', {
            to,
            type: 'document',
            url: documentUrl,
            filename
        });
    }
    
    /**
     * Get message status
     * @param {string} messageId - The message ID
     * @returns {Promise} A promise that resolves with the API response
     */
    async getMessageStatus(messageId) {
        return this.request('GET', `/status/${messageId}`);
    }
    
    /**
     * Get account information
     * @returns {Promise} A promise that resolves with the API response
     */
    async getAccountInfo() {
        return this.request('GET', '/account');
    }
}

/**
 * Create a WasapBot plugin for the AmriTravel plugin system
 * @param {Object} config - Plugin configuration
 * @returns {Object} The WasapBot plugin
 */
function createWasapBotPlugin(config = {}) {
    // Create a WasapBot client
    const client = new WasapBotClient(config);
    
    // Define the plugin
    const plugin = {
        name: 'wasapbot',
        
        /**
         * Initialize the plugin
         * @param {Object} pluginConfig - Plugin configuration
         */
        init: function(pluginConfig) {
            console.log('WasapBot plugin initialized');
        },
        
        /**
         * Clean up the plugin
         */
        cleanup: function() {
            console.log('WasapBot plugin cleaned up');
        },
        
        /**
         * Plugin hooks
         */
        hooks: {
            /**
             * Handle booking events
             * @param {Object} bookingData - The booking data
             * @returns {Object} The result of the hook
             */
            onBooking: async function(bookingData) {
                try {
                    // Prepare customer data
                    const customerName = `${bookingData['first-name']} ${bookingData['last-name']}`;
                    const customerPhone = bookingData.phone;
                    
                    if (!customerPhone) {
                        return {
                            success: false,
                            error: 'Customer phone number is missing'
                        };
                    }
                    
                    // Prepare message template
                    const message = `
Hello ${customerName},

Your car rental booking has been confirmed!

Booking Reference: ${bookingData.reference}
Vehicle: ${bookingData.vehicleName || 'Selected Vehicle'}
Pickup: ${bookingData.pickupDate} at ${bookingData.pickupLocation}
Return: ${bookingData.returnDate} at ${bookingData.returnLocation}

Thank you for choosing AmriTravel. If you have any questions, please reply to this message.
`;
                    
                    // Send message
                    const response = await client.sendMessage(customerPhone, message);
                    
                    return {
                        success: true,
                        messageId: response.message_id
                    };
                } catch (error) {
                    console.error('Error in WasapBot onBooking hook:', error);
                    return {
                        success: false,
                        error: error.message
                    };
                }
            },
            
            /**
             * Handle lead events
             * @param {Object} leadData - The lead data
             * @returns {Object} The result of the hook
             */
            onLead: async function(leadData) {
                try {
                    // Check if phone number is provided
                    if (!leadData.phone) {
                        return {
                            success: false,
                            error: 'Lead phone number is missing'
                        };
                    }
                    
                    // Prepare message template
                    const message = `
Hello ${leadData.name},

Thank you for contacting AmriTravel. We have received your inquiry and will get back to you shortly.

${leadData.subject ? `Regarding: ${leadData.subject}` : ''}

If you have any urgent questions, please reply to this message.

Best regards,
AmriTravel Team
`;
                    
                    // Send message
                    const response = await client.sendMessage(leadData.phone, message);
                    
                    return {
                        success: true,
                        messageId: response.message_id
                    };
                } catch (error) {
                    console.error('Error in WasapBot onLead hook:', error);
                    return {
                        success: false,
                        error: error.message
                    };
                }
            }
        },
        
        /**
         * Get the WasapBot client
         * @returns {WasapBotClient} The WasapBot client
         */
        getClient: function() {
            return client;
        }
    };
    
    return plugin;
}

// Export the WasapBot client and plugin creator
module.exports = {
    WasapBotClient,
    createWasapBotPlugin
};
