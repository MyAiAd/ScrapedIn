#!/usr/bin/env node

// Simple webhook test script
// Run this to test if your n8n webhook is working
// Usage: node test-webhook.js [localhost]

const https = require('https');
const http = require('http');

// Check if user wants to test localhost
const useLocalhost = process.argv.includes('localhost') || process.argv.includes('local');

// Webhook URLs
const WEBHOOK_ID = '56729510-e43f-4aee-9878-16043881f687';
const NGROK_URL = `https://myva.ngrok.app/webhook/${WEBHOOK_ID}`;
const LOCALHOST_URL = `http://localhost:5678/webhook/${WEBHOOK_ID}`;

const WEBHOOK_URL = useLocalhost ? LOCALHOST_URL : NGROK_URL;

const testData = {
    'Job Title': 'Finance Manager',
    'Job Location': 'London, UK',
    'Company Name': '',
    'Published at': 'Past Week',
    'Job Type': 'Full-time',
    'On-site/Remote/Hybrid': 'On-site',
    'Experience Level': 'Associate'
};

console.log('🧪 Testing webhook connection...');
console.log(`📡 Mode: ${useLocalhost ? 'LOCALHOST' : 'NGROK'}`);
console.log('URL:', WEBHOOK_URL);
console.log('Data:', JSON.stringify(testData, null, 2));
console.log('');

const url = new URL(WEBHOOK_URL);
const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LinkedIn-Scraper-Test/1.0'
    }
};

const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
    console.log(`✅ Response Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    console.log('');

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('📦 Response Body:');
        try {
            const jsonData = JSON.parse(data);
            console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.log(data);
        }
        
        if (res.statusCode === 200) {
            console.log('\n🎉 SUCCESS! Webhook is working correctly.');
        } else if (res.statusCode === 404) {
            console.log('\n❌ ERROR: Webhook not found (404)');
            console.log('💡 Fix: Check the webhook ID in your n8n workflow');
        } else {
            console.log(`\n❌ ERROR: Unexpected status code ${res.statusCode}`);
        }
    });
});

req.on('error', (error) => {
    console.log(`❌ CONNECTION ERROR: ${error.message}`);
    console.log('');
    console.log('🔧 Possible fixes:');
    console.log('1. Check if ngrok is running: ngrok http 5678');
    console.log('2. Verify n8n is running on port 5678');
    console.log('3. Make sure your n8n workflow is activated');
    console.log('4. Check the webhook URL in config.js');
});

req.write(JSON.stringify(testData));
req.end(); 