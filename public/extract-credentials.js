#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function extractCredentials() {
    console.log('🔍 Extracting credential names from workflow files...\n');
    
    const credentialNames = new Set();
    const credentialTypes = new Set();
    const credentialDetails = [];
    
    // Get all JSON files
    const exportDir = './exported-workflows';
    const files = fs.readdirSync(exportDir).filter(file => file.endsWith('.json'));
    
    files.forEach(file => {
        try {
            const filePath = path.join(exportDir, file);
            const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (workflowData.nodes) {
                workflowData.nodes.forEach(node => {
                    if (node.credentials) {
                        Object.keys(node.credentials).forEach(credType => {
                            const credConfig = node.credentials[credType];
                            if (credConfig.name) {
                                credentialNames.add(credConfig.name);
                                credentialTypes.add(credType);
                                
                                credentialDetails.push({
                                    workflow: workflowData.name,
                                    node: node.name,
                                    type: credType,
                                    name: credConfig.name
                                });
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.log(`⚠️  Error reading ${file}: ${error.message}`);
        }
    });
    
    console.log('📋 **CREDENTIAL NAMES TO RECREATE:**');
    console.log('=' .repeat(50));
    Array.from(credentialNames).sort().forEach(name => {
        console.log(`• ${name}`);
    });
    
    console.log('\n🔧 **CREDENTIAL TYPES NEEDED:**');
    console.log('=' .repeat(50));
    Array.from(credentialTypes).sort().forEach(type => {
        console.log(`• ${type}`);
    });
    
    console.log('\n🗂️  **DETAILED CREDENTIAL USAGE:**');
    console.log('=' .repeat(50));
    
    // Group by credential name
    const groupedByName = {};
    credentialDetails.forEach(detail => {
        if (!groupedByName[detail.name]) {
            groupedByName[detail.name] = [];
        }
        groupedByName[detail.name].push(detail);
    });
    
    Object.keys(groupedByName).sort().forEach(credName => {
        console.log(`\n📍 **${credName}** (${groupedByName[credName][0].type})`);
        console.log(`   Used in ${groupedByName[credName].length} places:`);
        groupedByName[credName].forEach(detail => {
            console.log(`   • ${detail.workflow} → ${detail.node}`);
        });
    });
    
    console.log('\n💡 **TO RESTORE CREDENTIALS:**');
    console.log('=' .repeat(50));
    console.log('1. Go to n8n → Settings → Credentials');
    console.log('2. Create new credentials for each type above');
    console.log('3. Use the EXACT same names listed above');
    console.log('4. Add your API keys/tokens to each credential');
    console.log('5. Test your workflows after setup');
    
    return {
        names: Array.from(credentialNames),
        types: Array.from(credentialTypes),
        details: credentialDetails
    };
}

extractCredentials(); 