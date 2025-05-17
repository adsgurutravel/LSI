/**
 * AmriTravel System - Rentsys Integration
 * 
 * This module integrates with the Rentsys API for fleet information and availability.
 * It provides functions to fetch vehicle data, check availability, and manage bookings.
 */

// Import required modules
const axios = require('axios');

/**
 * Rentsys API client
 */
class RentsysClient {
    /**
     * Create a new Rentsys client
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.RENTSYS_API_KEY;
        this.baseUrl = config.baseUrl || 'https://api.rentsys.com/v1';
        this.timeout = config.timeout || 10000; // 10 seconds
        
        // Validate API key
        if (!this.apiKey) {
            throw new Error('Rentsys API key is required');
        }
    }
    
    /**
     * Make an API request to Rentsys
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
                throw new Error(`Rentsys API error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
                // The request was made but no response was received
                throw new Error('Rentsys API error: No response received');
            } else {
                // Something happened in setting up the request that triggered an Error
                throw new Error(`Rentsys API error: ${error.message}`);
            }
        }
    }
    
    /**
     * Get all vehicles
     * @returns {Promise} A promise that resolves with the vehicles data
     */
    async getVehicles() {
        return this.request('GET', '/vehicles');
    }
    
    /**
     * Get a specific vehicle by ID
     * @param {string} vehicleId - The vehicle ID
     * @returns {Promise} A promise that resolves with the vehicle data
     */
    async getVehicle(vehicleId) {
        return this.request('GET', `/vehicles/${vehicleId}`);
    }
    
    /**
     * Check vehicle availability
     * @param {string} vehicleId - The vehicle ID
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise} A promise that resolves with the availability data
     */
    async checkAvailability(vehicleId, startDate, endDate) {
        return this.request('GET', `/availability?vehicle_id=${vehicleId}&start_date=${startDate}&end_date=${endDate}`);
    }
    
    /**
     * Create a booking
     * @param {Object} bookingData - The booking data
     * @returns {Promise} A promise that resolves with the booking data
     */
    async createBooking(bookingData) {
        return this.request('POST', '/bookings', bookingData);
    }
    
    /**
     * Update a booking
     * @param {string} bookingId - The booking ID
     * @param {Object} bookingData - The booking data to update
     * @returns {Promise} A promise that resolves with the updated booking data
     */
    async updateBooking(bookingId, bookingData) {
        return this.request('PUT', `/bookings/${bookingId}`, bookingData);
    }
    
    /**
     * Cancel a booking
     * @param {string} bookingId - The booking ID
     * @returns {Promise} A promise that resolves with the cancellation result
     */
    async cancelBooking(bookingId) {
        return this.request('DELETE', `/bookings/${bookingId}`);
    }
    
    /**
     * Get vehicle categories
     * @returns {Promise} A promise that resolves with the categories data
     */
    async getCategories() {
        return this.request('GET', '/categories');
    }
    
    /**
     * Get locations
     * @returns {Promise} A promise that resolves with the locations data
     */
    async getLocations() {
        return this.request('GET', '/locations');
    }
    
    /**
     * Search for vehicles with filters
     * @param {Object} filters - Search filters
     * @returns {Promise} A promise that resolves with the search results
     */
    async searchVehicles(filters = {}) {
        // Build query string from filters
        const queryParams = Object.entries(filters)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        
        return this.request('GET', `/vehicles/search?${queryParams}`);
    }
    
    /**
     * Get pricing for a vehicle
     * @param {string} vehicleId - The vehicle ID
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @param {Object} options - Additional options (e.g., location, extras)
     * @returns {Promise} A promise that resolves with the pricing data
     */
    async getPricing(vehicleId, startDate, endDate, options = {}) {
        const data = {
            vehicle_id: vehicleId,
            start_date: startDate,
            end_date: endDate,
            ...options
        };
        
        return this.request('POST', '/pricing', data);
    }
}

/**
 * Create a Rentsys plugin for the AmriTravel plugin system
 * @param {Object} config - Plugin configuration
 * @returns {Object} The Rentsys plugin
 */
function createRentsysPlugin(config = {}) {
    // Create a Rentsys client
    const client = new RentsysClient(config);
    
    // Define the plugin
    const plugin = {
        name: 'rentsys',
        
        /**
         * Initialize the plugin
         * @param {Object} pluginConfig - Plugin configuration
         */
        init: function(pluginConfig) {
            console.log('Rentsys plugin initialized');
        },
        
        /**
         * Clean up the plugin
         */
        cleanup: function() {
            console.log('Rentsys plugin cleaned up');
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
                    // Create a booking in Rentsys
                    const rentsysBooking = await client.createBooking({
                        vehicle_id: bookingData.vehicleId,
                        start_date: bookingData.pickupDate,
                        end_date: bookingData.returnDate,
                        customer_name: `${bookingData['first-name']} ${bookingData['last-name']}`,
                        customer_email: bookingData.email,
                        customer_phone: bookingData.phone,
                        reference: bookingData.reference
                    });
                    
                    return {
                        success: true,
                        rentsysBookingId: rentsysBooking.id
                    };
                } catch (error) {
                    console.error('Error in Rentsys onBooking hook:', error);
                    return {
                        success: false,
                        error: error.message
                    };
                }
            },
            
            /**
             * Handle vehicle update events
             * @param {Object} vehicleData - The vehicle data
             * @returns {Object} The result of the hook
             */
            onVehicleUpdate: async function(vehicleData) {
                try {
                    // Update vehicle data in Rentsys
                    // This would typically be used to sync vehicle data between systems
                    console.log('Vehicle update received:', vehicleData);
                    
                    return {
                        success: true,
                        message: 'Vehicle update processed'
                    };
                } catch (error) {
                    console.error('Error in Rentsys onVehicleUpdate hook:', error);
                    return {
                        success: false,
                        error: error.message
                    };
                }
            }
        },
        
        /**
         * Get the Rentsys client
         * @returns {RentsysClient} The Rentsys client
         */
        getClient: function() {
            return client;
        }
    };
    
    return plugin;
}

// Export the Rentsys client and plugin creator
module.exports = {
    RentsysClient,
    createRentsysPlugin
};
