/**
 * AmriTravel System - AI Assistant Dashboard
 * 
 * This script provides the functionality for the AI Assistant web dashboard,
 * allowing administrators to interact with the AI assistant, manage tasks,
 * and view system logs through a user-friendly interface.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the dashboard
    initDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
});

/**
 * Initialize the dashboard
 */
function initDashboard() {
    console.log('Initializing AI Assistant Dashboard...');
    
    // Check if user is authenticated
    checkAuthentication();
}

/**
 * Check if the user is authenticated
 */
function checkAuthentication() {
    // For demo purposes, we'll assume the user is authenticated
    // In a real implementation, this would check for a valid session
    
    // If not authenticated, redirect to login page
    // window.location.href = '/login';
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Tab navigation
    const tabLinks = document.querySelectorAll('.sidebar-menu a[data-tab]');
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Refresh button
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadDashboardData();
        });
    }
    
    // Chat input
    const chatInput = document.getElementById('chat-input-field');
    const chatSendBtn = document.getElementById('chat-send-btn');
    
    if (chatInput && chatSendBtn) {
        // Send message on button click
        chatSendBtn.addEventListener('click', function() {
            sendChatMessage();
        });
        
        // Send message on Enter key
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Run task button
    const runTaskBtn = document.getElementById('run-task-btn');
    if (runTaskBtn) {
        runTaskBtn.addEventListener('click', function() {
            runTask();
        });
    }
    
    // Log type tabs
    const logTypeBtns = document.querySelectorAll('.tab-button[data-log-type]');
    logTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const logType = this.getAttribute('data-log-type');
            switchLogType(logType);
        });
    });
    
    // Settings form
    const temperatureSlider = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperature-value');
    
    if (temperatureSlider && temperatureValue) {
        temperatureSlider.addEventListener('input', function() {
            temperatureValue.textContent = this.value;
        });
    }
    
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            saveSettings();
        });
    }
}

/**
 * Switch between tabs
 * @param {string} tabId - The ID of the tab to switch to
 */
