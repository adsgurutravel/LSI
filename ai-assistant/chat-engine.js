/**
 * AmriTravel System - AI Chat Engine
 * 
 * This module provides an AI-powered chatbot for admin use, allowing
 * management of bookings, vehicles, and marketing campaigns.
 */

// Import required modules
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * AI Chat Engine class
 */
class ChatEngine {
    /**
     * Create a new Chat Engine
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.AI_ASSISTANT_API_KEY;
        this.model = config.model || process.env.AI_ASSISTANT_MODEL || 'gpt-4';
        this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
        this.maxTokens = config.maxTokens || 2000;
        this.temperature = config.temperature || 0.7;
        
        // Chat history storage
        this.conversations = {};
        
        // Load system prompts
        this.systemPrompts = this.loadSystemPrompts();
        
        // Initialize integrations
        this.initIntegrations();
    }
    
    /**
     * Load system prompts from files
     * @returns {Object} The system prompts
     */
    loadSystemPrompts() {
        try {
            const promptsDir = path.join(__dirname, 'prompts');
            const prompts = {};
            
            // Check if prompts directory exists
            if (fs.existsSync(promptsDir)) {
                // Read all prompt files
                const files = fs.readdirSync(promptsDir);
                
                for (const file of files) {
                    if (file.endsWith('.txt')) {
                        const name = file.replace('.txt', '');
                        const content = fs.readFileSync(path.join(promptsDir, file), 'utf8');
                        prompts[name] = content;
                    }
                }
            } else {
                // Use default prompts if directory doesn't exist
                prompts.booking = 'You are an AI assistant for AmriTravel, a car rental service. Help with booking management.';
                prompts.vehicle = 'You are an AI assistant for AmriTravel, a car rental service. Help with vehicle management.';
                prompts.marketing = 'You are an AI assistant for AmriTravel, a car rental service. Help with marketing campaigns.';
                prompts.general = 'You are an AI assistant for AmriTravel, a car rental service. Provide helpful information.';
            }
            
            return prompts;
        } catch (error) {
            console.error('Error loading system prompts:', error);
            
            // Return default prompts on error
            return {
                booking: 'You are an AI assistant for AmriTravel, a car rental service. Help with booking management.',
                vehicle: 'You are an AI assistant for AmriTravel, a car rental service. Help with vehicle management.',
                marketing: 'You are an AI assistant for AmriTravel, a car rental service. Help with marketing campaigns.',
                general: 'You are an AI assistant for AmriTravel, a car rental service. Provide helpful information.'
            };
        }
    }
    
    /**
     * Initialize integrations with other services
     */
    initIntegrations() {
        // This would typically connect to other services like CRM, booking system, etc.
        console.log('Initializing AI assistant integrations');
    }
    
