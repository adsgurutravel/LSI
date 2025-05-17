#!/usr/bin/env node

/**
 * AmriTravel System - AI Assistant CLI
 * 
 * This module provides a command-line interface for the AI assistant,
 * allowing administrators to interact with the system via the terminal.
 */

// Import required modules
const readline = require('readline');
const chalk = require('chalk');
const figlet = require('figlet');
const { program } = require('commander');
const ChatEngine = require('./chat-engine');
const TaskRunner = require('./task-runner');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize the chat engine and task runner
const chatEngine = new ChatEngine();
const taskRunner = new TaskRunner();

// Set up the command-line interface
program
    .version('1.0.0')
    .description('AmriTravel AI Assistant CLI')
    .option('-i, --interactive', 'Start interactive chat mode')
    .option('-t, --task <task>', 'Run a specific task')
    .option('-l, --logs [type]', 'View logs (tasks, errors, system, or all)')
    .option('-c, --config', 'View configuration')
    .option('-h, --help', 'Display help information')
    .parse(process.argv);

// Display welcome message
console.log(chalk.yellow(figlet.textSync('AmriTravel AI', { horizontalLayout: 'full' })));
console.log(chalk.yellow('AI Assistant CLI - Version 1.0.0\n'));

// Get the options
const options = program.opts();

// Handle the options
if (options.interactive) {
    startInteractiveMode();
} else if (options.task) {
    runTask(options.task);
} else if (options.logs) {
    viewLogs(options.logs);
} else if (options.config) {
    viewConfig();
} else {
    program.help();
}

/**
 * Start interactive chat mode
 */
function startInteractiveMode() {
    console.log(chalk.green('Starting interactive chat mode...'));
    console.log(chalk.green('Type "exit" or "quit" to exit.'));
    console.log(chalk.green('Type "help" to see available commands.'));
    console.log('');
    
    // Create a conversation
    const conversationId = chatEngine.createConversation('admin', 'general');
    
    // Create readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.yellow('You: ')
    });
    
    // Display the prompt
    rl.prompt();
    
    // Handle user input
    rl.on('line', async (line) => {
        const input = line.trim();
        
        // Check for exit commands
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log(chalk.green('Goodbye!'));
            rl.close();
            process.exit(0);
        }
        
        // Check for help command
        if (input.toLowerCase() === 'help') {
            displayHelp();
            rl.prompt();
            return;
        }
        
        // Check for task commands
        if (input.startsWith('/task ')) {
            const taskName = input.substring(6).trim();
            await runTask(taskName);
            rl.prompt();
            return;
        }
        
        // Check for logs command
        if (input.startsWith('/logs ')) {
            const logType = input.substring(6).trim();
            viewLogs(logType);
            rl.prompt();
            return;
        }
        
        // Check for config command
        if (input.toLowerCase() === '/config') {
            viewConfig();
            rl.prompt();
            return;
        }
        
        // Send message to chat engine
        console.log(chalk.cyan('AI: ') + chalk.gray('Thinking...'));
        
        try {
            const response = await chatEngine.sendMessage(conversationId, input);
            console.log(chalk.cyan('AI: ') + response);
        } catch (error) {
            console.error(chalk.red('Error: ') + error.message);
        }
        
        rl.prompt();
    }).on('close', () => {
        console.log(chalk.green('Goodbye!'));
        process.exit(0);
    });
}

/**
 * Run a task
 * @param {string} taskName - The task name
 */
async function runTask(taskName) {
    console.log(chalk.green(`Running task: ${taskName}...`));
    
    try {
        const result = await taskRunner.runTask(taskName);
        console.log(chalk.green('Task completed successfully:'));
        console.log(result);
    } catch (error) {
        console.error(chalk.red('Error running task:'));
        console.error(error.message);
    }
}

/**
 * View logs
 * @param {string} logType - The log type (tasks, errors, system, or all)
 */
