const axios = require('axios');

class ApifyService {
    constructor() {
        this.apiKey = process.env.APIFY_API_KEY;
        this.baseUrl = 'https://api.apify.com/v2';
        this.actorId = 'bebity~linkedin-jobs-scraper';
    }

    // Map form values to Apify API parameters (from n8n workflow)
    mapJobType(jobType) {
        const mapping = {
            'Full-time': 'F',
            'Part-time': 'P',
            'Contract': 'C',
            'Temporary': 'T',
            'Internship': 'I',
            'Volunteer': 'V'
        };
        return mapping[jobType] || '';
    }

    mapExperienceLevel(level) {
        const mapping = {
            'Internship': '1',
            'Entry Level': '2',
            'Associate': '3',
            'Mid-Senior Level': '4',
            'Director': '5'
        };
        return mapping[level] || '';
    }

    mapPublishedAt(period) {
        const mapping = {
            'Any Time': '',
            'Past Month': 'r2592000',
            'Past Week': 'r604800',
            'Past 24 hours': 'r86400'
        };
        return mapping[period] || '';
    }

    mapWorkType(type) {
        const mapping = {
            'On-site': '1',
            'Remote': '2',
            'Hybrid': '3'
        };
        return mapping[type] || '';
    }

    // Build Apify parameters from form data
    buildApifyParams(formData) {
        console.log('🔧 Building Apify parameters from form data:', formData);

        const params = {
            title: formData.jobTitle,
            location: formData.jobLocation,
            rows: formData.totalRows || 25,
            proxy: {
                useApifyProxy: true,
                apifyProxyGroups: ['RESIDENTIAL']
            }
        };

        // Add optional parameters with proper mapping
        if (formData.companyName) {
            params.companyName = [formData.companyName];
        }

        if (formData.jobType) {
            params.contractType = this.mapJobType(formData.jobType);
        }

        if (formData.experienceLevel) {
            params.experienceLevel = this.mapExperienceLevel(formData.experienceLevel);
        }

        if (formData.datePosted) {
            params.publishedAt = this.mapPublishedAt(formData.datePosted);
        }

        if (formData.workType) {
            params.workType = this.mapWorkType(formData.workType);
        }

        console.log('🎯 Final Apify parameters:', JSON.stringify(params, null, 2));
        return params;
    }

    // Main method to scrape LinkedIn jobs
    async scrapeLinkedInJobs(formData) {
        try {
            console.log('🚀 Starting LinkedIn job scraping...');
            
            const params = this.buildApifyParams(formData);
            
            const url = `${this.baseUrl}/acts/${this.actorId}/run-sync-get-dataset-items`;
            
            console.log('📡 Making request to Apify API...');
            console.log('URL:', url);
            
            const response = await axios.post(url, params, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 300000 // 5 minutes timeout
            });

            console.log(`✅ Apify API response status: ${response.status}`);
            
            if (!response.data || !Array.isArray(response.data)) {
                console.error('❌ Invalid response format from Apify');
                throw new Error('Invalid response format from Apify API');
            }

            const jobs = response.data;
            console.log(`🎉 Successfully scraped ${jobs.length} jobs from LinkedIn`);

            // Process and clean the job data
            const processedJobs = jobs.map(job => this.processJobData(job));
            
            return processedJobs;

        } catch (error) {
            console.error('❌ Error scraping LinkedIn jobs:', error);
            
            if (error.response) {
                console.error('API Error Response:', error.response.data);
                console.error('API Error Status:', error.response.status);
            }
            
            throw new Error(`Failed to scrape LinkedIn jobs: ${error.message}`);
        }
    }

    // Process and clean individual job data
    processJobData(job) {
        return {
            id: job.id || '',
            title: job.title || '',
            company: job.companyName || '',
            location: job.location || '',
            jobUrl: job.jobUrl || '',
            posterProfileUrl: job.posterProfileUrl || '',
            posterFullName: job.posterFullName || '',
            contractType: job.contractType || '',
            publishedAt: job.publishedAt || '',
            description: job.description || '',
            // Add any other fields you need
            scrapedAt: new Date().toISOString()
        };
    }

    // Test the Apify connection
    async testConnection() {
        try {
            const url = `${this.baseUrl}/acts/${this.actorId}`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            console.log('✅ Apify connection test successful');
            return true;
        } catch (error) {
            console.error('❌ Apify connection test failed:', error.message);
            return false;
        }
    }
}

module.exports = new ApifyService(); 