function switchTab(tabId) {
    // Update active tab link
    const tabLinks = document.querySelectorAll('.sidebar-menu a[data-tab]');
    tabLinks.forEach(link => {
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Update active tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // Load tab-specific data
    if (tabId === 'chat') {
        loadChatHistory();
    } else if (tabId === 'tasks') {
        loadTasks();
    } else if (tabId === 'logs') {
        loadLogs('all');
    } else if (tabId === 'settings') {
        loadSettings();
    }
}

/**
 * Switch between log types
 * @param {string} logType - The type of logs to display
 */
function switchLogType(logType) {
    // Update active log type button
    const logTypeBtns = document.querySelectorAll('.tab-button[data-log-type]');
    logTypeBtns.forEach(btn => {
        if (btn.getAttribute('data-log-type') === logType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Load logs of the selected type
    loadLogs(logType);
}

/**
 * Load dashboard data
 */
function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // Show loading state
    showLoading();
    
    // Load system information
    loadSystemInfo();
    
    // Load statistics
    loadStatistics();
    
    // Load recent errors
    loadRecentErrors();
    
    // Hide loading state
    hideLoading();
}

/**
 * Show loading state
 */
function showLoading() {
    // Add loading indicators or disable interactive elements
    document.querySelector('.refresh-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    document.querySelector('.refresh-btn').disabled = true;
}

/**
 * Hide loading state
 */
function hideLoading() {
    // Remove loading indicators and re-enable interactive elements
    document.querySelector('.refresh-btn').innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    document.querySelector('.refresh-btn').disabled = false;
}

/**
 * Load system information
 */
function loadSystemInfo() {
    // In a real implementation, this would fetch data from the server
    // For demo purposes, we'll use hardcoded values
    
    document.getElementById('system-version').textContent = '1.0.0';
    document.getElementById('system-status').textContent = 'Online';
    document.getElementById('system-last-update').textContent = new Date().toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Load statistics
 */
function loadStatistics() {
    // In a real implementation, this would fetch data from the server
    // For demo purposes, we'll use hardcoded values
    
    document.getElementById('active-tasks').textContent = '6';
    document.getElementById('completed-tasks').textContent = '24';
    document.getElementById('error-rate').textContent = '2.5%';
    document.getElementById('chat-sessions').textContent = '12';
}

/**
 * Load recent errors
 */
function loadRecentErrors() {
    // In a real implementation, this would fetch data from the server
    // For demo purposes, we'll use hardcoded values
    
    const recentErrorsContainer = document.getElementById('recent-errors');
    
    // Sample error logs
    const errorLogs = [
        {
            timestamp: '2023-06-15T08:01:15.000Z',
            message: 'Error syncing booking AT-12345678: API request failed with status 429'
        },
        {
            timestamp: '2023-06-15T09:01:30.000Z',
            message: 'Error sending reminder for booking AT-23456789: Invalid phone number format'
        }
    ];
    
    // Clear container
    recentErrorsContainer.innerHTML = '';
    
    // Add error logs
    errorLogs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = new Date(log.timestamp);
        const formattedTimestamp = timestamp.toLocaleString();
        
        logEntry.innerHTML = `
            <div class="log-timestamp">${formattedTimestamp}</div>
            <div class="log-message">
                <span class="log-type errors">ERROR</span>
                ${log.message}
            </div>
        `;
        
        recentErrorsContainer.appendChild(logEntry);
    });
    
    // If no errors, show a message
    if (errorLogs.length === 0) {
        recentErrorsContainer.innerHTML = '<p>No recent errors.</p>';
    }
}

/**
 * Load chat history
 */
function loadChatHistory() {
    // In a real implementation, this would fetch data from the server
    // For demo purposes, we'll use hardcoded values
    
    const chatMessagesContainer = document.getElementById('chat-messages');
    
    // Sample chat messages
    const chatMessages = [
        {
            role: 'assistant',
            content: 'Hello! How can I help you today?'
        },
        {
            role: 'user',
            content: 'Show me the latest bookings'
        },
        {
            role: 'assistant',
            content: 'Here are the latest bookings:\n\n- AT-12345678: John Doe (Toyota Vios, 2023-06-20 to 2023-06-25)\n- AT-23456789: Jane Smith (Honda City, 2023-06-22 to 2023-06-24)\n- AT-34567890: Bob Johnson (Perodua Myvi, 2023-06-25 to 2023-06-30)'
        }
    ];
    
    // Clear container
    chatMessagesContainer.innerHTML = '';
    
    // Add chat messages
    chatMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;
        
        messageElement.innerHTML = `
            <div class="message-content">
                ${message.content.replace(/\n/g, '<br>')}
            </div>
        `;
        
        chatMessagesContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

/**
 * Send a chat message
 */
function sendChatMessage() {
    const chatInput = document.getElementById('chat-input-field');
    const message = chatInput.value.trim();
    
    if (message === '') {
        return;
    }
    
    // Clear input
    chatInput.value = '';
    
    // Add user message to chat
    const chatMessagesContainer = document.getElementById('chat-messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message user';
    
    messageElement.innerHTML = `
        <div class="message-content">
            ${message.replace(/\n/g, '<br>')}
        </div>
    `;
    
    chatMessagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    
    // In a real implementation, this would send the message to the server
    // and wait for a response
    // For demo purposes, we'll simulate a response after a short delay
    
    setTimeout(() => {
        // Add assistant message to chat
        const responseElement = document.createElement('div');
        responseElement.className = 'message assistant';
        
        // Process commands
        let response = '';
        
        if (message.startsWith('/booking list')) {
            response = 'Here are the latest bookings:\n\n- AT-12345678: John Doe (Toyota Vios, 2023-06-20 to 2023-06-25)\n- AT-23456789: Jane Smith (Honda City, 2023-06-22 to 2023-06-24)\n- AT-34567890: Bob Johnson (Perodua Myvi, 2023-06-25 to 2023-06-30)';
        } else if (message.startsWith('/vehicle list')) {
            response = 'Here are the available vehicles:\n\n- Toyota Vios (5 units)\n- Honda City (3 units)\n- Perodua Myvi (7 units)\n- Proton X50 (2 units)\n- Honda Civic (1 unit)';
        } else if (message.startsWith('/help')) {
            response = 'Available commands:\n\n- /booking list - List recent bookings\n- /booking find <reference> - Find a booking by reference\n- /vehicle list - List vehicles\n- /vehicle find <id> - Find a vehicle by ID\n- /marketing stats - Get marketing statistics\n- /help - Show this help message';
        } else {
            response = 'I\'m processing your request. Please wait a moment...';
        }
        
        responseElement.innerHTML = `
            <div class="message-content">
                ${response.replace(/\n/g, '<br>')}
            </div>
        `;
        
        chatMessagesContainer.appendChild(responseElement);
        
        // Scroll to bottom
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }, 1000);
}

/**
 * Load tasks
 */
function loadTasks() {
    // In a real implementation, this would fetch data from the server
    // For demo purposes, we'll use hardcoded values
    
    const tasksContainer = document.getElementById('scheduled-tasks');
    
    // Sample tasks
    const tasks = [
        {
            name: 'syncBookings',
            description: 'Sync bookings with external systems',
            schedule: '0 */2 * * *',
            icon: 'fa-calendar-check'
        },
        {
            name: 'syncVehicles',
            description: 'Sync vehicles with external systems',
            schedule: '0 */4 * * *',
            icon: 'fa-car'
        },
        {
            name: 'generateReports',
            description: 'Generate reports',
            schedule: '0 8 * * 1',
            icon: 'fa-chart-bar'
        },
        {
            name: 'sendReminders',
            description: 'Send reminders for upcoming bookings',
            schedule: '0 9 * * *',
            icon: 'fa-bell'
        },
        {
            name: 'checkAvailability',
            description: 'Check vehicle availability',
            schedule: '0 */6 * * *',
            icon: 'fa-check-circle'
        },
        {
            name: 'updatePricing',
            description: 'Update vehicle pricing',
            schedule: '0 0 * * *',
            icon: 'fa-tag'
        }
    ];
    
    // Clear container
    tasksContainer.innerHTML = '';
    
    // Add task cards
    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        
        taskCard.innerHTML = `
            <h3><i class="fas ${task.icon}"></i> ${task.name}</h3>
            <p>${task.description}</p>
            <div class="schedule"><strong>Schedule:</strong> ${task.schedule}</div>
            <div class="actions">
                <button class="run-task-btn" data-task="${task.name}">Run Now</button>
            </div>
        `;
        
        tasksContainer.appendChild(taskCard);
    });
    
    // Add event listeners to run task buttons
    const runTaskBtns = document.querySelectorAll('.run-task-btn');
    runTaskBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const taskName = this.getAttribute('data-task');
            runSpecificTask(taskName);
        });
    });
}

