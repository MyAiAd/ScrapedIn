// Test Webhook Data Reception - Debug Default Parameter Issue (Form Trigger Compatible)
// This will send data in the correct format for n8n Form Trigger

const WEBHOOK_URL = 'http://localhost:5678/webhook/56729510-e43f-4aee-9878-16043881f687';

// Form data format for n8n Form Trigger
const testData = {
    'Job Title': 'Test Frontend Manager',
    'Job Location': 'Test Frontend Location', 
    'Company Name': 'Test Frontend Company',
    'Published at': 'Past Week',
    'Job Type': 'Full-time',
    'On-site/Remote/Hybrid': 'Remote',
    'Experience Level': 'Mid-Senior Level',
    'Total Jobs to Scrape': '50'
};

console.log('🔬 Testing Form Trigger webhook with exact frontend data format...');
console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));

async function testWebhook() {
    try {
        console.log('🚀 Sending POST request to:', WEBHOOK_URL);
        
        // Create form data for Form Trigger
        const formData = new URLSearchParams();
        Object.entries(testData).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        console.log('📝 Form data string:', formData.toString());
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📥 Response body (first 500 chars):', responseText.substring(0, 500));

        if (response.ok) {
            console.log('✅ Form Trigger webhook request successful!');
            console.log('🔍 Check n8n workflow logs for the comprehensive debug output from "Format Search Query" node');
            console.log('🎯 Look for these key debug sections:');
            console.log('   1. COMPREHENSIVE WORKFLOW DEBUG START');
            console.log('   2. INDIVIDUAL FIELD ANALYSIS');
            console.log('   3. ENHANCED FIELD EXTRACTION');
            console.log('   4. DEFAULT USAGE ANALYSIS');
            console.log('   5. CRITICAL ISSUE IDENTIFIED (if defaults are used)');
        } else {
            console.error('❌ Webhook request failed:', response.status, response.statusText);
            
            if (response.status === 401) {
                console.error('🔐 Authentication issue:');
                console.error('   1. Form Trigger might require different authentication');
                console.error('   2. Workflow might not be active in n8n');
                console.error('   3. Check n8n settings for webhook authentication');
            }
        }

    } catch (error) {
        console.error('💥 Test failed:', error.message);
        
        if (error.message.includes('fetch')) {
            console.error('🔧 Troubleshooting:');
            console.error('   1. Is n8n running on localhost:5678?');
            console.error('   2. Is the workflow active in n8n?');
            console.error('   3. Is the webhook ID correct?');
            console.error('   4. Does the Form Trigger require authentication?');
        }
    }
}

// Also test with JSON format as fallback
async function testJsonWebhook() {
    try {
        console.log('\n🔄 Testing with JSON format as fallback...');
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        console.log('📥 JSON Response status:', response.status);
        
        if (response.ok) {
            console.log('✅ JSON format also works!');
        } else {
            console.log('❌ JSON format failed:', response.status);
        }

    } catch (error) {
        console.log('❌ JSON test failed:', error.message);
    }
}

// Run both tests
async function runTests() {
    await testWebhook();
    await testJsonWebhook();
}

runTests(); 