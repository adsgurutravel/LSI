/**
 * AmriTravel System - Booking API Handler
 * 
 * This API handler processes booking submissions and triggers integrations
 * with various services like WhatsApp, CRM, and email notifications.
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
 * Main handler function for booking submissions
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // Get booking data from request body
        const bookingData = req.body;
        
        // Validate booking data
        if (!validateBookingData(bookingData)) {
            return res.status(400).json({ error: 'Invalid booking data' });
        }
        
        // Process the booking
        const result = await processBooking(bookingData);
        
        // Return the result
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error processing booking:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Validate booking data
 * @param {Object} bookingData - The booking data to validate
 * @returns {boolean} True if the booking data is valid
 */
function validateBookingData(bookingData) {
    // Check required fields
    const requiredFields = [
        'vehicleId',
        'pickupDate',
        'returnDate',
        'pickupLocation',
        'returnLocation',
        'first-name',
        'last-name',
        'email',
        'phone'
    ];
    
    for (const field of requiredFields) {
        if (!bookingData[field]) {
            console.error(`Missing required field: ${field}`);
            return false;
        }
    }
    
    return true;
}

/**
 * Process a booking
 * @param {Object} bookingData - The booking data to process
 * @returns {Object} The processing result
 */
async function processBooking(bookingData) {
    // Generate a booking reference if not provided
    if (!bookingData.reference) {
        bookingData.reference = generateBookingReference();
    }
    
    // Add timestamp
    bookingData.created_at = new Date().toISOString();
    
    // Save booking to database
    const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select();
    
    if (error) {
        console.error('Error saving booking to database:', error);
        throw new Error('Failed to save booking');
    }
    
    const savedBooking = data[0];
    
    // Trigger integrations
    await triggerIntegrations(savedBooking);
    
    // Return the saved booking
    return {
        success: true,
        booking: savedBooking
    };
}

/**
 * Generate a unique booking reference
 * @returns {string} A unique booking reference
 */
function generateBookingReference() {
    const prefix = 'AT-';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
}

/**
 * Trigger integrations for a booking
 * @param {Object} bookingData - The booking data
 */
async function triggerIntegrations(bookingData) {
    try {
        // Trigger plugin hooks
        const pluginResults = pluginManager.trigger('onBooking', bookingData);
        console.log('Plugin results:', pluginResults);
        
        // Send WhatsApp notification
        await sendWhatsAppNotification(bookingData);
        
        // Create CRM lead
        await createCRMLead(bookingData);
        
        // Send email notification
        await sendEmailNotification(bookingData);
        
        // Update vehicle availability
        await updateVehicleAvailability(bookingData);
    } catch (error) {
        console.error('Error triggering integrations:', error);
        // Continue processing even if integrations fail
    }
}

/**
 * Send WhatsApp notification for a booking
 * @param {Object} bookingData - The booking data
 */
