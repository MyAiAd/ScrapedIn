const emailService = require('../services/emailService');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Get all email templates
            const templates = await emailService.getTemplates();
            return res.status(200).json({
                success: true,
                templates: templates,
                count: templates.length
            });
        }

        if (req.method === 'POST') {
            // Create new template
            const { name, subject, content, type } = req.body;
            if (!name || !subject || !content) {
                return res.status(400).json({
                    success: false,
                    error: 'Name, subject, and content are required'
                });
            }

            const templateId = await emailService.createTemplate(name, subject, content, type);
            return res.status(201).json({
                success: true,
                message: 'Template created successfully',
                templateId: templateId
            });
        }

        if (req.method === 'PUT') {
            // Update template
            const { id, name, subject, content, type } = req.body;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            await emailService.updateTemplate(id, name, subject, content, type);
            return res.status(200).json({
                success: true,
                message: 'Template updated successfully'
            });
        }

        if (req.method === 'DELETE') {
            // Delete template
            const { id } = req.body;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            await emailService.deleteTemplate(id);
            return res.status(200).json({
                success: true,
                message: 'Template deleted successfully'
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('❌ Error in email templates API:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process email templates request',
            message: error.message
        });
    }
}; 