const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const apifyService = require('./services/apifyService');
const emailService = require('./services/emailService');
const sheetsService = require('./services/sheetsService');
const databaseService = require('./services/databaseService');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
databaseService.initDatabase();

// ===== EMAIL API ENDPOINTS =====

// Generate email with AI
app.post('/api/email/generate', async (req, res) => {
    try {
        const { jobData, templateKey, useAI, forceTemplate } = req.body;
        
        if (!jobData) {
            return res.status(400).json({ 
                success: false, 
                error: 'Job data is required' 
            });
        }

        const options = {
            templateKey: templateKey || 'job_outreach',
            useAI: useAI !== false,
            forceTemplate: forceTemplate || false
        };

        const emailContent = await emailService.generateEmail(jobData, options);
        
        res.json({
            success: true,
            emailContent,
            generatedBy: emailContent.generatedBy,
            message: `Email generated using ${emailContent.generatedBy}`
        });

    } catch (error) {
        console.error('❌ Email generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get available templates
app.get('/api/email/templates', async (req, res) => {
    try {
        const templates = emailService.getTemplates();
        res.json({
            success: true,
            templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add all other API routes from server.js here...
// For now, let's add a basic health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is running' });
});

// Export for Vercel
module.exports = app; 