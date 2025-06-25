// In serverless environments, we can't write to the file system
// So we'll use environment variables as the source of truth
const DEFAULT_SETTINGS = {
    apifyKey: process.env.APIFY_API_KEY || '',
    openaiKey: process.env.OPENAI_API_KEY || '',
    openrouterKey: process.env.OPENROUTER_API_KEY || '',
    anthropicKey: process.env.ANTHROPIC_API_KEY || ''
};

function maskApiKey(key) {
    if (!key || key.length < 8) return '';
    return '••••••••' + key.slice(-4);
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Return masked settings from environment variables
            const settings = DEFAULT_SETTINGS;
            
            const maskedSettings = {
                apifyKey: maskApiKey(settings.apifyKey),
                openaiKey: maskApiKey(settings.openaiKey),
                openrouterKey: maskApiKey(settings.openrouterKey),
                anthropicKey: maskApiKey(settings.anthropicKey)
            };

            return res.status(200).json({
                success: true,
                ...maskedSettings
            });
        }

        if (req.method === 'POST') {
            const { apifyKey, openaiKey, openrouterKey, anthropicKey } = req.body;

            console.log('📝 Settings save attempt:', {
                hasApifyKey: !!apifyKey,
                hasOpenaiKey: !!openaiKey,
                hasOpenrouterKey: !!openrouterKey,
                hasAnthropicKey: !!anthropicKey
            });

            // Validate input
            const newSettings = {};
            if (apifyKey && typeof apifyKey === 'string' && apifyKey.trim() && !apifyKey.startsWith('••••')) {
                newSettings.apifyKey = apifyKey.trim();
            }
            if (openaiKey && typeof openaiKey === 'string' && openaiKey.trim() && !openaiKey.startsWith('••••')) {
                newSettings.openaiKey = openaiKey.trim();
            }
            if (openrouterKey && typeof openrouterKey === 'string' && openrouterKey.trim() && !openrouterKey.startsWith('••••')) {
                newSettings.openrouterKey = openrouterKey.trim();
            }
            if (anthropicKey && typeof anthropicKey === 'string' && anthropicKey.trim() && !anthropicKey.startsWith('••••')) {
                newSettings.anthropicKey = anthropicKey.trim();
            }

            console.log('✅ Valid settings to save:', Object.keys(newSettings));

            if (Object.keys(newSettings).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No valid settings provided. Make sure to enter new API keys (not masked ones).'
                });
            }

            // In serverless environments like Vercel, we can't persist settings to files
            // The API keys should be set as environment variables in the Vercel dashboard
            // This endpoint serves as a validation and confirmation endpoint
            
            // Simulate saving process for user feedback
            console.log('💾 Settings would be saved:', newSettings);
            
            return res.status(200).json({
                success: true,
                message: `Settings validated successfully! ${Object.keys(newSettings).length} API key(s) processed.`,
                note: 'In production, API keys should be set as environment variables in Vercel dashboard for security.',
                savedKeys: Object.keys(newSettings)
            });
        }

        // Method not allowed
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });

    } catch (error) {
        console.error('❌ Settings API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
} 