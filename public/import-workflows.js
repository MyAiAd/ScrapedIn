#!/usr/bin/env node

// Script to bulk import workflows into n8n via API
// Run this after setting up your admin account in n8n

const fs = require('fs');
const path = require('path');

const N8N_BASE_URL = 'http://localhost:5678';
const EXPORT_DIR = './exported-workflows';

// Authentication options - fill these in if needed
const AUTH_EMAIL = process.env.N8N_EMAIL || '';
const AUTH_PASSWORD = process.env.N8N_PASSWORD || '';
const API_KEY = process.env.N8N_API_KEY || '';

async function authenticate() {
    if (API_KEY) {
        console.log('🔑 Using API key authentication');
        return { 'X-N8N-API-KEY': API_KEY };
    }
    
    if (AUTH_EMAIL && AUTH_PASSWORD) {
        console.log('🔑 Attempting to authenticate with email/password...');
        try {
            const response = await fetch(`${N8N_BASE_URL}/rest/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: AUTH_EMAIL,
                    password: AUTH_PASSWORD
                })
            });

            if (response.ok) {
                const cookies = response.headers.get('set-cookie');
                console.log('✅ Authentication successful');
                return { 'Cookie': cookies };
            } else {
                console.error('❌ Authentication failed');
                return null;
            }
        } catch (error) {
            console.error('❌ Authentication error:', error.message);
            return null;
        }
    }
    
    console.log('⚠️  No authentication configured. Trying without auth...');
    return {};
}

function cleanWorkflowData(workflowData) {
    // Simple cleaning - just use the basic structure that works
    const cleanedData = {
        name: workflowData.name,
        nodes: workflowData.nodes || [],
        connections: workflowData.connections || {},
        settings: {}
    };
    
    return cleanedData;
}

async function importWorkflows() {
    console.log('🚀 Starting bulk workflow import...');
    
    // Check if export directory exists
    if (!fs.existsSync(EXPORT_DIR)) {
        console.error(`❌ Export directory not found: ${EXPORT_DIR}`);
        process.exit(1);
    }

    // Authenticate first
    const authHeaders = await authenticate();
    if (authHeaders === null) {
        console.error('❌ Authentication failed. Please check your credentials.');
        console.log('\n💡 Options:');
        console.log('1. Set environment variables: N8N_EMAIL and N8N_PASSWORD');
        console.log('2. Set API key: N8N_API_KEY');
        console.log('3. Use the n8n web interface to import manually');
        process.exit(1);
    }

    // Get all JSON files
    const files = fs.readdirSync(EXPORT_DIR).filter(file => file.endsWith('.json'));
    console.log(`📦 Found ${files.length} workflow files to import`);

    for (const file of files) {
        try {
            const filePath = path.join(EXPORT_DIR, file);
            const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Clean the workflow data
            const cleanedData = cleanWorkflowData(workflowData);
            
            console.log(`\n📤 Importing: ${cleanedData.name}`);
            
            // Import via n8n API
            const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify(cleanedData)
            });

            if (response.ok) {
                const result = await response.json();
                const workflowId = result.data?.id || result.id || 'unknown';
                console.log(`✅ Successfully imported: ${cleanedData.name} (ID: ${workflowId})`);
            } else {
                const error = await response.text();
                console.error(`❌ Failed to import ${cleanedData.name}: ${response.status} - ${error}`);
            }

        } catch (error) {
            console.error(`❌ Error importing ${file}:`, error.message);
        }
    }

    console.log('\n🎉 Bulk import completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to http://localhost:5678');
    console.log('2. Check your workflows are imported');
    console.log('3. Activate your LinkedIn Scraper workflow');
    console.log('4. Copy the new webhook URL and update config.js');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
    console.log('🔄 Installing node-fetch for Node.js compatibility...');
    try {
        const fetch = require('node-fetch');
        global.fetch = fetch;
        importWorkflows();
    } catch (e) {
        console.error('❌ Please install node-fetch: npm install node-fetch');
        console.error('Or use Node.js 18+ which has fetch built-in');
        process.exit(1);
    }
} else {
    importWorkflows();
} 