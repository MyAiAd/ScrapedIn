#!/usr/bin/env node

const fs = require('fs');

const N8N_BASE_URL = 'http://localhost:5678';
const API_KEY = process.env.N8N_API_KEY;

async function testSingleImport() {
    if (!API_KEY) {
        console.log('Please set N8N_API_KEY environment variable');
        process.exit(1);
    }

    // Read the first workflow file
    const workflowFile = 'exported-workflows/8_my_workflow_3.json'; // This one seemed small
    const workflowData = JSON.parse(fs.readFileSync(workflowFile, 'utf8'));
    
    console.log('Original workflow structure:');
    console.log('- Name:', workflowData.name);
    console.log('- Has nodes:', !!workflowData.nodes);
    console.log('- Node count:', workflowData.nodes?.length || 0);
    console.log('- Has connections:', !!workflowData.connections);
    
    // Try minimal structure
    const minimalData = {
        name: workflowData.name + ' - Test Import',
        nodes: workflowData.nodes || [],
        connections: workflowData.connections || {},
        settings: {}
    };
    
    console.log('\nAttempting import...');
    
    try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': API_KEY
            },
            body: JSON.stringify(minimalData)
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ SUCCESS! Imported workflow ID:', result.data?.id || result.id);
            console.log('Full response:', JSON.stringify(result, null, 2));
        } else {
            const error = await response.text();
            console.log('❌ FAILED:', error);
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
    }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
    const fetch = require('node-fetch');
    global.fetch = fetch;
}

testSingleImport(); 