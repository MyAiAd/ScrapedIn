const databaseService = require('../services/databaseService');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            company, 
            title, 
            location, 
            dateFrom, 
            dateTo 
        } = req.query;

        // Build filters object
        const filters = {};
        if (status) filters.status = status;
        if (company) filters.company = company;
        if (title) filters.title = title;
        if (location) filters.location = location;
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;

        console.log('🔍 Fetching leads with filters:', { page, limit, filters });

        // Get leads with pagination
        const result = await databaseService.getJobsWithPagination(
            parseInt(page), 
            parseInt(limit), 
            filters
        );

        // Get statistics
        const stats = await databaseService.getJobStats();

        res.status(200).json({
            success: true,
            leads: result.data,
            pagination: result.pagination,
            stats: stats
        });

    } catch (error) {
        console.error('❌ Error fetching leads:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leads',
            message: error.message
        });
    }
}; 