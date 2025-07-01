const fs = require('fs').promises;
const path = require('path');
const mjml = require('mjml');

// Directory to store MJML templates
const TEMPLATES_DIR = path.join('/tmp', 'mjml-templates');

// Ensure templates directory exists
async function ensureTemplatesDir() {
    try {
        await fs.access(TEMPLATES_DIR);
    } catch (error) {
        await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    }
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const { name, mjml: mjmlCode, description = '' } = req.body;

        if (!name || !mjmlCode) {
            return res.status(400).json({ 
                success: false, 
                error: 'Template name and MJML code are required' 
            });
        }

        await ensureTemplatesDir();

        // Validate MJML before saving
        const result = mjml(mjmlCode, { validationLevel: 'soft' });
        if (!result.html) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid MJML code' 
            });
        }

        // Create template object
        const template = {
            name,
            description,
            mjml: mjmlCode,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };

        // Save to file
        const filename = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        const filepath = path.join(TEMPLATES_DIR, filename);
        
        await fs.writeFile(filepath, JSON.stringify(template, null, 2));

        console.log(`Template saved: ${filename}`);

        res.json({ 
            success: true, 
            message: 'Template saved successfully',
            filename 
        });
        
    } catch (error) {
        console.error('Template save error:', error);
        res.status(500).json({ 
            success: false, 
            error: `Failed to save template: ${error.message}` 
        });
    }
}; 