    /**
     * Create a new conversation
     * @param {string} userId - The user ID
     * @param {string} systemPrompt - The system prompt to use
     * @returns {string} The conversation ID
     */
    createConversation(userId, systemPrompt = 'general') {
        // Generate a conversation ID
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Get the system prompt content
        const systemPromptContent = this.systemPrompts[systemPrompt] || this.systemPrompts.general;
        
        // Initialize the conversation
        this.conversations[conversationId] = {
            userId,
            messages: [
                { role: 'system', content: systemPromptContent }
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        return conversationId;
    }
    
    /**
     * Get a conversation by ID
     * @param {string} conversationId - The conversation ID
     * @returns {Object} The conversation
     */
    getConversation(conversationId) {
        return this.conversations[conversationId];
    }
    
    /**
     * Add a message to a conversation
     * @param {string} conversationId - The conversation ID
     * @param {string} role - The message role (user, assistant, system)
     * @param {string} content - The message content
     */
    addMessage(conversationId, role, content) {
        const conversation = this.conversations[conversationId];
        
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }
        
        conversation.messages.push({ role, content });
        conversation.updated_at = new Date().toISOString();
    }
    
    /**
     * Send a message and get a response
     * @param {string} conversationId - The conversation ID
     * @param {string} message - The user message
     * @returns {Promise} A promise that resolves with the assistant's response
     */
    async sendMessage(conversationId, message) {
        try {
            const conversation = this.conversations[conversationId];
            
            if (!conversation) {
                throw new Error(`Conversation ${conversationId} not found`);
            }
            
            // Add user message to conversation
            this.addMessage(conversationId, 'user', message);
            
            // Check if message contains commands
            const commandResult = await this.processCommands(message, conversation);
            if (commandResult) {
                this.addMessage(conversationId, 'assistant', commandResult);
                return commandResult;
            }
            
            // Prepare messages for API request
            const messages = conversation.messages.slice(-10); // Only use last 10 messages to save tokens
            
            // Make API request
            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                model: this.model,
                messages,
                max_tokens: this.maxTokens,
                temperature: this.temperature
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Extract assistant message
            const assistantMessage = response.data.choices[0].message.content;
            
            // Add assistant message to conversation
            this.addMessage(conversationId, 'assistant', assistantMessage);
            
            return assistantMessage;
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Add error message to conversation
            this.addMessage(conversationId, 'assistant', 'Sorry, I encountered an error. Please try again.');
            
            return 'Sorry, I encountered an error. Please try again.';
        }
    }
    
    /**
     * Process commands in a message
     * @param {string} message - The user message
     * @param {Object} conversation - The conversation
     * @returns {Promise} A promise that resolves with the command result, or null if no command was found
     */
    async processCommands(message, conversation) {
        // Check for booking commands
        if (message.match(/\/booking list/i)) {
            return this.listBookings();
        }
        
        if (message.match(/\/booking find (\w+)/i)) {
            const reference = message.match(/\/booking find (\w+)/i)[1];
            return this.findBooking(reference);
        }
        
        // Check for vehicle commands
        if (message.match(/\/vehicle list/i)) {
            return this.listVehicles();
        }
        
        if (message.match(/\/vehicle find (\w+)/i)) {
            const vehicleId = message.match(/\/vehicle find (\w+)/i)[1];
            return this.findVehicle(vehicleId);
        }
        
        // Check for marketing commands
        if (message.match(/\/marketing stats/i)) {
            return this.getMarketingStats();
        }
        
        // No command found
        return null;
    }
    
    /**
     * List recent bookings
     * @returns {Promise} A promise that resolves with the bookings list
     */
    async listBookings() {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (error) {
                throw new Error(error.message);
            }
            
            if (data.length === 0) {
                return 'No bookings found.';
            }
            
            // Format bookings as a readable list
            let response = '**Recent Bookings:**\n\n';
            
            for (const booking of data) {
                response += `- Reference: ${booking.reference}\n`;
                response += `  Customer: ${booking['first-name']} ${booking['last-name']}\n`;
                response += `  Vehicle: ${booking.vehicleName || booking.vehicleId}\n`;
                response += `  Dates: ${booking.pickupDate} to ${booking.returnDate}\n`;
                response += `  Total: RM ${booking.totalAmount || 'N/A'}\n\n`;
            }
            
            return response;
        } catch (error) {
            console.error('Error listing bookings:', error);
            return 'Error listing bookings. Please try again.';
        }
    }
    
    /**
     * Find a booking by reference
     * @param {string} reference - The booking reference
     * @returns {Promise} A promise that resolves with the booking details
     */
    async findBooking(reference) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('reference', reference)
                .single();
            
            if (error) {
                throw new Error(error.message);
            }
            
            if (!data) {
                return `No booking found with reference ${reference}.`;
            }
            
            // Format booking details
            let response = `**Booking Details for ${reference}:**\n\n`;
            response += `Customer: ${data['first-name']} ${data['last-name']}\n`;
            response += `Email: ${data.email}\n`;
            response += `Phone: ${data.phone}\n`;
            response += `Vehicle: ${data.vehicleName || data.vehicleId}\n`;
            response += `Pickup: ${data.pickupDate} at ${data.pickupLocation}\n`;
            response += `Return: ${data.returnDate} at ${data.returnLocation}\n`;
            response += `Total Amount: RM ${data.totalAmount || 'N/A'}\n`;
            response += `Payment Method: ${data.paymentMethod || 'N/A'}\n`;
            response += `Created: ${new Date(data.created_at).toLocaleString()}\n`;
            
