const apifyService = require('../services/apifyService');
const databaseService = require('../services/databaseService');
const sheetsService = require('../services/sheetsService');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { jobTitle, location, company, publishedAt, jobType, workType, experienceLevel, maxResults } = req.body;

        console.log('🔍 Starting job scraping...');
        console.log('Search params:', { jobTitle, location, company, publishedAt, jobType, workType, experienceLevel, maxResults });

        // Call Apify service to scrape jobs
        const jobs = await apifyService.scrapeJobs({
            jobTitle,
            location,
            company,
            publishedAt,
            jobType,
            workType,
            experienceLevel,
            maxResults: parseInt(maxResults) || 100
        });

        console.log(`✅ Successfully scraped ${jobs.length} jobs`);

        // Save jobs to both database and Google Sheets
        const savedJobs = [];
        const sheetsResults = [];
        
        for (const job of jobs) {
            try {
                // Save to Supabase database
                const savedJob = await databaseService.saveJob(job);
                savedJobs.push(savedJob);
                
                // Also save to Google Sheets (continue even if this fails)
                try {
                    const sheetResult = await sheetsService.saveJobToSheet(job);
                    sheetsResults.push(sheetResult);
                } catch (sheetError) {
                    console.error('Warning: Failed to save to Google Sheets:', sheetError);
                    sheetsResults.push(false);
                }
            } catch (error) {
                console.error('Error saving job:', error);
                sheetsResults.push(false);
                // Continue with other jobs
            }
        }

        const successfulSheetsSaves = sheetsResults.filter(Boolean).length;
        
        res.status(200).json({
            success: true,
            message: `Successfully scraped and saved ${savedJobs.length} jobs to database, ${successfulSheetsSaves} to Google Sheets`,
            jobs: savedJobs,
            totalScraped: jobs.length,
            totalSaved: savedJobs.length,
            savedToSheets: successfulSheetsSaves,
            databases: {
                supabase: savedJobs.length,
                googleSheets: successfulSheetsSaves
            }
        });

    } catch (error) {
        console.error('❌ Error in job scraping:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to scrape jobs',
            message: error.message
        });
    }
}; 