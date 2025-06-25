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
        const hasSES = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
        const hasSMTP = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
        const isConfigured = hasSES || hasSMTP;
        
        const emailProvider = hasSES ? 'AWS SES' : hasSMTP ? 'SMTP' : 'none';
        const lastEmailSent = null; // Would need database integration
        const emailsSentToday = 0; // Would need database integration

        return res.status(200).json({
            success: true,
            configured: isConfigured,
            provider: emailProvider,
            lastEmailSent: lastEmailSent,
            emailsSentToday: emailsSentToday,
            status: isConfigured ? 'active' : 'not_configured',
            emailConfig: {
                success: isConfigured,
                provider: emailProvider,
                hasSES: hasSES,
                hasSMTP: hasSMTP
            },
            aiProviders: {
                openai: !!(process.env.OPENAI_API_KEY),
                openrouter: !!(process.env.OPENROUTER_API_KEY),
                anthropic: !!(process.env.ANTHROPIC_API_KEY)
            }
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