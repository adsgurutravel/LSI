# AmriTravel Booking System

A complete travel booking system that replicates the functionality of penangbook.my with enhanced features and integrations.

## Project Structure

- **/pages**: HTML pages (index.html, booking.html, car.html, thankyou.html, contact.html)
- **/scripts**: JavaScript logic files (redirect.js, supabase-save.js, track-ads.js, whatsapp-link.js)
- **/integrations**: API integrations for third-party services
- **/ai-assistant**: Internal AI dashboard
- **/data**: Configuration files
- **/api**: Local API handlers for automation triggers
- **/assets**: Static assets

## Main Features

1. **User Booking Flow**

   - Search and filter cars
   - Book cars with date and location selection
   - Process payments through bayarcash.com
   - Receive booking confirmations

2. **Admin Dashboard**

   - AI-powered chatbot for admin use
   - Booking statistics
   - Vehicle management
   - Ad campaign management
   - Lead follow-up system
   - Task scheduling and automation
   - System logs and monitoring

3. **Integrations**

   - Supabase for data storage
   - Wasapbot.my for automated messaging
   - Boost.Space for CRM
   - Flowlu for task management
   - Pabbly Connect for email notifications
   - Uchat for WhatsApp integration
   - Adsumo for ad audience mapping
   - Green Matrix for car rental availability
   - Rentsys for fleet information

4. **Plugin System**
   - Modular plugin architecture
   - Easy integration of new services
   - Centralized automation management

## Setup Instructions

1. Clone the repository
2. Install dependencies with `npm install`
3. Configure the .env file with your API keys
4. Run the local development server with `npm run dev`
5. Access the AI Assistant Dashboard at http://localhost:3000/admin/dashboard
6. Deploy to Vercel using the provided configuration

## AI Assistant

The system includes an AI-powered assistant with both CLI and web interfaces:

### CLI Interface

Run the CLI interface with:

```
npm run cli
```

Available commands:

- `help` - Display help information
- `/task <task>` - Run a specific task
- `/logs <type>` - View logs (tasks, errors, system, or all)
- `/config` - View configuration

### Web Dashboard

The web dashboard provides a user-friendly interface for:

- Interacting with the AI chatbot
- Managing scheduled tasks
- Viewing system logs
- Configuring the AI assistant

Access the dashboard at `/admin/dashboard` when running locally or deployed.

## Deployment

The system is configured for deployment on Vercel with GitHub integration. Use the vercel-deploy.js script for automated deployment when files are updated.

## License

Proprietary - All rights reserved