/**
 * Run a specific task
 * @param {string} taskName - The name of the task to run
 */
function runSpecificTask(taskName) {
    console.log(`Running task: ${taskName}...`);
    
    // In a real implementation, this would send a request to the server
    // For demo purposes, we'll just show an alert
    
    alert(`Task ${taskName} has been started.`);
}

/**
 * Run the selected task
 */
function runTask() {
    const taskSelect = document.getElementById('task-select');
    const taskName = taskSelect.value;
    
    if (taskName === '') {
        alert('Please select a task to run.');
        return;
    }
    
    runSpecificTask(taskName);
}

/**
 * Load logs
 * @param {string} logType - The type of logs to load
 */
function loadLogs(logType) {
    // In a real implementation, this would fetch data from the server
    // For demo purposes, we'll use hardcoded values
    
    const logsContainer = document.getElementById('logs-container');
    
    // Sample logs
    const logs = {
        system: [
            {
                timestamp: '2023-06-15T07:59:00.000Z',
                message: 'AI Assistant started'
            },
            {
                timestamp: '2023-06-15T07:59:05.000Z',
                message: 'Tasks loaded and scheduled successfully'
            },
            {
                timestamp: '2023-06-15T07:59:10.000Z',
                message: 'Task registered: syncBookings'
            }
        ],
        tasks: [
            {
                timestamp: '2023-06-15T08:00:00.000Z',
                message: 'Starting scheduled task: syncBookings'
            },
            {
                timestamp: '2023-06-15T08:01:30.000Z',
                message: 'Completed scheduled task: syncBookings'
            },
            {
                timestamp: '2023-06-15T08:02:00.000Z',
                message: 'Starting scheduled task: syncVehicles'
            }
        ],
        errors: [
            {
                timestamp: '2023-06-15T08:01:15.000Z',
                message: 'Error syncing booking AT-12345678: API request failed with status 429'
            },
            {
                timestamp: '2023-06-15T09:01:30.000Z',
                message: 'Error sending reminder for booking AT-23456789: Invalid phone number format'
            }
        ]
    };
    
    // Clear container
    logsContainer.innerHTML = '';
    
    // Determine which logs to show
    let logsToShow = [];
    
    if (logType === 'all') {
        // Combine all logs and sort by timestamp
        logsToShow = [
            ...logs.system.map(log => ({ ...log, type: 'system' })),
            ...logs.tasks.map(log => ({ ...log, type: 'tasks' })),
            ...logs.errors.map(log => ({ ...log, type: 'errors' }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
        // Show only logs of the selected type
        logsToShow = logs[logType].map(log => ({ ...log, type: logType }));
    }
    
    // Add logs
    logsToShow.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = new Date(log.timestamp);
        const formattedTimestamp = timestamp.toLocaleString();
        
        logEntry.innerHTML = `
            <div class="log-timestamp">${formattedTimestamp}</div>
            <div class="log-message">
                <span class="log-type ${log.type}">${log.type.toUpperCase()}</span>
                ${log.message}
            </div>
        `;
        
        logsContainer.appendChild(logEntry);
    });
    
    // If no logs, show a message
    if (logsToShow.length === 0) {
        logsContainer.innerHTML = '<p>No logs found.</p>';
    }
}

/**
 * Load settings
 */
function loadSettings() {
    // In a real implementation, this would fetch data from the server
    // For demo purposes, we'll use hardcoded values
    
    document.getElementById('ai-model').value = 'gpt-4';
    document.getElementById('max-tokens').value = '2000';
    document.getElementById('temperature').value = '0.7';
    document.getElementById('temperature-value').textContent = '0.7';
}

/**
 * Save settings
 */
function saveSettings() {
    const aiModel = document.getElementById('ai-model').value;
    const maxTokens = document.getElementById('max-tokens').value;
    const temperature = document.getElementById('temperature').value;
    
    console.log('Saving settings...');
    console.log('AI Model:', aiModel);
    console.log('Max Tokens:', maxTokens);
    console.log('Temperature:', temperature);
    
    // In a real implementation, this would send the settings to the server
    // For demo purposes, we'll just show an alert
    
    alert('Settings saved successfully.');
}
