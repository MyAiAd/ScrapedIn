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
        const isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
        const lastEmailSent = null; // Would need database integration
        const emailsSentToday = 0; // Would need database integration

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