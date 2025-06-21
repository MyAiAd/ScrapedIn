# ScrapedIn - LinkedIn Recruitment Automation Platform

A complete Node.js application that scrapes LinkedIn jobs using Apify and generates sophisticated AI-powered outreach emails. ScrapedIn replaces traditional n8n workflows with a streamlined, robust solution featuring advanced email generation capabilities and a beautiful dashboard interface.

## 🚀 Features

- **LinkedIn Job Scraping**: Uses Apify's LinkedIn Jobs Scraper to find relevant positions
- **Advanced AI Email Generation**: Multi-step AI pipeline with research, ice breakers, and humanization
- **Multiple AI Providers**: OpenAI, OpenRouter (Claude), and Anthropic support with automatic fallback
- **Email Template Management**: Professional template system with customizable prompts
- **Web-based Email Interface**: Dedicated email template management and testing interface
- **Person Research**: AI-powered research using Perplexity for personalized outreach
- **Email Humanization**: Makes AI-generated emails sound natural and conversational
- **Google Sheets Integration**: Saves job data to Google Sheets (configurable)
- **Email Queue Management**: Manages and tracks email sending status with retry logic
- **Modern Web Interface**: Clean, responsive frontend with real-time status updates
- **SQLite Database**: Local storage for jobs and email queue
- **Form Validation**: Comprehensive input validation and error handling

## 📋 Prerequisites

- Node.js 16+ installed
- Apify API key (already configured: `apify_api_ndlgY92xAGzuRYobhYKBfPmBL9ayaa2I5Ekp`)
- Optional: AI Provider API keys (OpenAI, OpenRouter, Anthropic)
- Optional: Google Sheets API credentials
- Optional: SMTP credentials for email sending

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy and edit the configuration file:
```bash
cp config.env .env
# Edit .env with your API keys and settings
```

### 3. Start the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 4. Access ScrapedIn
- **Dashboard**: http://localhost:3000 (Main homepage)
- **LinkedIn Scraper**: http://localhost:3000/index.html
- **Email Templates**: http://localhost:3000/email-templates
- **Settings**: http://localhost:3000/settings
- **API**: http://localhost:3000/api/scrape-jobs

## 🔧 Configuration

### Environment Variables (config.env)

```env
# API Keys
APIFY_API_KEY=apify_api_ndlgY92xAGzuRYobhYKBfPmBL9ayaa2I5Ekp

# Server Configuration
PORT=3000
NODE_ENV=development

# Google Sheets (Optional)
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEET_NAME=Sheet1

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Test Email (for development/testing)
TEST_EMAIL=your-test-email@example.com

# AI Configuration - Add your API keys here
OPENAI_API_KEY=your-openai-api-key-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Database
DATABASE_PATH=./database.sqlite
```

## 🤖 AI Email Generation

The email service features a sophisticated multi-step AI pipeline:

### 1. Research Phase
- Uses Perplexity AI via OpenRouter to research the person
- Analyzes LinkedIn profiles and company information
- Gathers context for personalization

### 2. Ice Breaker Generation
- Creates engaging conversation starters
- Based on research findings
- Natural and professional tone

### 3. Email Composition
- Uses advanced prompts with multiple AI providers
- Supports different email types (job outreach, reputation management)
- Incorporates research and ice breakers

### 4. Humanization
- Post-processes AI-generated content
- Removes robotic language
- Ensures conversational flow

### Available Templates
- **Job Outreach**: Professional job application emails
- **Reputation Management**: Google Reviews and online reputation services
- **Custom Templates**: Fully customizable with variable substitution

## 📊 API Endpoints

### Email API Endpoints

#### POST /api/email/generate
Generate AI-powered emails.

**Request Body:**
```json
{
  "jobData": {
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "posterFullName": "John Smith",
    "location": "San Francisco, CA",
    "posterProfileUrl": "https://linkedin.com/in/johnsmith"
  },
  "templateKey": "job_outreach",
  "useAI": true
}
```

#### GET /api/email/templates
Get available email templates.

#### POST /api/email/test
Send test email with AI generation.

#### GET /api/email/status
Check system status (AI providers, email config).

### Job Scraping Endpoints

#### POST /api/scrape-jobs
Scrapes LinkedIn jobs and processes them.

**Request Body:**
```json
{
  "Job Title": "Software Engineer",
  "Job Location": "San Francisco",
  "Company Name": "Google",
  "Job Type": "Full-time",
  "Experience Level": "Mid-Senior Level",
  "Date posted": "Past Week",
  "On-site/Remote/Hybrid": "Remote"
}
```

