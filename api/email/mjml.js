const mjml = require('mjml');
const fs = require('fs').promises;
const path = require('path');

// Directory to store MJML templates
const TEMPLATES_DIR = path.join(process.cwd(), 'mjml-templates');

// Ensure templates directory exists
async function ensureTemplatesDir() {
    try {
        await fs.access(TEMPLATES_DIR);
    } catch (error) {
        await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    }
}

// Handle requests to /api/email/mjml/*
async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { path: apiPath } = req.query;
    const endpoint = Array.isArray(apiPath) ? apiPath.join('/') : apiPath;

    try {
        switch (endpoint) {
            case 'compile':
                await handleCompile(req, res);
                break;
            case 'save':
                await handleSave(req, res);
                break;
            case 'load':
                await handleLoad(req, res);
                break;
            case 'list':
                await handleList(req, res);
                break;
            case 'delete':
                await handleDelete(req, res);
                break;
            default:
                res.status(404).json({ success: false, error: 'Endpoint not found' });
        }
    } catch (error) {
        console.error('MJML API Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error: ' + error.message 
        });
    }
}

// Compile MJML to HTML
async function handleCompile(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { mjml: mjmlCode, deviceView = 'desktop' } = req.body;

    if (!mjmlCode) {
        return res.status(400).json({ success: false, error: 'MJML code is required' });
    }

    try {
        // Compile MJML to HTML
        const result = mjml(mjmlCode, {
            validationLevel: 'soft',
            filePath: process.cwd(),
            minify: false
        });

        if (result.errors && result.errors.length > 0) {
            console.warn('MJML compilation warnings:', result.errors);
        }

        // Add responsive CSS for mobile view if needed
        let html = result.html;
        if (deviceView === 'mobile') {
            html = html.replace(
                '<style type="text/css">',
                `<style type="text/css">
                    @media only screen and (max-width: 480px) {
                        .mj-column-per-100 { width: 100% !important; max-width: 100% !important; }
                        .mj-column-per-50 { width: 100% !important; max-width: 100% !important; }
                        .mj-column-per-33 { width: 100% !important; max-width: 100% !important; }
                        .mj-column-per-25 { width: 100% !important; max-width: 100% !important; }
                    }`
            );
        }

        res.json({ 
            success: true, 
            html: html,
            warnings: result.errors || []
        });
    } catch (error) {
        console.error('MJML compilation error:', error);
        res.status(400).json({ 
            success: false, 
            error: `MJML compilation failed: ${error.message}` 
        });
    }
}

// Save MJML template
async function handleSave(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { name, mjml: mjmlCode, description = '' } = req.body;

    if (!name || !mjmlCode) {
        return res.status(400).json({ 
            success: false, 
            error: 'Template name and MJML code are required' 
        });
    }

    try {
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
}

// Load MJML template
async function handleLoad(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { filename } = req.query;

    if (!filename) {
        return res.status(400).json({ 
            success: false, 
            error: 'Template filename is required' 
        });
    }

    try {
        const filepath = path.join(TEMPLATES_DIR, filename);
        const templateData = await fs.readFile(filepath, 'utf8');
        const template = JSON.parse(templateData);

        res.json({ 
            success: true, 
            template 
        });
    } catch (error) {
        console.error('Template load error:', error);
        res.status(404).json({ 
            success: false, 
            error: 'Template not found' 
        });
    }
}

// List all MJML templates
async function handleList(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        await ensureTemplatesDir();
        
        const files = await fs.readdir(TEMPLATES_DIR);
        const templates = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const filepath = path.join(TEMPLATES_DIR, file);
                    const templateData = await fs.readFile(filepath, 'utf8');
                    const template = JSON.parse(templateData);
                    
                    templates.push({
                        filename: file,
                        name: template.name,
                        description: template.description,
                        created: template.created,
                        modified: template.modified
                    });
                } catch (error) {
                    console.warn(`Failed to read template ${file}:`, error);
                }
            }
        }

        res.json({ 
            success: true, 
            templates: templates.sort((a, b) => new Date(b.modified) - new Date(a.modified))
        });
    } catch (error) {
        console.error('Templates list error:', error);
        res.status(500).json({ 
            success: false, 
            error: `Failed to list templates: ${error.message}` 
        });
    }
}

// Delete MJML template
async function handleDelete(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { filename } = req.query;

    if (!filename) {
        return res.status(400).json({ 
            success: false, 
            error: 'Template filename is required' 
        });
    }

    try {
        const filepath = path.join(TEMPLATES_DIR, filename);
        await fs.unlink(filepath);

        res.json({ 
            success: true, 
            message: 'Template deleted successfully' 
        });
    } catch (error) {
        console.error('Template delete error:', error);
        res.status(404).json({ 
            success: false, 
            error: 'Template not found' 
        });
    }
}

module.exports = {
    handler,
    handleCompile,
    handleSave,
    handleLoad,
    handleList,
    handleDelete
};