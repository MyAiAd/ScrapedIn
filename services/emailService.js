const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = null;
        this.templates = new Map();
        this.aiProviders = {
            openai: 'https://api.openai.com/v1/chat/completions',
            openrouter: 'https://openrouter.ai/api/v1/chat/completions',
            anthropic: 'https://api.anthropic.com/v1/messages'
        };
        this.initTransporter();
        this.loadTemplates();
    }

    // Initialize email transporter with better error handling
    initTransporter() {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('⚠️ Email credentials not configured. Email sending will be disabled.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            connectionTimeout: 60000,
            greetingTimeout: 30000,
            socketTimeout: 60000
        });

        console.log('✅ Email transporter initialized');
    }

    // Load email templates from file system
    async loadTemplates() {
        try {
            const templatesDir = path.join(__dirname, 'templates');
            await fs.mkdir(templatesDir, { recursive: true });
            
            // Load default templates
            this.templates.set('job_outreach', {
                name: 'Job Outreach',
                systemPrompt: `You are a professional cold outreach specialist. Write personalized, engaging emails for job opportunities.

Key requirements:
- Keep emails under 150 words
- Professional but friendly tone
- Express genuine interest
- Include specific company/role details
- Clear call-to-action
- Personalized based on research
- Subject line that grabs attention`,
                userPromptTemplate: `Write a cold outreach email for:

Job Title: {{title}}
Company: {{company}}
Location: {{location}}
Job Poster: {{posterName}}
Research Info: {{research}}
Ice Breaker: {{iceBreaker}}

Format as: Subject: [subject] followed by email body.`
            });

            this.templates.set('reputation_management', {
                name: 'Reputation Management',
                systemPrompt: `You are a cold outreach specialist selling Online Reputation Management services, especially Google Reviews.

Key requirements:
- Talk about pain points and solutions
- Use provided research for personalization
- Natural, conversational tone
- Attention-grabbing subject line
- Sign as "Tamil"
- Start with "Hey, [FirstName]"
- Use phrase "as I mentioned"
- No emojis
- Under 150 words`,
                userPromptTemplate: `Write a reputation management outreach email for:

Person: {{posterName}}
Company: {{company}}
Position: {{title}}
LinkedIn: {{linkedinUrl}}
Research: {{research}}
Ice Breaker: {{iceBreaker}}

Example format:
Subject: Customers Check Reviews. Are You Losing Business?

Hey [Name],

Nearly 95% of buyers read reviews before making a decision—but most businesses struggle to get them consistently.

I help businesses like yours get more authentic Google reviews on autopilot—no manual follow-ups, no chasing.

Let your reviews grow while you focus on the work.

Let's set up a quick call to see how it fits.

– Tamil`
            });

            console.log('✅ Email templates loaded');
        } catch (error) {
            console.error('❌ Error loading templates:', error);
        }
    }

    // Research person using AI (replaces n8n Research node)
    async researchPerson(jobData) {
        try {
            console.log('🔍 Researching person:', jobData.posterFullName);

            const researchPrompt = `You are a research specialist. Research this person and provide useful information for email ice breakers. Output only factual information without suggestions.

LinkedIn Profile: ${jobData.posterProfileUrl || 'Not provided'}
Company: ${jobData.company}
Position: ${jobData.title}
Person Summary: ${jobData.about || 'Not provided'}
Company Website: ${jobData.companyWebsite || 'Not provided'}`;

            const response = await this.callAI('research', {
                model: 'perplexity/llama-3.1-sonar-large-128k-online',
                messages: [{
                    role: 'system',
                    content: 'You are a research specialist. Provide factual information about people for professional outreach purposes.'
                }, {
                    role: 'user',
                    content: researchPrompt
                }]
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('❌ Research error:', error.message);
            return 'Research information not available';
        }
    }

    // Generate ice breaker (replaces n8n Conversation Starter)
    async generateIceBreaker(jobData, researchInfo) {
        try {
            console.log('🧊 Generating ice breaker for:', jobData.posterFullName);

            const prompt = `Based on this research information, create a professional ice breaker for an email:

Person: ${jobData.posterFullName}
Company: ${jobData.company}
Research: ${researchInfo}

Create a brief, engaging ice breaker that shows you've done your research. Keep it natural and conversational.`;

            const response = await this.callAI('openai', {
                model: 'gpt-4',
                messages: [{
                    role: 'system',
                    content: 'You are an expert at creating engaging ice breakers for professional emails based on research.'
                }, {
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 100
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error('❌ Ice breaker generation error:', error.message);
            return `I noticed your work at ${jobData.company}`;
        }
    }

    // Generate email with AI (replaces n8n Email Pitch Writer)
    async generateEmailWithAI(jobData, templateKey = 'job_outreach') {
        try {
            console.log('🤖 Generating AI email for:', jobData.title);

            // Step 1: Research the person
            const researchInfo = await this.researchPerson(jobData);
            
            // Step 2: Generate ice breaker
            const iceBreaker = await this.generateIceBreaker(jobData, researchInfo);
            
            // Step 3: Generate main email
            const template = this.templates.get(templateKey);
            if (!template) {
                throw new Error(`Template '${templateKey}' not found`);
            }

            const userPrompt = this.buildPromptFromTemplate(template.userPromptTemplate, {
                ...jobData,
                research: researchInfo,
                iceBreaker: iceBreaker,
                posterName: jobData.posterFullName,
                linkedinUrl: jobData.posterProfileUrl
            });

            const response = await this.callAI('openrouter', {
                model: 'anthropic/claude-3.5-sonnet',
                messages: [{
                    role: 'system',
                    content: template.systemPrompt
                }, {
                    role: 'user',
                    content: userPrompt
                }],
                max_tokens: 800,
                temperature: 0.7
            });

            const emailContent = response.choices[0].message.content;
            
            // Step 4: Humanize the email
            const humanizedEmail = await this.humanizeEmail(emailContent);
            
            return {
                subject: this.extractSubject(humanizedEmail) || `Interest in ${jobData.title} Position`,
                body: this.extractBody(humanizedEmail),
                generatedBy: 'ai-enhanced',
                research: researchInfo,
                iceBreaker: iceBreaker,
                template: templateKey
            };

        } catch (error) {
            console.error('❌ AI email generation error:', error);
            // Fallback to template
            return this.generateTemplateEmail(jobData);
        }
    }

    // Humanize email (replaces n8n Email Humanizer)
    async humanizeEmail(emailContent) {
        try {
            const prompt = `Here is a cold outreach email to humanize:

${emailContent}

Make it sound more human and natural while keeping it professional. Remove any robotic language and make it conversational.`;

            const response = await this.callAI('openrouter', {
                model: 'anthropic/claude-3.5-sonnet',
                messages: [{
                    role: 'system',
                    content: 'You are an expert at making AI-generated emails sound more human and natural while maintaining professionalism.'
                }, {
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 600,
                temperature: 0.8
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('❌ Email humanization error:', error.message);
            return emailContent; // Return original if humanization fails
        }
    }

    // Call AI providers with fallback logic
    async callAI(provider, payload) {
        const providers = provider === 'research' ? ['openrouter', 'openai'] : [provider, 'openai'];
        
        for (const providerName of providers) {
            try {
                return await this.makeAIRequest(providerName, payload);
            } catch (error) {
                console.warn(`⚠️ ${providerName} failed, trying next provider:`, error.message);
                continue;
            }
        }
        
        throw new Error('All AI providers failed');
    }

    // Make AI API request
    async makeAIRequest(provider, payload) {
        const config = this.getProviderConfig(provider);
        if (!config) {
            throw new Error(`Provider ${provider} not configured`);
        }

        const response = await axios.post(config.url, payload, {
            headers: config.headers,
            timeout: 30000
        });

        return response.data;
    }

    // Get provider configuration
    getProviderConfig(provider) {
        switch (provider) {
            case 'openai':
                if (!process.env.OPENAI_API_KEY) return null;
                return {
                    url: this.aiProviders.openai,
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                };
            
            case 'openrouter':
                if (!process.env.OPENROUTER_API_KEY) return null;
                return {
                    url: this.aiProviders.openrouter,
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                };
            
            case 'anthropic':
                if (!process.env.ANTHROPIC_API_KEY) return null;
                return {
                    url: this.aiProviders.anthropic,
                    headers: {
                        'x-api-key': process.env.ANTHROPIC_API_KEY,
                        'Content-Type': 'application/json',
                        'anthropic-version': '2023-06-01'
                    }
                };
            
            default:
                return null;
        }
    }

    // Build prompt from template with variable substitution
    buildPromptFromTemplate(template, variables) {
        let prompt = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            prompt = prompt.replace(regex, value || 'Not provided');
        }
        return prompt;
    }

    // Enhanced template email generation
    generateTemplateEmail(jobData) {
        const templates = [
            {
                condition: () => jobData.company && jobData.title,
                subject: `Exploring the ${jobData.title} opportunity at ${jobData.company}`,
                body: `Dear ${jobData.posterFullName || 'Hiring Manager'},

I came across the ${jobData.title} position at ${jobData.company} and was immediately drawn to the opportunity${jobData.location ? ` in ${jobData.location}` : ''}.

${jobData.company} has an impressive reputation in the industry, and I believe my background would be a strong fit for this role. I'd love to learn more about your team's goals and discuss how I can contribute to ${jobData.company}'s continued success.

Would you be available for a brief conversation about this position?

Best regards,
[Your Name]

${jobData.jobUrl ? `Reference: ${jobData.jobUrl}` : ''}`
            },
            {
                condition: () => true, // Default fallback
                subject: `Interest in ${jobData.title || 'your opportunity'}`,
                body: `Dear ${jobData.posterFullName || 'Hiring Manager'},

I hope this message finds you well. I'm reaching out regarding ${jobData.title ? `the ${jobData.title} position` : 'the opportunity'} ${jobData.company ? `at ${jobData.company}` : ''}.

I'm very interested in learning more about this role and how I might contribute to your team's success. Would you be open to a brief conversation?

Thank you for your time and consideration.

Best regards,
[Your Name]`
            }
        ];

        const selectedTemplate = templates.find(t => t.condition()) || templates[templates.length - 1];
        
        return {
            subject: selectedTemplate.subject,
            body: selectedTemplate.body.trim(),
            generatedBy: 'template'
        };
    }

    // Extract subject line from AI content
    extractSubject(content) {
        const patterns = [
            /Subject:\s*(.+)/i,
            /^(.+)\n\n/,
            /^(.+)\n/
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1].trim().replace(/^["']|["']$/g, '');
            }
        }
        
        return null;
    }

    // Extract body from AI content
    extractBody(content) {
        // Remove subject line if present
        const withoutSubject = content.replace(/^Subject:\s*.+\n*/i, '');
        return withoutSubject.trim();
    }

    // Main email generation method
    async generateEmail(jobData, options = {}) {
        const { 
            templateKey = 'job_outreach', 
            useAI = true, 
            forceTemplate = false 
        } = options;

        try {
            if (!forceTemplate && useAI && this.hasAIProvider()) {
                return await this.generateEmailWithAI(jobData, templateKey);
            } else {
                return this.generateTemplateEmail(jobData);
            }
        } catch (error) {
            console.error('❌ Email generation error:', error);
            return this.generateTemplateEmail(jobData);
        }
    }

    // Check if any AI provider is available
    hasAIProvider() {
        return !!(process.env.OPENAI_API_KEY || 
                 process.env.OPENROUTER_API_KEY || 
                 process.env.ANTHROPIC_API_KEY);
    }

    // Enhanced email sending with retry logic
    async sendEmail(jobData, options = {}) {
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (!this.transporter) {
                    throw new Error('Email transporter not configured');
                }

                if (!jobData.emailContent) {
                    throw new Error('No email content available');
                }

                const recipientEmail = options.recipientEmail || this.extractRecipientEmail(jobData);
                
                if (!recipientEmail) {
                    throw new Error('No recipient email found');
                }

                const mailOptions = {
                    from: process.env.SMTP_USER,
                    to: recipientEmail,
                    subject: jobData.emailContent.subject,
                    text: jobData.emailContent.body,
                    html: this.formatEmailAsHtml(jobData.emailContent.body),
                    replyTo: options.replyTo || process.env.SMTP_USER
                };

                const result = await this.transporter.sendMail(mailOptions);
                
                console.log(`✅ Email sent successfully (attempt ${attempt}):`, result.messageId);
                return {
                    success: true,
                    messageId: result.messageId,
                    attempt: attempt
                };

            } catch (error) {
                lastError = error;
                console.error(`❌ Email send attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    // Improved recipient email extraction
    extractRecipientEmail(jobData) {
        // Safety check - return null to prevent accidental sends
        if (process.env.NODE_ENV === 'production') {
            return null;
        }

        // Development/testing logic
        if (process.env.TEST_EMAIL) {
            return process.env.TEST_EMAIL;
        }

        // Placeholder for future implementation
        // You could implement:
        // - LinkedIn email scraping
        // - Company domain guessing
        // - Email finding services integration
        
        return null;
    }

    // Enhanced HTML formatting
    formatEmailAsHtml(textContent) {
        return textContent
            .split('\n')
            .map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '<br>';
                if (trimmed.startsWith('Subject:')) return `<h3>${trimmed}</h3>`;
                if (trimmed.startsWith('Dear ') || trimmed.startsWith('Hi ')) return `<p><strong>${trimmed}</strong></p>`;
                if (trimmed.startsWith('Best regards') || trimmed.startsWith('Sincerely')) return `<p><em>${trimmed}</em></p>`;
                return `<p>${trimmed}</p>`;
            })
            .join('\n');
    }

    // Get available templates
    getTemplates() {
        return Array.from(this.templates.entries()).map(([key, template]) => ({
            key,
            name: template.name,
            description: template.systemPrompt.substring(0, 100) + '...'
        }));
    }

    // Add custom template
    addTemplate(key, template) {
        this.templates.set(key, template);
        console.log(`✅ Template '${key}' added`);
    }

    // Test email configuration with detailed diagnostics
    async testEmailConfig(verbose = false) {
        try {
            if (!this.transporter) {
                throw new Error('Email transporter not configured');
            }

            if (verbose) {
                console.log('🔍 Testing email configuration...');
            }
            
            await this.transporter.verify();
            
            if (verbose) {
                console.log('✅ Email configuration test successful');
            }
            
            return {
                success: true,
                smtp: {
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: process.env.SMTP_PORT || 587,
                    user: process.env.SMTP_USER
                },
                aiProviders: {
                    openai: !!process.env.OPENAI_API_KEY,
                    openrouter: !!process.env.OPENROUTER_API_KEY,
                    anthropic: !!process.env.ANTHROPIC_API_KEY
                }
            };
        } catch (error) {
            if (verbose) {
                console.error('❌ Email configuration test failed:', error.message);
            }
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get configuration status without testing SMTP connection
    getConfigStatus() {
        const hasEmailConfig = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
        
        return {
            success: hasEmailConfig,
            smtp: {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                user: process.env.SMTP_USER,
                configured: hasEmailConfig
            },
            aiProviders: {
                openai: !!process.env.OPENAI_API_KEY,
                openrouter: !!process.env.OPENROUTER_API_KEY,
                anthropic: !!process.env.ANTHROPIC_API_KEY
            }
        };
    }

    // Send test email with AI generation
    async sendTestEmail(toEmail, useAI = true) {
        try {
            const testJobData = {
                title: 'Senior Software Engineer',
                company: 'Tech Innovations Inc',
                location: 'San Francisco, CA',
                posterFullName: 'John Smith',
                posterProfileUrl: 'https://linkedin.com/in/johnsmith',
                jobUrl: 'https://example.com/job/123'
            };

            let emailContent;
            if (useAI && this.hasAIProvider()) {
                emailContent = await this.generateEmailWithAI(testJobData);
            } else {
                emailContent = this.generateTemplateEmail(testJobData);
            }

            const result = await this.sendEmail(
                { ...testJobData, emailContent }, 
                { recipientEmail: toEmail }
            );

            console.log('✅ Test email sent successfully');
            return {
                success: true,
                messageId: result.messageId,
                emailContent: emailContent
            };

        } catch (error) {
            console.error('❌ Test email failed:', error);
            throw error;
        }
    }
}

module.exports = new EmailService(); 