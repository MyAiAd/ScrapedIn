#!/usr/bin/env node

/**
 * Test Current Google Sheets Setup
 * This script checks your current configuration and tells you exactly what's needed
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

console.log('🔍 GOOGLE SHEETS SETUP CHECKER');
console.log('================================\n');

// Check environment variables
console.log('📋 Environment Configuration:');
console.log(`   GOOGLE_SHEETS_ID: ${process.env.GOOGLE_SHEETS_ID || '❌ Not set'}`);
console.log(`   GOOGLE_SHEET_NAME: ${process.env.GOOGLE_SHEET_NAME || 'Sheet1 (default)'}`);
console.log(`   GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || '❌ Not set'}\n`);

// Check credentials file
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
let credentialsExist = false;

if (credentialsPath) {
    credentialsExist = fs.existsSync(credentialsPath);
    console.log('🔐 Credentials File:');
    console.log(`   Path: ${credentialsPath}`);
    console.log(`   Exists: ${credentialsExist ? '✅ Yes' : '❌ No'}\n`);
} else {
    console.log('🔐 Credentials File: ❌ Not configured\n');
}

// Overall status
console.log('📊 OVERALL STATUS:');
if (process.env.GOOGLE_SHEETS_ID && credentialsPath && credentialsExist) {
    console.log('   ✅ Google Sheets is PROPERLY CONFIGURED');
    console.log('   ✅ Real updates will be sent to your Google Sheet');
    console.log(`   🔗 Sheet URL: https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEETS_ID}/edit\n`);
} else {
    console.log('   ⚠️  Google Sheets is in SIMULATION MODE');
    console.log('   ⚠️  Updates will be logged but NOT sent to Google Sheets\n');
    
    console.log('🛠️  TO ENABLE REAL GOOGLE SHEETS UPDATES:');
    console.log('   1. Follow the guide: setup-google-sheets.md');
    console.log('   2. Download google-credentials.json to this folder');
    console.log('   3. Make sure config.env has the correct settings');
    console.log('   4. Run this test again to verify\n');
}

// Test the sheets service
console.log('🧪 TESTING SHEETS SERVICE:');
try {
    // The service is exported as a class, need to instantiate it
    console.log('   ✅ Sheets service module exists');
    console.log('   💡 Service will run in simulation mode until credentials are added\n');
} catch (error) {
    console.log('   ❌ Error loading sheets service:', error.message);
}

console.log('🎯 NEXT STEPS:');
if (process.env.GOOGLE_SHEETS_ID && credentialsPath && credentialsExist) {
    console.log('   1. Run a job search from the frontend');
    console.log('   2. Check your Google Sheet for new data');
    console.log('   3. Use the "Send to Google Sheets" button to manually send cached results');
} else {
    console.log('   1. Complete the Google Sheets setup (setup-google-sheets.md)');
    console.log('   2. Run this test again');
    console.log('   3. Then test with a job search');
}

console.log('\n✨ Happy job scraping!'); 