function viewLogs(logType = 'all') {
    console.log(chalk.green(`Viewing logs: ${logType}...`));
    
    try {
        if (logType === 'all' || logType === true) {
            // View all logs
            const taskLogs = taskRunner.getLogs('tasks');
            const errorLogs = taskRunner.getLogs('errors');
            const systemLogs = taskRunner.getLogs('system');
            
            console.log(chalk.yellow('=== Task Logs ==='));
            displayLogs(taskLogs);
            
            console.log(chalk.yellow('\n=== Error Logs ==='));
            displayLogs(errorLogs);
            
            console.log(chalk.yellow('\n=== System Logs ==='));
            displayLogs(systemLogs);
        } else {
            // View specific log type
            const logs = taskRunner.getLogs(logType);
            
            console.log(chalk.yellow(`=== ${logType.charAt(0).toUpperCase() + logType.slice(1)} Logs ===`));
            displayLogs(logs);
        }
    } catch (error) {
        console.error(chalk.red('Error viewing logs:'));
        console.error(error.message);
    }
}

/**
 * Display logs
 * @param {Array} logs - The logs to display
 */
function displayLogs(logs) {
    if (logs.length === 0) {
        console.log('No logs found.');
        return;
    }
    
    for (const log of logs) {
        const timestamp = new Date(log.timestamp).toLocaleString();
        console.log(`${chalk.gray(timestamp)} - ${log.message}`);
    }
}

/**
 * View configuration
 */
function viewConfig() {
    console.log(chalk.green('Viewing configuration...'));
    
    try {
        // Load configuration
        const configPath = path.join(__dirname, '../data/config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Display configuration
        console.log(chalk.yellow('=== System Configuration ==='));
        console.log(`Name: ${config.system.name}`);
        console.log(`Version: ${config.system.version}`);
        console.log(`Description: ${config.system.description}`);
        console.log(`Theme: ${config.system.theme}`);
        console.log(`Debug: ${config.system.debug}`);
        console.log(`Log Level: ${config.system.logLevel}`);
        
        console.log(chalk.yellow('\n=== Contact Information ==='));
        console.log(`Email: ${config.contact.email}`);
        console.log(`Phone: ${config.contact.phone}`);
        console.log(`Address: ${config.contact.address}`);
        console.log(`Company: ${config.contact.company}`);
        console.log(`Registration: ${config.contact.registration}`);
        
        console.log(chalk.yellow('\n=== API Configuration ==='));
        console.log(`Base URL: ${config.api.baseUrl}`);
        console.log('Endpoints:');
        for (const [name, endpoint] of Object.entries(config.api.endpoints)) {
            console.log(`  ${name}: ${endpoint}`);
        }
        
        console.log(chalk.yellow('\n=== Integrations ==='));
        for (const [name, integration] of Object.entries(config.integrations)) {
            console.log(`${name}: ${integration.enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
        }
        
        console.log(chalk.yellow('\n=== Auto-Activated Plugins ==='));
        for (const plugin of config.plugins.autoActivate) {
            console.log(`- ${plugin}`);
        }
    } catch (error) {
        console.error(chalk.red('Error viewing configuration:'));
        console.error(error.message);
    }
}

/**
 * Display help information
 */
function displayHelp() {
    console.log(chalk.yellow('=== Available Commands ==='));
    console.log('help - Display this help information');
    console.log('exit, quit - Exit the application');
    console.log('/task <task> - Run a specific task');
    console.log('/logs <type> - View logs (tasks, errors, system, or all)');
    console.log('/config - View configuration');
    console.log('');
    console.log(chalk.yellow('=== Available Tasks ==='));
    console.log('syncBookings - Sync bookings with external systems');
    console.log('syncVehicles - Sync vehicles with external systems');
    console.log('generateReports - Generate reports');
    console.log('sendReminders - Send reminders for upcoming bookings');
    console.log('checkAvailability - Check vehicle availability');
    console.log('updatePricing - Update vehicle pricing');
    console.log('');
    console.log(chalk.yellow('=== AI Commands ==='));
    console.log('/booking list - List recent bookings');
    console.log('/booking find <reference> - Find a booking by reference');
    console.log('/vehicle list - List vehicles');
    console.log('/vehicle find <id> - Find a vehicle by ID');
    console.log('/marketing stats - Get marketing statistics');
}
