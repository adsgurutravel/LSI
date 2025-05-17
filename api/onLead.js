/**
 * AmriTravel System - Lead API Handler
 * 
 * This API handler processes lead submissions from contact forms and inquiries,
 * and triggers integrations with CRM, email, and messaging services.
 */

// Import required modules
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const pluginManager = require('../plugin-manager');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Main handler function for lead submissions
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // Get lead data from request body
        const leadData = req.body;
        
        // Validate lead data
        if (!validateLeadData(leadData)) {
            return res.status(400).json({ error: 'Invalid lead data' });
        }
        
        // Process the lead
        const result = await processLead(leadData);
        
        // Return the result
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error processing lead:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Validate lead data
 * @param {Object} leadData - The lead data to validate
 * @returns {boolean} True if the lead data is valid
 */
function validateLeadData(leadData) {
    // Check required fields
    const requiredFields = ['name', 'email'];
    
    for (const field of requiredFields) {
        if (!leadData[field]) {
            console.error(`Missing required field: ${field}`);
            return false;
        }
    }
    
    return true;
}

/**
 * Process a lead
 * @param {Object} leadData - The lead data to process
 * @returns {Object} The processing result
 */
async function processLead(leadData) {
    // Add timestamp
    leadData.created_at = new Date().toISOString();
    
    // Add source if not provided
    if (!leadData.source) {
        leadData.source = 'website';
    }
    
    // Save lead to database
    const { data, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select();
    
    if (error) {
        console.error('Error saving lead to database:', error);
        throw new Error('Failed to save lead');
    }
    
    const savedLead = data[0];
    
    // Trigger integrations
    await triggerIntegrations(savedLead);
    
    // Return the saved lead
    return {
        success: true,
        lead: savedLead
    };
}

/**
 * Trigger integrations for a lead
 * @param {Object} leadData - The lead data
 */
async function triggerIntegrations(leadData) {
    try {
        // Trigger plugin hooks
        const pluginResults = pluginManager.trigger('onLead', leadData);
        console.log('Plugin results:', pluginResults);
        
        // Create CRM lead
        await createCRMLead(leadData);
        
        // Send email notification
        await sendEmailNotification(leadData);
        
        // Send WhatsApp notification if phone is provided
        if (leadData.phone) {
            await sendWhatsAppNotification(leadData);
        }
        
        // Track lead in ad platform if UTM data is available
        if (leadData.utm_source || leadData.utm_medium || leadData.utm_campaign) {
            await trackLeadInAdPlatform(leadData);
        }
    } catch (error) {
        console.error('Error triggering integrations:', error);
        // Continue processing even if integrations fail
    }
}

/**
 * Create a CRM lead
 * @param {Object} leadData - The lead data
 */
async function createCRMLead(leadData) {
    try {
        // Check if CRM integration is enabled
        const boostspaceApiKey = process.env.BOOSTSPACE_API_KEY;
        const flowluApiKey = process.env.FLOWLU_API_KEY;
        
        if (!boostspaceApiKey && !flowluApiKey) {
            console.log('CRM integration not configured');
            return;
        }
        
        // Create lead in Boost.Space if configured
        if (boostspaceApiKey) {
            await axios.post('https://api.boost.space/v1/leads', {
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone || '',
                source: leadData.source || 'website',
                status: 'new',
                notes: leadData.message || ''
            }, {
                headers: {
                    'X-API-Key': boostspaceApiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('CRM lead created in Boost.Space');
        }
        // Create lead in Flowlu if configured
        else if (flowluApiKey) {
            await axios.post('https://api.flowlu.com/v1/crm/lead/create', {
                title: `Website Inquiry - ${leadData.name}`,
                contact_name: leadData.name,
                contact_email: leadData.email,
                contact_phone: leadData.phone || '',
                source: leadData.source || 'website',
                description: leadData.message || ''
            }, {
                headers: {
                    'X-API-Key': flowluApiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('CRM lead created in Flowlu');
        }
    } catch (error) {
        console.error('Error creating CRM lead:', error);
        // Continue processing even if CRM lead creation fails
    }
}

/**
 * Send email notification for a lead
 * @param {Object} leadData - The lead data
 */
async function sendEmailNotification(leadData) {
    try {
        // Check if email integration is enabled
        const pabblyApiKey = process.env.PABBLY_API_KEY;
        
        if (!pabblyApiKey) {
            console.log('Email integration not configured');
            return;
        }
        
        // Send email via Pabbly Connect
        await axios.post('https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwIj0=', {
            lead_name: leadData.name,
            lead_email: leadData.email,
            lead_phone: leadData.phone || 'Not provided',
            lead_source: leadData.source || 'website',
            lead_message: leadData.message || 'No message',
            lead_subject: leadData.subject || 'Website Inquiry'
        }, {
            headers: {
                'X-API-Key': pabblyApiKey,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Email notification sent via Pabbly Connect');
    } catch (error) {
        console.error('Error sending email notification:', error);
        // Continue processing even if email notification fails
    }
}

/**
 * Send WhatsApp notification for a lead
 * @param {Object} leadData - The lead data
 */
async function sendWhatsAppNotification(leadData) {
    try {
        // Check if WhatsApp integration is enabled
        const wasapbotApiKey = process.env.WASAPBOT_API_KEY;
        const uchatApiKey = process.env.UCHAT_API_KEY;
        
        if (!wasapbotApiKey && !uchatApiKey) {
            console.log('WhatsApp integration not configured');
            return;
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
        
        // Send via WasapBot if configured
        if (wasapbotApiKey) {
            await axios.post('https://api.wasapbot.my/api/v1/send', {
                to: leadData.phone,
                message: message
            }, {
                headers: {
                    'X-API-Key': wasapbotApiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('WhatsApp notification sent via WasapBot');
        }
        // Send via uChat if configured
        else if (uchatApiKey) {
            const uchatFlowId = process.env.UCHAT_FLOW_ID;
            
            await axios.post('https://api.uchat.com.my/api/v1/send', {
                flow_id: uchatFlowId,
                to: leadData.phone,
                message: message
            }, {
                headers: {
                    'Authorization': `Bearer ${uchatApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('WhatsApp notification sent via uChat');
        }
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        // Continue processing even if WhatsApp notification fails
    }
}

/**
 * Track lead in ad platform
 * @param {Object} leadData - The lead data
 */
async function trackLeadInAdPlatform(leadData) {
    try {
        // Check if ad tracking integration is enabled
        const adsumoApiKey = process.env.ADSUMO_API_KEY;
        
        if (!adsumoApiKey) {
            console.log('Ad tracking integration not configured');
            return;
        }
        
        // Track lead in Adsumo
        await axios.post('https://api.adsumo.com/v1/conversions', {
            event_name: 'lead',
            user_data: {
                email: leadData.email,
                phone: leadData.phone || '',
                name: leadData.name
            },
            custom_data: {
                lead_source: leadData.source || 'website',
                lead_subject: leadData.subject || '',
                utm_source: leadData.utm_source || '',
                utm_medium: leadData.utm_medium || '',
                utm_campaign: leadData.utm_campaign || ''
            }
        }, {
            headers: {
                'X-API-Key': adsumoApiKey,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Lead tracked in Adsumo');
    } catch (error) {
        console.error('Error tracking lead in ad platform:', error);
        // Continue processing even if ad tracking fails
    }
}
