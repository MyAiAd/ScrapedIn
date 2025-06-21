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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
databaseService.initDatabase();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Dashboard routes
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// LinkedIn Scraper Interface
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/scraper', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Settings Page
app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html'));
});

app.get('/settings.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html'));
});

// Email Templates Page
app.get('/email-templates', (req, res) => {
    res.sendFile(path.join(__dirname, 'email-templates.html'));
});

// Test Frontend
app.get('/test-frontend', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-frontend.html'));
});

app.get('/test-frontend.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-frontend.html'));
});

// Serve static files (after routes to prevent conflicts)
app.use(express.static('.'));

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

// Add custom template
app.post('/api/email/templates', async (req, res) => {
    try {
        const { key, template } = req.body;
        
        if (!key || !template) {
            return res.status(400).json({
                success: false,
                error: 'Template key and template data are required'
            });
        }

        emailService.addTemplate(key, template);
        
        res.json({
            success: true,
            message: `Template '${key}' added successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test email configuration
app.get('/api/email/config/test', async (req, res) => {
    try {
        const result = await emailService.testEmailConfig(true); // verbose = true
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Send test email
app.post('/api/email/test', async (req, res) => {
    try {
        const { email, useAI } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email address is required'
            });
        }

        const result = await emailService.sendTestEmail(email, useAI !== false);
        res.json(result);
    } catch (error) {
        console.error('❌ Test email error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get system status (AI providers, email config)
app.get('/api/email/status', async (req, res) => {
    try {
        const emailConfigResult = emailService.getConfigStatus();
        
        res.json({
            success: true,
            emailConfig: emailConfigResult,
            aiProviders: emailConfigResult.aiProviders,
            hasAI: emailService.hasAIProvider()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Send email for specific job data
app.post('/api/email/send', async (req, res) => {
    try {
        const { jobData, recipientEmail, templateKey } = req.body;
        
        if (!jobData || !recipientEmail) {
            return res.status(400).json({
                success: false,
                error: 'Job data and recipient email are required'
            });
        }

        // Generate email if not provided
        if (!jobData.emailContent) {
            jobData.emailContent = await emailService.generateEmail(jobData, { templateKey });
        }

        const result = await emailService.sendEmail(jobData, { recipientEmail });
        
        res.json({
            success: true,
            messageId: result.messageId,
            message: 'Email sent successfully'
        });
    } catch (error) {
        console.error('❌ Email send error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== EXISTING ENDPOINTS =====

// Main form submission endpoint (replaces n8n webhook)
app.post('/api/scrape-jobs', async (req, res) => {
    try {
        console.log('🚀 Starting job scraping process...');
        console.log('📥 Form data received:', req.body);

        // Extract and validate form data
        const formData = extractFormData(req.body);
        
        // Call Apify LinkedIn scraper
        console.log('🔍 Calling Apify LinkedIn scraper...');
        const jobs = await apifyService.scrapeLinkedInJobs(formData);
        
        console.log(`✅ Found ${jobs.length} jobs`);

        // Process each job
        const processedJobs = [];
        for (const job of jobs) {
            try {
                // Save to Google Sheets
                await sheetsService.saveJobToSheet(job);
                
                // Generate AI email with enhanced service
                const emailContent = await emailService.generateEmail(job, {
                    templateKey: 'job_outreach',
                    useAI: true
                });
                
                // Save to database for email queue
                const jobRecord = await databaseService.saveJob({
                    ...job,
                    emailContent,
                    status: 'pending'
                });
                
                processedJobs.push(jobRecord);
                
            } catch (error) {
                console.error(`❌ Error processing job ${job.id}:`, error);
            }
        }

        res.json({
            success: true,
            message: `Successfully processed ${processedJobs.length} jobs`,
            jobs: processedJobs,
            totalFound: jobs.length
        });

    } catch (error) {
        console.error('❌ Error in job scraping process:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get job status
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await databaseService.getAllJobs();
        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check Google Sheets configuration status
app.get('/api/sheets-status', async (req, res) => {
    try {
        const fs = require('fs');
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        
        const status = {
            configured: false,
            credentialsFile: credentialsPath || 'Not set',
            credentialsExists: false,
            sheetsId: process.env.GOOGLE_SHEETS_ID || 'Not set',
            sheetName: process.env.GOOGLE_SHEET_NAME || 'Sheet1',
            mode: 'simulation'
        };

        if (credentialsPath) {
            status.credentialsExists = fs.existsSync(credentialsPath);
            if (status.credentialsExists && process.env.GOOGLE_SHEETS_ID) {
                status.configured = true;
                status.mode = 'real';
            }
        }

        res.json({
            success: true,
            googleSheets: status,
            instructions: status.configured ? 
                'Google Sheets is properly configured!' : 
                'Follow setup-google-sheets.md to enable real Google Sheets updates'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send email for a specific job (enhanced)
app.post('/api/send-email/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const { recipientEmail } = req.body;
        
        const job = await databaseService.getJobById(jobId);
        
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        // Generate email if not exists
        if (!job.emailContent) {
            job.emailContent = await emailService.generateEmail(job);
        }

        const result = await emailService.sendEmail(job, { recipientEmail });
        await databaseService.updateJobStatus(jobId, 'sent');

        res.json({ 
            success: true, 
            message: 'Email sent successfully',
            messageId: result.messageId
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Manual send to Google Sheets (uses cached results - no new API call)
app.post('/api/send-to-sheets', async (req, res) => {
    try {
        console.log('📊 Manual Google Sheets send requested...');
        const { jobs, source } = req.body;
        
        if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No jobs data provided' 
            });
        }

        console.log(`📝 Sending ${jobs.length} cached jobs to Google Sheets (source: ${source || 'unknown'})`);
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process each job
        for (const job of jobs) {
            try {
                await sheetsService.saveJobToSheet(job);
                successCount++;
                console.log(`✅ Saved job: ${job.title || job.position || 'Unknown'}`);
            } catch (error) {
                errorCount++;
                errors.push(`${job.title || 'Unknown'}: ${error.message}`);
                console.error(`❌ Failed to save job: ${job.title || 'Unknown'}`, error.message);
            }
        }

        const response = {
            success: successCount > 0,
            message: `Processed ${jobs.length} jobs: ${successCount} successful, ${errorCount} failed`,
            successCount,
            errorCount,
            totalJobs: jobs.length
        };

        if (errors.length > 0) {
            response.errors = errors;
        }

        console.log(`📊 Google Sheets manual send completed: ${successCount}/${jobs.length} successful`);
        res.json(response);

    } catch (error) {
        console.error('❌ Error in manual Google Sheets send:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Extract and validate form data (replaces n8n form processing)
function extractFormData(body) {
    console.log('🔍 Extracting form data...');
    
    const jobTitle = body['Job Title'] || body.jobTitle || body.title;
    const jobLocation = body['Job Location'] || body.jobLocation || body.location;
    
    if (!jobTitle) {
        throw new Error('Job Title is required');
    }
    
    if (!jobLocation) {
        throw new Error('Job Location is required');
    }

    const formData = {
        jobTitle,
        jobLocation,
        companyName: body['Company Name'] || body.companyName || '',
        jobType: body['Job Type'] || body.jobType || '',
        experienceLevel: body['Experience Level'] || body.experienceLevel || '',
        datePosted: body['Date posted'] || body.datePosted || '',
        workType: body['On-site/Remote/Hybrid'] || body.workType || '',
        totalRows: parseInt(body['Total Jobs to Scrape'] || body.totalRows || '25')
    };

    console.log('✅ Extracted form data:', formData);
    return formData;
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ScrapedIn Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at: http://localhost:${PORT}`);
    console.log(`🤖 Email Templates: http://localhost:${PORT}/email-templates`);
    console.log(`⚙️ Settings: http://localhost:${PORT}/settings`);
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api/scrape-jobs`);
});

module.exports = app; 