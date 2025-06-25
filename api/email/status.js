const emailService = require('../services/emailService');

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
        // Check email service configuration
        const isConfigured = emailService.isConfigured();
        const lastEmailSent = await emailService.getLastEmailTime();
        const emailsSentToday = await emailService.getEmailsSentToday();

        return res.status(200).json({
            success: true,
            configured: isConfigured,
            lastEmailSent: lastEmailSent,
            emailsSentToday: emailsSentToday,
            status: isConfigured ? 'active' : 'not_configured'
        });

    } catch (error) {
        console.error('❌ Error checking email status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check email status',
            message: error.message
        });
    }
}; 