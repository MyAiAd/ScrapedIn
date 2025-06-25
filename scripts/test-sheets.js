#!/usr/bin/env node

// Test script for Google Sheets integration
require('dotenv').config({ path: './config.env' });
const sheetsService = require('./services/sheetsService');

async function testGoogleSheets() {
    console.log('🧪 Testing Google Sheets Integration...\n');
    
    try {
        // Test 1: Initialize the service
        console.log('1️⃣ Testing initialization...');
        const initResult = await sheetsService.initializeSheets();
        console.log(`   Result: ${initResult ? '✅ Success' : '❌ Failed'}\n`);
        
        // Test 2: Test connection
        console.log('2️⃣ Testing connection...');
        const connectionResult = await sheetsService.testSheetsConnection();
        console.log(`   Result: ${connectionResult ? '✅ Success' : '❌ Failed'}\n`);
        
        // Test 3: Ensure headers
        console.log('3️⃣ Testing headers setup...');
        const headersResult = await sheetsService.ensureHeaders();
        console.log(`   Result: ${headersResult ? '✅ Success' : '❌ Failed'}\n`);
        
        // Test 4: Save a test job
        console.log('4️⃣ Testing job save...');
        const testJob = {
            id: 'test-' + Date.now(),
            title: 'Test Software Engineer Position',
            company: 'Test Company Ltd',
            location: 'London, UK',
            jobUrl: 'https://linkedin.com/jobs/view/test-123456',
            posterProfileUrl: 'https://linkedin.com/in/test-user',
            posterFullName: 'Test User',
            contractType: 'Full-time',
            publishedAt: '2025-06-16',
            emailContent: {
                subject: 'Test Email Subject'
            }
        };
        
        const saveResult = await sheetsService.saveJobToSheet(testJob);
        console.log(`   Result: ${saveResult ? '✅ Success' : '❌ Failed'}\n`);
        
        // Summary
        console.log('📊 Test Summary:');
        console.log(`   Sheet URL: ${sheetsService.getSheetUrl()}`);
        console.log(`   Sheet ID: ${process.env.GOOGLE_SHEETS_ID}`);
        console.log(`   Sheet Name: ${process.env.GOOGLE_SHEET_NAME || 'Sheet1'}`);
        
        if (initResult && saveResult) {
            console.log('\n🎉 Google Sheets integration is working correctly!');
            console.log('   Check your sheet to see the test data.');
        } else {
            console.log('\n⚠️ Google Sheets integration needs configuration.');
            console.log('   Please follow the setup guide in setup-google-sheets.md');
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('\n💡 Troubleshooting tips:');
        console.log('   1. Make sure you have set up Google Sheets API credentials');
        console.log('   2. Check that your sheet is shared with the service account');
        console.log('   3. Verify the GOOGLE_SHEETS_ID in config.env is correct');
        console.log('   4. See setup-google-sheets.md for detailed instructions');
    }
}

// Run the test
testGoogleSheets(); 