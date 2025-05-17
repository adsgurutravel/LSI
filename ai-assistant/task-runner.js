/**
 * AmriTravel System - AI Task Runner
 * 
 * This module provides automated task execution for the AI assistant,
 * including scheduled tasks, event-triggered tasks, and custom workflows.
 */

// Import required modules
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const ChatEngine = require('./chat-engine');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * AI Task Runner class
 */
class TaskRunner {
    /**
     * Create a new Task Runner
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = config;
        this.tasks = {};
        this.scheduledTasks = {};
        this.chatEngine = new ChatEngine(config.chatEngine);
        this.logFile = config.logFile || path.join(__dirname, 'logs.json');
        
        // Initialize logs
        this.initLogs();
        
        // Load tasks
        this.loadTasks();
    }
    
    /**
     * Initialize logs
     */
    initLogs() {
        try {
            // Check if log file exists
            if (!fs.existsSync(this.logFile)) {
                // Create empty logs
                fs.writeFileSync(this.logFile, JSON.stringify({
                    tasks: [],
                    errors: [],
                    system: []
                }, null, 2));
            }
        } catch (error) {
            console.error('Error initializing logs:', error);
        }
    }
    
    /**
     * Load tasks from configuration
     */
    loadTasks() {
        try {
            // Define built-in tasks
            this.registerTask('syncBookings', this.syncBookings.bind(this));
            this.registerTask('syncVehicles', this.syncVehicles.bind(this));
            this.registerTask('generateReports', this.generateReports.bind(this));
            this.registerTask('sendReminders', this.sendReminders.bind(this));
            this.registerTask('checkAvailability', this.checkAvailability.bind(this));
            this.registerTask('updatePricing', this.updatePricing.bind(this));
            
            // Schedule default tasks
            this.scheduleTask('syncBookings', '0 */2 * * *'); // Every 2 hours
            this.scheduleTask('syncVehicles', '0 */4 * * *'); // Every 4 hours
            this.scheduleTask('generateReports', '0 8 * * 1'); // Every Monday at 8 AM
            this.scheduleTask('sendReminders', '0 9 * * *'); // Every day at 9 AM
            this.scheduleTask('checkAvailability', '0 */6 * * *'); // Every 6 hours
            this.scheduleTask('updatePricing', '0 0 * * *'); // Every day at midnight
            
            this.log('system', 'Tasks loaded and scheduled successfully');
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.log('error', `Error loading tasks: ${error.message}`);
        }
    }
    
    /**
     * Register a task
     * @param {string} name - The task name
     * @param {Function} callback - The task callback function
     */
    registerTask(name, callback) {
        this.tasks[name] = callback;
        this.log('system', `Task registered: ${name}`);
    }
    
    /**
     * Schedule a task
     * @param {string} name - The task name
     * @param {string} schedule - The cron schedule expression
     */
    scheduleTask(name, schedule) {
        if (!this.tasks[name]) {
            throw new Error(`Task ${name} not registered`);
        }
        
        // Schedule the task
        this.scheduledTasks[name] = cron.schedule(schedule, async () => {
            try {
                this.log('tasks', `Starting scheduled task: ${name}`);
                await this.tasks[name]();
                this.log('tasks', `Completed scheduled task: ${name}`);
            } catch (error) {
                console.error(`Error executing task ${name}:`, error);
                this.log('error', `Error executing task ${name}: ${error.message}`);
            }
        });
        
        this.log('system', `Task scheduled: ${name} with schedule ${schedule}`);
    }
    