            return response;
        } catch (error) {
            console.error('Error finding booking:', error);
            return `Error finding booking with reference ${reference}. Please try again.`;
        }
    }
    
    /**
     * List vehicles
     * @returns {Promise} A promise that resolves with the vehicles list
     */
    async listVehicles() {
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .limit(5);
            
            if (error) {
                throw new Error(error.message);
            }
            
            if (data.length === 0) {
                return 'No vehicles found.';
            }
            
            // Format vehicles as a readable list
            let response = '**Vehicles:**\n\n';
            
            for (const vehicle of data) {
                response += `- ${vehicle.name}\n`;
                response += `  Category: ${vehicle.category}\n`;
                response += `  Passengers: ${vehicle.passengers}\n`;
                response += `  Price: RM ${vehicle.price}\n\n`;
            }
            
            return response;
        } catch (error) {
            console.error('Error listing vehicles:', error);
            return 'Error listing vehicles. Please try again.';
        }
    }
    
    /**
     * Find a vehicle by ID
     * @param {string} vehicleId - The vehicle ID
     * @returns {Promise} A promise that resolves with the vehicle details
     */
    async findVehicle(vehicleId) {
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('id', vehicleId)
                .single();
            
            if (error) {
                throw new Error(error.message);
            }
            
            if (!data) {
                return `No vehicle found with ID ${vehicleId}.`;
            }
            
            // Format vehicle details
            let response = `**Vehicle Details for ${data.name}:**\n\n`;
            response += `ID: ${data.id}\n`;
            response += `Category: ${data.category}\n`;
            response += `Passengers: ${data.passengers}\n`;
            response += `Baggage: ${data.baggage}\n`;
            response += `Doors: ${data.doors}\n`;
            response += `Transmission: ${data.transmission}\n`;
            response += `Fuel: ${data.fuel}\n`;
            response += `Price: RM ${data.price}\n`;
            
            return response;
        } catch (error) {
            console.error('Error finding vehicle:', error);
            return `Error finding vehicle with ID ${vehicleId}. Please try again.`;
        }
    }
    
    /**
     * Get marketing statistics
     * @returns {Promise} A promise that resolves with the marketing statistics
     */
    async getMarketingStats() {
        try {
            // Get booking statistics
            const { data: bookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('created_at, totalAmount, utm_source, utm_medium, utm_campaign');
            
            if (bookingsError) {
                throw new Error(bookingsError.message);
            }
            
            // Calculate statistics
            const totalBookings = bookings.length;
            const totalRevenue = bookings.reduce((sum, booking) => sum + (parseFloat(booking.totalAmount) || 0), 0);
            
            // Group by UTM source
            const utmSources = {};
            for (const booking of bookings) {
                const source = booking.utm_source || 'direct';
                utmSources[source] = (utmSources[source] || 0) + 1;
            }
            
            // Format statistics
            let response = '**Marketing Statistics:**\n\n';
            response += `Total Bookings: ${totalBookings}\n`;
            response += `Total Revenue: RM ${totalRevenue.toFixed(2)}\n\n`;
            
            response += '**Bookings by Source:**\n\n';
            for (const [source, count] of Object.entries(utmSources)) {
                response += `- ${source}: ${count} (${((count / totalBookings) * 100).toFixed(1)}%)\n`;
            }
            
            return response;
        } catch (error) {
            console.error('Error getting marketing statistics:', error);
            return 'Error getting marketing statistics. Please try again.';
        }
    }
    
    /**
     * Save conversations to database
     */
    async saveConversations() {
        try {
            for (const [conversationId, conversation] of Object.entries(this.conversations)) {
                // Check if conversation has been updated since last save
                if (conversation.saved_at && conversation.saved_at >= conversation.updated_at) {
                    continue;
                }
                
                // Save conversation to database
                const { error } = await supabase
                    .from('conversations')
                    .upsert({
                        id: conversationId,
                        user_id: conversation.userId,
                        messages: conversation.messages,
                        created_at: conversation.created_at,
                        updated_at: conversation.updated_at
                    });
                
                if (error) {
                    console.error('Error saving conversation:', error);
                } else {
                    conversation.saved_at = new Date().toISOString();
                }
            }
        } catch (error) {
            console.error('Error saving conversations:', error);
        }
    }
}

// Export the Chat Engine class
module.exports = ChatEngine;