#### GET /api/jobs
Get all scraped jobs from database.

#### POST /api/send-email/:jobId
Send email for a specific job.

## 🏗️ Architecture

```
├── server.js                    # Main Express server with email APIs
├── services/
│   ├── apifyService.js         # Apify API integration
│   ├── emailService.js         # Advanced AI email generation
│   ├── sheetsService.js        # Google Sheets integration
│   ├── databaseService.js      # SQLite database operations
│   └── templates/              # Email template storage
│       └── custom_template.json
├── index.html                  # Main frontend interface
├── email-templates.html        # Email template management interface
├── script.js                   # Frontend JavaScript
├── config.js                   # Frontend configuration
├── test-email-service.js       # Email service testing
└── config.env                  # Environment variables
```

## 🎨 Email Template Management

### Web Interface
Access the email template management interface at `/email-templates`:

- **Email Generator**: Generate emails with AI or templates
- **Template Manager**: View and manage email templates
- **Test & Preview**: Send test emails and preview generated content
- **Settings**: Check system status and AI provider connections

### Template Structure
```json
{
  "name": "Template Name",
  "systemPrompt": "AI system instructions...",
  "userPromptTemplate": "Template with {{variables}}...",
  "variables": ["posterName", "company", "title"],
  "category": "general"
}
```

### Variable Substitution
Templates support dynamic variables:
- `{{posterName}}` - Contact person's name
- `{{company}}` - Company name
- `{{title}}` - Job title
- `{{location}}` - Job location
- `{{research}}` - AI research results
- `{{iceBreaker}}` - Generated ice breaker

## 🔄 Migration from n8n

This application completely replaces the n8n workflow with significant improvements:

### Before (n8n):
- Complex workflow with 15+ nodes
- Form Trigger → Research → Ice Breaker → Email Writer → Humanizer → Sheets
- Difficult to debug and modify
- Required multiple AI API configurations
- Authentication and webhook issues

### After (Node.js):
- Integrated email service with AI pipeline
- Single codebase with clear structure
- Easy debugging and testing
- Unified AI provider management
- Web-based template management
- No external workflow dependencies

## 🚀 Usage

### Basic Usage
1. **Start the server**: `npm run dev`
2. **Open browser**: Go to http://localhost:3000
3. **Fill the form**: Enter job search criteria
4. **Submit**: Click "Start Job Scraping"
5. **View results**: Jobs appear with generated emails

### Email Template Management
1. **Access interface**: Go to http://localhost:3000/email-templates
2. **Generate emails**: Use the Email Generator tab
3. **Manage templates**: View and edit templates
4. **Test system**: Send test emails and check configuration

### Testing Email Service
```bash
# Run comprehensive email service tests
node test-email-service.js
```

## 🔍 Advanced Features

### AI Provider Fallback
The system automatically falls back between AI providers:
1. Primary provider (e.g., OpenRouter)
2. Secondary provider (e.g., OpenAI)
3. Template fallback if all AI providers fail

### Email Retry Logic
- Automatic retry with exponential backoff
- Up to 3 attempts per email
- Detailed error logging and reporting

### Research Integration
- Perplexity AI for real-time person research
- LinkedIn profile analysis
- Company information gathering
- Context-aware personalization

### Template Customization
- Variable substitution system
- Custom prompt engineering
- Multiple email types and styles
- Easy template addition and modification

## 🛠️ Development

### Adding New Email Templates
1. Create template in `services/templates/`
2. Add to `emailService.js` template map
3. Test with email interface

### Adding AI Providers
1. Add provider configuration in `getProviderConfig()`
2. Update API request handling
3. Add to fallback chain

### Testing
```bash
# Test email service
node test-email-service.js

# Test API endpoints
curl -X POST http://localhost:3000/api/email/generate \
  -H "Content-Type: application/json" \
  -d '{"jobData":{"title":"Test","company":"Test"}}'
```

## 📈 Performance & Scalability

- **Concurrent Processing**: Handles multiple email generations simultaneously
- **Rate Limiting**: Respects AI provider rate limits
- **Caching**: Reduces redundant API calls
- **Error Recovery**: Graceful handling of API failures
- **Resource Management**: Efficient memory and connection handling

## 🔒 Security

- **API Key Protection**: Environment variable storage
- **Production Safety**: Email sending disabled in production without explicit configuration
- **Input Validation**: Comprehensive request validation
- **Error Handling**: No sensitive information in error responses

## 📝 License

MIT License - see LICENSE file for details. 