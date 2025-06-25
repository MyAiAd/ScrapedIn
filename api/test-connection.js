const databaseService = require('./services/databaseService');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔍 Testing Supabase connection...');
        
        // Test database connection
        await databaseService.initDatabase();
        
        // Try to get jobs count to verify connection
        const jobs = await databaseService.getAllJobs();
        
        console.log('✅ Database connection successful');
        
        res.status(200).json({
            success: true,
            message: 'Database connection successful',
            database: 'Supabase PostgreSQL',
            connectionStatus: 'Connected',
            jobsCount: jobs.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Database connection failed:', error);
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            message: error.message,
            database: 'Supabase PostgreSQL',
            connectionStatus: 'Failed',
            timestamp: new Date().toISOString()
        });
    }
}; 