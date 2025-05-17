/**
 * AmriTravel System - Supabase Integration
 * 
 * This script handles data storage and retrieval using Supabase.
 * It provides functions for saving bookings, user data, and other information.
 */

(function() {
    // Initialize Supabase client
    let supabaseClient = null;
    
    // Supabase tables
    const TABLES = {
        BOOKINGS: 'bookings',
        USERS: 'users',
        VEHICLES: 'vehicles',
        LEADS: 'leads',
        CONTACTS: 'contacts',
        REVIEWS: 'reviews'
    };
    
    // Supabase integration module
    const SupabaseManager = {
        /**
         * Initialize the Supabase client
         */
        init: async function() {
            try {
                // Load Supabase JS library if not already loaded
                if (typeof supabase === 'undefined') {
                    await this.loadSupabaseLibrary();
                }
                
                // Get Supabase credentials from environment variables or config
                const supabaseUrl = process.env.SUPABASE_URL || '';
                const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
                
                if (!supabaseUrl || !supabaseKey) {
                    console.error('Supabase credentials not found');
                    return false;
                }
                
                // Initialize Supabase client
                supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
                
                console.log('Supabase client initialized successfully');
                return true;
            } catch (error) {
                console.error('Error initializing Supabase client:', error);
                return false;
            }
        },
        
        /**
         * Load Supabase JS library dynamically
         * @returns {Promise} A promise that resolves when the library is loaded
         */
        loadSupabaseLibrary: function() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        },
        
        /**
         * Save booking data to Supabase
         * @param {Object} bookingData - The booking data to save
         * @returns {Promise} A promise that resolves with the saved booking data
         */
        saveBooking: async function(bookingData) {
            try {
                if (!supabaseClient) {
                    await this.init();
                }
                
                // Generate a booking reference
                bookingData.reference = this.generateBookingReference();
                bookingData.created_at = new Date().toISOString();
                
                // Add UTM data if available
                const utmData = JSON.parse(localStorage.getItem('utmData') || '{}');
                if (Object.keys(utmData).length > 0) {
                    bookingData.utm_source = utmData.source || '';
                    bookingData.utm_medium = utmData.medium || '';
                    bookingData.utm_campaign = utmData.campaign || '';
                }
                
                // Insert booking data into Supabase
                const { data, error } = await supabaseClient
                    .from(TABLES.BOOKINGS)
                    .insert(bookingData)
                    .select();
                
                if (error) {
                    console.error('Error saving booking data:', error);
                    return { success: false, error: error.message };
                }
                
                console.log('Booking saved successfully:', data);
                
                // Trigger webhook for booking notification
                this.triggerBookingWebhook(data[0]);
                
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('Error in saveBooking:', error);
                return { success: false, error: error.message };
            }
        },
        
        /**
         * Generate a unique booking reference
         * @returns {string} A unique booking reference
         */
        generateBookingReference: function() {
            const prefix = 'AT-';
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `${prefix}${timestamp}${random}`;
        },
        
        /**
         * Trigger webhook for booking notification
         * @param {Object} bookingData - The booking data
         */
        triggerBookingWebhook: async function(bookingData) {
            try {
                // Call the booking webhook
                const response = await fetch('/api/onBooking', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(bookingData)
                });
                
                if (!response.ok) {
                    throw new Error('Webhook call failed');
                }
                
                console.log('Booking webhook triggered successfully');
            } catch (error) {
                console.error('Error triggering booking webhook:', error);
            }
        },
        
        /**
         * Save lead data to Supabase
         * @param {Object} leadData - The lead data to save
         * @returns {Promise} A promise that resolves with the saved lead data
         */
        saveLead: async function(leadData) {
            try {
                if (!supabaseClient) {
                    await this.init();
                }
                
                leadData.created_at = new Date().toISOString();
                
                // Add UTM data if available
                const utmData = JSON.parse(localStorage.getItem('utmData') || '{}');
                if (Object.keys(utmData).length > 0) {
                    leadData.utm_source = utmData.source || '';
                    leadData.utm_medium = utmData.medium || '';
                    leadData.utm_campaign = utmData.campaign || '';
                }
                
                // Insert lead data into Supabase
                const { data, error } = await supabaseClient
                    .from(TABLES.LEADS)
                    .insert(leadData)
                    .select();
                
                if (error) {
                    console.error('Error saving lead data:', error);
                    return { success: false, error: error.message };
                }
                
                console.log('Lead saved successfully:', data);
                
                // Trigger webhook for lead notification
                this.triggerLeadWebhook(data[0]);
                
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('Error in saveLead:', error);
                return { success: false, error: error.message };
            }
        },
        
        /**
         * Trigger webhook for lead notification
         * @param {Object} leadData - The lead data
         */
        triggerLeadWebhook: async function(leadData) {
            try {
                // Call the lead webhook
                const response = await fetch('/api/onLead', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(leadData)
                });
                
                if (!response.ok) {
                    throw new Error('Webhook call failed');
                }
                
                console.log('Lead webhook triggered successfully');
            } catch (error) {
                console.error('Error triggering lead webhook:', error);
            }
        },
        
        /**
         * Save contact form data to Supabase
         * @param {Object} contactData - The contact form data to save
         * @returns {Promise} A promise that resolves with the saved contact data
         */
        saveContact: async function(contactData) {
            try {
                if (!supabaseClient) {
                    await this.init();
                }
                
                contactData.created_at = new Date().toISOString();
                
                // Insert contact data into Supabase
                const { data, error } = await supabaseClient
                    .from(TABLES.CONTACTS)
                    .insert(contactData)
                    .select();
                
                if (error) {
                    console.error('Error saving contact data:', error);
                    return { success: false, error: error.message };
                }
                
                console.log('Contact form data saved successfully:', data);
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('Error in saveContact:', error);
                return { success: false, error: error.message };
            }
        },
        
        /**
         * Get vehicles from Supabase
         * @param {Object} filters - Filters for the vehicles query
         * @returns {Promise} A promise that resolves with the vehicles data
         */
        getVehicles: async function(filters = {}) {
            try {
                if (!supabaseClient) {
                    await this.init();
                }
                
                let query = supabaseClient
                    .from(TABLES.VEHICLES)
                    .select('*');
                
                // Apply filters if provided
                if (filters.category) {
                    query = query.eq('category', filters.category);
                }
                
                if (filters.minPassengers) {
                    query = query.gte('passengers', filters.minPassengers);
                }
                
                if (filters.maxPrice) {
                    query = query.lte('price', filters.maxPrice);
                }
                
                // Execute the query
                const { data, error } = await query;
                
                if (error) {
                    console.error('Error fetching vehicles:', error);
                    return { success: false, error: error.message };
                }
                
                return { success: true, data };
            } catch (error) {
                console.error('Error in getVehicles:', error);
                return { success: false, error: error.message };
            }
        },
        
        /**
         * Get a specific vehicle by ID
         * @param {string} vehicleId - The vehicle ID
         * @returns {Promise} A promise that resolves with the vehicle data
         */
        getVehicleById: async function(vehicleId) {
            try {
                if (!supabaseClient) {
                    await this.init();
                }
                
                const { data, error } = await supabaseClient
                    .from(TABLES.VEHICLES)
                    .select('*')
                    .eq('id', vehicleId)
                    .single();
                
                if (error) {
                    console.error('Error fetching vehicle:', error);
                    return { success: false, error: error.message };
                }
                
                return { success: true, data };
            } catch (error) {
                console.error('Error in getVehicleById:', error);
                return { success: false, error: error.message };
            }
        }
    };
    
    // Expose the Supabase manager to the global scope
    window.SupabaseManager = SupabaseManager;
})();
