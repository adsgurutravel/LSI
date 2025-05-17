/**
 * AmriTravel System - WhatsApp Integration
 * 
 * This script handles WhatsApp messaging integration for customer support,
 * booking confirmations, and notifications.
 */

(function() {
    // WhatsApp configuration
    const config = {
        // Default WhatsApp number (with country code, no + or spaces)
        defaultNumber: '60123456789',
        
        // Template messages
        templates: {
            support: 'Hi AmriTravel, I need assistance with my booking.',
            booking: 'Hi AmriTravel, I would like to confirm my booking {reference}.',
            inquiry: 'Hi AmriTravel, I have a question about {vehicle} rental.',
            feedback: 'Hi AmriTravel, I would like to provide feedback about my recent rental experience.'
        },
        
        // Integration with uChat
        uchat: {
            enabled: false,
            apiKey: '',
            flowId: ''
        },
        
        // Integration with WasapBot
        wasapbot: {
            enabled: false,
            apiKey: '',
            templateId: ''
        },
        
        // Debug mode
        debug: false
    };
    
    // WhatsApp integration module
    const WhatsAppManager = {
        /**
         * Initialize the WhatsApp manager
         */
        init: function() {
            // Load configuration
            this.loadConfig();
            
            // Set up WhatsApp links
            this.setupWhatsAppLinks();
            
            if (config.debug) {
                console.log('WhatsApp manager initialized with config:', config);
            }
        },
        
        /**
         * Load configuration from environment or data attributes
         */
        loadConfig: function() {
            // Try to get configuration from data attributes
            const scriptTag = document.querySelector('script[data-whatsapp-config]');
            
            if (scriptTag) {
                try {
                    const whatsappConfig = JSON.parse(scriptTag.getAttribute('data-whatsapp-config'));
                    
                    // Merge with default config
                    config.defaultNumber = whatsappConfig.number || config.defaultNumber;
                    
                    // Update templates if provided
                    if (whatsappConfig.templates) {
                        Object.assign(config.templates, whatsappConfig.templates);
                    }
                    
                    // Update uChat config if provided
                    if (whatsappConfig.uchat) {
                        config.uchat.enabled = whatsappConfig.uchat.enabled || config.uchat.enabled;
                        config.uchat.apiKey = whatsappConfig.uchat.apiKey || config.uchat.apiKey;
                        config.uchat.flowId = whatsappConfig.uchat.flowId || config.uchat.flowId;
                    }
                    
                    // Update WasapBot config if provided
                    if (whatsappConfig.wasapbot) {
                        config.wasapbot.enabled = whatsappConfig.wasapbot.enabled || config.wasapbot.enabled;
                        config.wasapbot.apiKey = whatsappConfig.wasapbot.apiKey || config.wasapbot.apiKey;
                        config.wasapbot.templateId = whatsappConfig.wasapbot.templateId || config.wasapbot.templateId;
                    }
                    
                    // Set debug mode
                    config.debug = whatsappConfig.debug || config.debug;
                } catch (error) {
                    console.error('Error parsing WhatsApp configuration:', error);
                }
            }
            
            // Try to get configuration from environment variables
            if (typeof process !== 'undefined' && process.env) {
                config.defaultNumber = process.env.WHATSAPP_NUMBER || config.defaultNumber;
                config.uchat.apiKey = process.env.UCHAT_API_KEY || config.uchat.apiKey;
                config.wasapbot.apiKey = process.env.WASAPBOT_API_KEY || config.wasapbot.apiKey;
            }
        },
        
        /**
         * Set up WhatsApp links on the page
         */
        setupWhatsAppLinks: function() {
            // Set up links with data-whatsapp-template attribute
            document.querySelectorAll('[data-whatsapp-template]').forEach(element => {
                element.addEventListener('click', this.handleTemplateClick.bind(this));
            });
            
            // Set up links with data-whatsapp-number attribute
            document.querySelectorAll('[data-whatsapp-number]').forEach(element => {
                const number = element.getAttribute('data-whatsapp-number');
                const message = element.getAttribute('data-whatsapp-message') || '';
                
                // Update href attribute
                element.href = this.generateWhatsAppLink(number, message);
            });
            
            // Set up WhatsApp chat button if it exists
            const chatButton = document.querySelector('.whatsapp-chat-button');
            if (chatButton) {
                chatButton.addEventListener('click', this.openWhatsAppChat.bind(this));
            }
        },
        
        /**
         * Handle click on element with WhatsApp template
         * @param {Event} event - The click event
         */
        handleTemplateClick: function(event) {
            const element = event.currentTarget;
            const templateName = element.getAttribute('data-whatsapp-template');
            const templateData = JSON.parse(element.getAttribute('data-template-data') || '{}');
            
            // Get the template message
            let message = config.templates[templateName] || '';
            
            // Replace placeholders in the template
            message = this.replacePlaceholders(message, templateData);
            
            // Get the WhatsApp number (use default if not specified)
            const number = element.getAttribute('data-whatsapp-number') || config.defaultNumber;
            
            // Generate and open WhatsApp link
            const whatsappLink = this.generateWhatsAppLink(number, message);
            window.open(whatsappLink, '_blank');
            
            // Prevent default link behavior
            event.preventDefault();
        },
        
        /**
         * Replace placeholders in a template string
         * @param {string} template - The template string
         * @param {Object} data - The data to replace placeholders with
         * @returns {string} The template with placeholders replaced
         */
        replacePlaceholders: function(template, data) {
            return template.replace(/{([^}]+)}/g, (match, key) => {
                return data[key] !== undefined ? data[key] : match;
            });
        },
        
        /**
         * Generate a WhatsApp link
         * @param {string} number - The WhatsApp number
         * @param {string} message - The message to send
         * @returns {string} The WhatsApp link
         */
        generateWhatsAppLink: function(number, message) {
            // Clean the number (remove spaces, +, etc.)
            const cleanNumber = number.replace(/\D/g, '');
            
            // Encode the message
            const encodedMessage = encodeURIComponent(message);
            
            // Generate the link
            return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
        },
        
        /**
         * Open WhatsApp chat with default number
         */
        openWhatsAppChat: function() {
            const message = config.templates.support || '';
            const whatsappLink = this.generateWhatsAppLink(config.defaultNumber, message);
            window.open(whatsappLink, '_blank');
        },
        
        /**
         * Send a WhatsApp message using uChat API
         * @param {string} number - The recipient's number
         * @param {string} message - The message to send
         * @returns {Promise} A promise that resolves with the API response
         */
        sendUChatMessage: async function(number, message) {
            if (!config.uchat.enabled || !config.uchat.apiKey || !config.uchat.flowId) {
                console.error('uChat configuration is incomplete');
                return { success: false, error: 'uChat configuration is incomplete' };
            }
            
            try {
                // Clean the number (remove spaces, +, etc.)
                const cleanNumber = number.replace(/\D/g, '');
                
                // Prepare the API request
                const response = await fetch('https://api.uchat.com.my/api/v1/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.uchat.apiKey}`
                    },
                    body: JSON.stringify({
                        flow_id: config.uchat.flowId,
                        to: cleanNumber,
                        message: message
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to send uChat message');
                }
                
                if (config.debug) {
                    console.log('uChat message sent successfully:', data);
                }
                
                return { success: true, data };
            } catch (error) {
                console.error('Error sending uChat message:', error);
                return { success: false, error: error.message };
            }
        },
        
        /**
         * Send a WhatsApp message using WasapBot API
         * @param {string} number - The recipient's number
         * @param {string} message - The message to send
         * @returns {Promise} A promise that resolves with the API response
         */
        sendWasapBotMessage: async function(number, message) {
            if (!config.wasapbot.enabled || !config.wasapbot.apiKey || !config.wasapbot.templateId) {
                console.error('WasapBot configuration is incomplete');
                return { success: false, error: 'WasapBot configuration is incomplete' };
            }
            
            try {
                // Clean the number (remove spaces, +, etc.)
                const cleanNumber = number.replace(/\D/g, '');
                
                // Prepare the API request
                const response = await fetch('https://api.wasapbot.my/api/v1/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': config.wasapbot.apiKey
                    },
                    body: JSON.stringify({
                        template_id: config.wasapbot.templateId,
                        to: cleanNumber,
                        message: message
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to send WasapBot message');
                }
                
                if (config.debug) {
                    console.log('WasapBot message sent successfully:', data);
                }
                
                return { success: true, data };
            } catch (error) {
                console.error('Error sending WasapBot message:', error);
                return { success: false, error: error.message };
            }
        },
        
        /**
         * Send a booking confirmation message
         * @param {Object} bookingData - The booking data
         * @returns {Promise} A promise that resolves with the API response
         */
        sendBookingConfirmation: async function(bookingData) {
            // Get the template message
            let message = config.templates.booking || '';
            
            // Replace placeholders in the template
            message = this.replacePlaceholders(message, bookingData);
            
            // Get the customer's phone number
            const customerPhone = bookingData.phone || '';
            
            if (!customerPhone) {
                console.error('Customer phone number is missing');
                return { success: false, error: 'Customer phone number is missing' };
            }
            
            // Send the message using the appropriate service
            if (config.uchat.enabled) {
                return this.sendUChatMessage(customerPhone, message);
            } else if (config.wasapbot.enabled) {
                return this.sendWasapBotMessage(customerPhone, message);
            } else {
                console.error('No WhatsApp service is enabled');
                return { success: false, error: 'No WhatsApp service is enabled' };
            }
        }
    };
    
    // Initialize the WhatsApp manager
    WhatsAppManager.init();
    
    // Expose the WhatsApp manager to the global scope
    window.WhatsAppManager = WhatsAppManager;
})();
