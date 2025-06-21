#!/usr/bin/env node

// Script to export all workflows from n8n SQLite database
// This preserves your workflows while we fix the database issue

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.env.HOME, '.n8n', 'database.sqlite');
const EXPORT_DIR = './exported-workflows';

// Create export directory
if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

console.log('🔄 Connecting to n8n database...');
console.log('Database:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

// Query to get all workflows
const query = `
    SELECT id, name, nodes, connections, staticData, settings, pinData, versionId
    FROM workflow_entity
    ORDER BY name
`;

db.all(query, [], (err, rows) => {
    if (err) {
        console.error('❌ Error querying workflows:', err.message);
        return;
    }

    console.log(`📦 Found ${rows.length} workflows to export`);

    rows.forEach((workflow, index) => {
        try {
            // Create n8n workflow JSON structure
            const workflowData = {
                meta: {
                    instanceId: "localhost"
                },
                id: workflow.id,
                name: workflow.name,
                nodes: JSON.parse(workflow.nodes || '[]'),
                connections: JSON.parse(workflow.connections || '{}'),
                staticData: JSON.parse(workflow.staticData || '{}'),
                settings: JSON.parse(workflow.settings || '{}'),
                pinData: JSON.parse(workflow.pinData || '{}'),
                versionId: workflow.versionId
            };

            // Safe filename (remove special characters)
            const safeFilename = workflow.name
                .replace(/[^a-zA-Z0-9\s-_]/g, '')
                .replace(/\s+/g, '_')
                .toLowerCase();
            
            const filename = `${index + 1}_${safeFilename}.json`;
            const filepath = path.join(EXPORT_DIR, filename);

            fs.writeFileSync(filepath, JSON.stringify(workflowData, null, 2));
            console.log(`✅ Exported: ${workflow.name} → ${filename}`);

        } catch (error) {
            console.error(`❌ Error exporting workflow "${workflow.name}":`, error.message);
        }
    });

    console.log(`\n🎉 Export complete! ${rows.length} workflows saved to: ${EXPORT_DIR}`);
    console.log('\n📋 Next steps:');
    console.log('1. Fix n8n database issue');
    console.log('2. Start fresh n8n instance'); 
    console.log('3. Import workflows from the exported JSON files');
    
    db.close();
});

db.on('error', (err) => {
    console.error('❌ Database error:', err.message);
}); 