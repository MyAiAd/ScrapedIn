// Configuration file for LinkedIn Job Scraper Frontend
// Update these values to connect to your n8n workflow

const CONFIG = {
    // Development: 'http://localhost:3000'
    // Production: 'https://scraped-in.vercel.app'
    API_URL: 'https://scraped-in.vercel.app',
    
    // Webhook URLs for development/testing 
    WEBHOOK_URL: '',
    
    // Google Sheets Configuration
    GOOGLE_SHEET_URL: 'https://docs.google.com/spreadsheets/d/1nkZX0o_aBZkqmAenqmqEO-CrUB3eQgJKXngRw6T3crs/edit',
    
    // UI Configuration
    VERSION: 'v2.8',
    DEBUG: false,
    
    // Feature Flags
    FEATURES: {
        AUTO_EMAIL_GENERATION: true,
        GOOGLE_SHEETS_INTEGRATION: true,
        EXPORT_CSV: true,
        REAL_TIME_STATUS: true
    },
    
    // Authentication for local n8n (set your actual credentials)
    N8N_AUTH: {
        username: 'sage@myai.ad',
        password: 'T3sla12e!'
    },
    
    // Field mapping - DIRECT APIFY INTEGRATION (v2.3)
    // Frontend now sends properly formatted Apify parameters directly
    APIFY_FIELD_MAPPING: {
        'Job Title': 'title (string) - Required',
        'Job Location': 'location (string) - Required', 
        'Total Rows': 'rows (integer) - Required, max 1000',
        'Company Name': 'companyName (array) - Optional, split by comma',
        'Published at': 'publishedAt (string) - Optional, mapped to API codes',
        'Job Type': 'contractType (string) - Optional, mapped to F/P/C/T/I/V',
        'Work Type': 'workType (string) - Optional, mapped to 1/2/3',
        'Experience Level': 'experienceLevel (string) - Optional, mapped to 1/2/3/4/5'
    },
    
    // Value mappings for Apify actor
    APIFY_VALUE_MAPPINGS: {
        publishedAt: {
            'Any Time': '',
            'Past Month': 'r2592000',
            'Past Week': 'r604800',
            'Past 24 hours': 'r86400'
        },
        contractType: {
            'Full-time': 'F',
            'Part-time': 'P',
            'Contract': 'C',
            'Temporary': 'T',
            'Internship': 'I',
            'Volunteer': 'V'
        },
        workType: {
            'On-site': '1',
            'Remote': '2',
            'Hybrid': '3'
        },
        experienceLevel: {
            'Internship': '1',
            'Entry Level': '2',
            'Associate': '3',
            'Mid-Senior Level': '4',
            'Director': '5'
        }
    },
    
    // Default search parameters (pre-filled in the form)
    DEFAULT_SEARCH: {
        jobTitle: 'Finance Manager, Accounting Specialist, Financial Analyst',
        jobLocation: 'United Kingdom',
        publishedAt: 'Past Week',
        jobType: 'Full-time',
        workType: 'On-site',
        experienceLevel: 'Associate',
        totalRows: '25'
    },
    
    // UI Configuration
    UI_CONFIG: {
        // Show demo data if webhook fails (useful for testing)
        SHOW_DEMO_ON_ERROR: true,
        
        // Auto-refresh interval for checking results (in milliseconds)
        REFRESH_INTERVAL: 30000, // 30 seconds
        
        // Maximum number of results to display in table
        MAX_RESULTS_DISPLAY: 100
    },
    
    // Email configuration (if you want to customize email templates)
    EMAIL_CONFIG: {
        defaultSubject: 'Partnership Opportunity - Quality Candidates Available',
        senderName: 'Your Recruitment Agency Name',
        calendarLink: 'https://calendly.com/your-calendar-link'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
} 
