/**
 * AmriTravel System - Vercel Deployment Script
 * 
 * This script automates the process of committing, pushing, and deploying
 * the application to Vercel when files are updated in VSCode.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const config = {
  githubRepo: 'your-github-username/amritravel-system',
  vercelProjectId: 'your-vercel-project-id',
  branch: 'main',
  commitMessage: 'Auto-deploy: Updates from VSCode',
  watchFolders: ['pages', 'scripts', 'integrations', 'api', 'assets'],
  excludeFiles: ['.DS_Store', '.env.local', 'node_modules'],
  deploymentTimeout: 180000, // 3 minutes
};

// Load environment variables
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

if (!GITHUB_TOKEN || !VERCEL_TOKEN) {
  console.error('Error: GITHUB_TOKEN and VERCEL_TOKEN must be set in .env file');
  process.exit(1);
}

// Track file changes
let changedFiles = [];
let isDeploying = false;
let deploymentTimer = null;

/**
 * Execute a shell command and return the output
 * @param {string} command - The command to execute
 * @returns {Promise<string>} - The command output
 */
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}`);
        console.error(stderr);
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Check if the repository has changes
 * @returns {Promise<boolean>} - True if there are changes
 */
async function hasChanges() {
  try {
    const status = await executeCommand('git status --porcelain');
    return status.length > 0;
  } catch (error) {
    console.error('Error checking for changes:', error);
    return false;
  }
}

/**
 * Commit and push changes to GitHub
 * @returns {Promise<boolean>} - True if successful
 */
async function commitAndPush() {
  try {
    // Add all changes
    await executeCommand('git add .');
    
    // Create commit with changed files in message
    const filesStr = changedFiles.length > 5 
      ? `${changedFiles.slice(0, 5).join(', ')} and ${changedFiles.length - 5} more files` 
      : changedFiles.join(', ');
    
    const commitMsg = `${config.commitMessage}: ${filesStr}`;
    await executeCommand(`git commit -m "${commitMsg}"`);
    
    // Push to GitHub
    await executeCommand(`git push origin ${config.branch}`);
    
    console.log('Successfully pushed changes to GitHub');
    return true;
  } catch (error) {
    console.error('Error committing and pushing changes:', error);
    return false;
  }
}

/**
 * Trigger a deployment on Vercel
 * @returns {Promise<boolean>} - True if deployment was triggered
 */
async function triggerVercelDeployment() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v1/projects/${config.vercelProjectId}/deployments`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const response = JSON.parse(data);
          console.log(`Deployment triggered: ${response.url}`);
          resolve(true);
        } else {
          console.error(`Error triggering deployment: ${res.statusCode}`);
          console.error(data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error triggering Vercel deployment:', error);
      reject(error);
    });
    
    req.write(JSON.stringify({
      target: config.branch,
      gitSource: {
        type: 'github',
        repo: config.githubRepo,
        ref: config.branch
      }
    }));
    
    req.end();
  });
}

/**
 * Deploy the application
 */
async function deploy() {
  if (isDeploying) return;
  
  isDeploying = true;
  console.log('Starting deployment process...');
  
  try {
    // Check if there are changes to commit
    const changes = await hasChanges();
    if (!changes) {
      console.log('No changes to deploy');
      isDeploying = false;
      return;
    }
    
    // Commit and push changes
    const pushed = await commitAndPush();
    if (!pushed) {
      console.error('Failed to push changes');
      isDeploying = false;
      return;
    }
    
    // Trigger Vercel deployment
    const deployed = await triggerVercelDeployment();
    if (!deployed) {
      console.error('Failed to trigger deployment');
      isDeploying = false;
      return;
    }
    
    console.log('Deployment process completed successfully');
    changedFiles = [];
  } catch (error) {
    console.error('Error during deployment:', error);
  } finally {
    isDeploying = false;
  }
}

/**
 * Watch for file changes
 */
function watchFiles() {
  config.watchFolders.forEach(folder => {
    const folderPath = path.join(__dirname, folder);
    
    if (!fs.existsSync(folderPath)) {
      console.warn(`Warning: Folder ${folder} does not exist`);
      return;
    }
    
    fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
      if (!filename || config.excludeFiles.includes(filename)) return;
      
      const filePath = path.join(folder, filename);
      if (!changedFiles.includes(filePath)) {
        changedFiles.push(filePath);
        console.log(`File changed: ${filePath}`);
        
        // Reset deployment timer
        if (deploymentTimer) {
          clearTimeout(deploymentTimer);
        }
        
        // Schedule deployment after a delay
        deploymentTimer = setTimeout(() => {
          deploy();
        }, 5000); // Wait 5 seconds after last file change
      }
    });
    
    console.log(`Watching folder: ${folder}`);
  });
}

// Start watching files
console.log('Starting Vercel deployment watcher...');
watchFiles();
console.log('Watcher started. Waiting for file changes...');