    /**
     * Run a task manually
     * @param {string} name - The task name
     * @param {Object} params - Task parameters
     * @returns {Promise} A promise that resolves with the task result
     */
    async runTask(name, params = {}) {
        if (!this.tasks[name]) {
            throw new Error(`Task ${name} not registered`);
        }
        
        try {
            this.log('tasks', `Starting manual task: ${name}`);
            const result = await this.tasks[name](params);
            this.log('tasks', `Completed manual task: ${name}`);
            return result;
        } catch (error) {
            console.error(`Error executing task ${name}:`, error);
            this.log('error', `Error executing task ${name}: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Log a message
     * @param {string} type - The log type (tasks, errors, system)
     * @param {string} message - The log message
     */
    log(type, message) {
        try {
            // Read current logs
            const logs = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
            
            // Add new log entry
            logs[type].push({
                timestamp: new Date().toISOString(),
                message
            });
            
            // Limit log size (keep last 1000 entries)
            if (logs[type].length > 1000) {
                logs[type] = logs[type].slice(-1000);
            }
            
            // Write updated logs
            fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2));
        } catch (error) {
            console.error('Error writing to log:', error);
        }
    }
    
    /**
     * Get logs
     * @param {string} type - The log type (tasks, errors, system)
     * @param {number} limit - The maximum number of logs to return
     * @returns {Array} The logs
     */
    getLogs(type, limit = 100) {
        try {
            // Read logs
            const logs = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
            
            // Return requested logs
            return logs[type] ? logs[type].slice(-limit) : [];
        } catch (error) {
            console.error('Error reading logs:', error);
            return [];
        }
    }
    
    /**
     * Sync bookings with external systems
     * @returns {Promise} A promise that resolves when the task is complete
     */
    async syncBookings() {
        try {
            // Get recent bookings from database
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) {
                throw new Error(error.message);
            }
            
            // Process each booking
            for (const booking of bookings) {
                // Check if booking needs to be synced with external systems
                if (!booking.synced_at || new Date(booking.synced_at) < new Date(booking.updated_at)) {
                    // Sync with CRM
                    await this.syncBookingWithCRM(booking);
                    
                    // Sync with vehicle availability system
                    await this.syncBookingWithVehicleSystem(booking);
                    
                    // Update booking sync status
                    await supabase
                        .from('bookings')
                        .update({ synced_at: new Date().toISOString() })
                        .eq('id', booking.id);
                }
            }
            
            return { success: true, message: `Synced ${bookings.length} bookings` };
        } catch (error) {
            console.error('Error syncing bookings:', error);
            throw error;
        }
    }
    
    /**
     * Sync a booking with CRM
     * @param {Object} booking - The booking data
     * @returns {Promise} A promise that resolves when the sync is complete
     */
    async syncBookingWithCRM(booking) {
        try {
            // Check if CRM integration is enabled
            const boostspaceApiKey = process.env.BOOSTSPACE_API_KEY;
            const flowluApiKey = process.env.FLOWLU_API_KEY;
            
            if (!boostspaceApiKey && !flowluApiKey) {
                console.log('CRM integration not configured');
                return;
            }
            
            // Prepare customer data
            const customerName = `${booking['first-name']} ${booking['last-name']}`;
            const customerEmail = booking.email;
            const customerPhone = booking.phone;
            
            // Sync with Boost.Space if configured
            if (boostspaceApiKey) {
                await axios.post('https://api.boost.space/v1/leads/sync', {
                    reference: booking.reference,
                    name: customerName,
                    email: customerEmail,
                    phone: customerPhone,
                    status: 'active',
                    notes: `Booking Reference: ${booking.reference}\nVehicle: ${booking.vehicleName || 'Selected Vehicle'}\nPickup: ${booking.pickupDate}\nReturn: ${booking.returnDate}`
                }, {
                    headers: {
                        'X-API-Key': boostspaceApiKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`Booking ${booking.reference} synced with Boost.Space`);
            }
            // Sync with Flowlu if configured
            else if (flowluApiKey) {
                await axios.post('https://api.flowlu.com/v1/crm/lead/update', {
                    reference: booking.reference,
                    contact_name: customerName,
                    contact_email: customerEmail,
                    contact_phone: customerPhone,
                    status: 'active',
                    description: `Booking Reference: ${booking.reference}\nVehicle: ${booking.vehicleName || 'Selected Vehicle'}\nPickup: ${booking.pickupDate}\nReturn: ${booking.returnDate}`
                }, {
                    headers: {
                        'X-API-Key': flowluApiKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`Booking ${booking.reference} synced with Flowlu`);
            }
        } catch (error) {
            console.error(`Error syncing booking ${booking.reference} with CRM:`, error);
            throw error;
        }
    }
    
    /**
     * Sync a booking with vehicle availability system
     * @param {Object} booking - The booking data
     * @returns {Promise} A promise that resolves when the sync is complete
     */
    async syncBookingWithVehicleSystem(booking) {
        try {
            // Check if vehicle integration is enabled
            const greenmatrixApiKey = process.env.GREENMATRIX_API_KEY;
            const rentsysApiKey = process.env.RENTSYS_API_KEY;
            
            if (!greenmatrixApiKey && !rentsysApiKey) {
                console.log('Vehicle integration not configured');
                return;
            }
            
            // Sync with Green Matrix if configured
            if (greenmatrixApiKey) {
                await axios.post('https://api.greenmatrix.com/v1/availability/sync', {
                    reference: booking.reference,
                    vehicle_id: booking.vehicleId,
                    start_date: booking.pickupDate,
                    end_date: booking.returnDate,
                    status: 'confirmed'
                }, {
                    headers: {
                        'X-API-Key': greenmatrixApiKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`Booking ${booking.reference} synced with Green Matrix`);
            }
            // Sync with Rentsys if configured
            else if (rentsysApiKey) {
                await axios.post('https://api.rentsys.com/v1/bookings/sync', {
                    reference: booking.reference,
                    vehicle_id: booking.vehicleId,
                    start_date: booking.pickupDate,
                    end_date: booking.returnDate,
                    status: 'confirmed',
                    customer_name: `${booking['first-name']} ${booking['last-name']}`,
                    customer_email: booking.email,
                    customer_phone: booking.phone
                }, {
                    headers: {
                        'X-API-Key': rentsysApiKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`Booking ${booking.reference} synced with Rentsys`);
            }
        } catch (error) {
            console.error(`Error syncing booking ${booking.reference} with vehicle system:`, error);
            throw error;
        }
    }
    
    /**
     * Sync vehicles with external systems
     * @returns {Promise} A promise that resolves when the task is complete
     */
    async syncVehicles() {
        // Implementation for syncing vehicles
        this.log('tasks', 'Vehicle sync not implemented yet');
        return { success: true, message: 'Vehicle sync not implemented yet' };
    }
    
    /**
     * Generate reports
     * @returns {Promise} A promise that resolves when the task is complete
     */
    async generateReports() {
        // Implementation for generating reports
        this.log('tasks', 'Report generation not implemented yet');
        return { success: true, message: 'Report generation not implemented yet' };
    }
    
    /**
     * Send reminders for upcoming bookings
     * @returns {Promise} A promise that resolves when the task is complete
     */
    async sendReminders() {
        // Implementation for sending reminders
        this.log('tasks', 'Reminder sending not implemented yet');
        return { success: true, message: 'Reminder sending not implemented yet' };
    }
    
    /**
     * Check vehicle availability
     * @returns {Promise} A promise that resolves when the task is complete
     */
    async checkAvailability() {
        // Implementation for checking availability
        this.log('tasks', 'Availability check not implemented yet');
        return { success: true, message: 'Availability check not implemented yet' };
    }
    
    /**
     * Update vehicle pricing
     * @returns {Promise} A promise that resolves when the task is complete
     */
    async updatePricing() {
        // Implementation for updating pricing
        this.log('tasks', 'Pricing update not implemented yet');
        return { success: true, message: 'Pricing update not implemented yet' };
    }
}

// Export the Task Runner class
module.exports = TaskRunner;