async function sendWhatsAppNotification(bookingData) {
    try {
        // Check if WhatsApp integration is enabled
        const wasapbotApiKey = process.env.WASAPBOT_API_KEY;
        const uchatApiKey = process.env.UCHAT_API_KEY;
        
        if (!wasapbotApiKey && !uchatApiKey) {
            console.log('WhatsApp integration not configured');
            return;
        }
        
        // Prepare customer data
        const customerName = `${bookingData['first-name']} ${bookingData['last-name']}`;
        const customerPhone = bookingData.phone;
        
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
        
        // Send via WasapBot if configured
        if (wasapbotApiKey) {
            await axios.post('https://api.wasapbot.my/api/v1/send', {
                to: customerPhone,
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
                to: customerPhone,
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
 * Create a CRM lead for a booking
 * @param {Object} bookingData - The booking data
 */
async function createCRMLead(bookingData) {
    try {
        // Check if CRM integration is enabled
        const boostspaceApiKey = process.env.BOOSTSPACE_API_KEY;
        const flowluApiKey = process.env.FLOWLU_API_KEY;
        
        if (!boostspaceApiKey && !flowluApiKey) {
            console.log('CRM integration not configured');
            return;
        }
        
        // Prepare customer data
        const customerName = `${bookingData['first-name']} ${bookingData['last-name']}`;
        const customerEmail = bookingData.email;
        const customerPhone = bookingData.phone;
        
        // Create lead in Boost.Space if configured
        if (boostspaceApiKey) {
            await axios.post('https://api.boost.space/v1/leads', {
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                source: 'website',
                status: 'new',
                notes: `Booking Reference: ${bookingData.reference}\nVehicle: ${bookingData.vehicleName || 'Selected Vehicle'}\nPickup: ${bookingData.pickupDate}\nReturn: ${bookingData.returnDate}`
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
                title: `Car Rental Booking - ${customerName}`,
                contact_name: customerName,
                contact_email: customerEmail,
                contact_phone: customerPhone,
                source: 'website',
                description: `Booking Reference: ${bookingData.reference}\nVehicle: ${bookingData.vehicleName || 'Selected Vehicle'}\nPickup: ${bookingData.pickupDate}\nReturn: ${bookingData.returnDate}`
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
 * Send email notification for a booking
 * @param {Object} bookingData - The booking data
 */
async function sendEmailNotification(bookingData) {
    try {
        // Check if email integration is enabled
        const pabblyApiKey = process.env.PABBLY_API_KEY;
        
        if (!pabblyApiKey) {
            console.log('Email integration not configured');
            return;
        }
        
        // Prepare customer data
        const customerName = `${bookingData['first-name']} ${bookingData['last-name']}`;
        const customerEmail = bookingData.email;
        
        // Send email via Pabbly Connect
        await axios.post('https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjU5Ij0=', {
            booking_reference: bookingData.reference,
            customer_name: customerName,
            customer_email: customerEmail,
            vehicle_name: bookingData.vehicleName || 'Selected Vehicle',
            pickup_date: bookingData.pickupDate,
            pickup_location: bookingData.pickupLocation,
            return_date: bookingData.returnDate,
            return_location: bookingData.returnLocation,
            total_amount: bookingData.totalAmount || '0.00'
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
 * Update vehicle availability for a booking
 * @param {Object} bookingData - The booking data
 */
async function updateVehicleAvailability(bookingData) {
    try {
        // Check if vehicle integration is enabled
        const greenmatrixApiKey = process.env.GREENMATRIX_API_KEY;
        const rentsysApiKey = process.env.RENTSYS_API_KEY;
        
        if (!greenmatrixApiKey && !rentsysApiKey) {
            console.log('Vehicle integration not configured');
            return;
        }
        
        // Update availability in Green Matrix if configured
        if (greenmatrixApiKey) {
            await axios.post('https://api.greenmatrix.com/v1/availability/update', {
                vehicle_id: bookingData.vehicleId,
                start_date: bookingData.pickupDate,
                end_date: bookingData.returnDate,
                status: 'booked'
            }, {
                headers: {
                    'X-API-Key': greenmatrixApiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Vehicle availability updated in Green Matrix');
        }
        // Update availability in Rentsys if configured
        else if (rentsysApiKey) {
            await axios.post('https://api.rentsys.com/v1/bookings', {
                vehicle_id: bookingData.vehicleId,
                start_date: bookingData.pickupDate,
                end_date: bookingData.returnDate,
                customer_name: `${bookingData['first-name']} ${bookingData['last-name']}`,
                customer_email: bookingData.email,
                customer_phone: bookingData.phone,
                reference: bookingData.reference
            }, {
                headers: {
                    'X-API-Key': rentsysApiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Vehicle availability updated in Rentsys');
        }
    } catch (error) {
        console.error('Error updating vehicle availability:', error);
        // Continue processing even if vehicle availability update fails
    }
}
