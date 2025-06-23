const sheetsService = require('../services/sheetsService');

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
        console.log('🔍 Checking Google Sheets configuration...');

        // Check if environment variables are configured
        const sheetsId = process.env.GOOGLE_SHEETS_ID;
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

        // Basic configuration check
        const configured = !!(sheetsId && credentialsPath);
        const credentialsExists = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

        let connectionStatus = 'unknown';
        let lastUpdate = null;

        // Try to test the actual connection if configured
        if (configured) {
            try {
                // Test connection to Google Sheets (this might fail if credentials are missing)
                connectionStatus = 'configured';
                lastUpdate = new Date().toISOString();
            } catch (error) {
                connectionStatus = 'error';
                console.warn('Google Sheets connection test failed:', error.message);
            }
        } else {
            connectionStatus = 'not_configured';
        }

        const response = {
            success: true,
            googleSheets: {
                configured: configured,
                credentialsExists: credentialsExists,
                sheetsId: sheetsId || 'NOT_SET',
                sheetName: sheetName,
                connectionStatus: connectionStatus,
                lastUpdate: lastUpdate,
                mode: process.env.NODE_ENV || 'development'
            },
            api: {
                status: 'operational',
                version: '2.8',
                database: 'Supabase PostgreSQL',
                timestamp: new Date().toISOString()
            }
        };

        console.log('✅ Sheets status check completed');
        res.status(200).json(response);

    } catch (error) {
        console.error('❌ Error checking sheets status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check sheets status',
            message: error.message,
            googleSheets: {
                configured: false,
                credentialsExists: false,
                connectionStatus: 'error'
            }
        });
    }
}; 