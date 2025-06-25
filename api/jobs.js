require('dotenv').config({ path: './config.env' });
const databaseService = require('./services/databaseService');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Get all jobs
            const jobs = await databaseService.getAllJobs();
            return res.status(200).json({
                success: true,
                jobs: jobs,
                count: jobs.length
            });
        }

        if (req.method === 'PUT') {
            // Update job status
            const { id, status } = req.body;
            if (!id || !status) {
                return res.status(400).json({
                    success: false,
                    error: 'Job ID and status are required'
                });
            }

            await databaseService.updateJobStatus(id, status);
            return res.status(200).json({
                success: true,
                message: `Job ${id} status updated to ${status}`
            });
        }

        if (req.method === 'DELETE') {
            // Delete job (if needed in the future)
            return res.status(501).json({
                success: false,
                error: 'Delete functionality not implemented'
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('❌ Error in jobs API:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process jobs request',
            message: error.message
        });
    }
}; 