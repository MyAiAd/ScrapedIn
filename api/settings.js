const fs = require('fs').promises;
const path = require('path');

// Path to store settings (in a secure way in production)
const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

// Default settings structure
const DEFAULT_SETTINGS = {
    apifyKey: process.env.APIFY_API_KEY || '',
    openaiKey: process.env.OPENAI_API_KEY || '',
    openrouterKey: process.env.OPENROUTER_API_KEY || '',
    anthropicKey: process.env.ANTHROPIC_API_KEY || ''
};

async function loadSettings() {
    try {
        // First try to load from file
        const data = await fs.readFile(SETTINGS_FILE, 'utf8');
        const fileSettings = JSON.parse(data);
        
        // Merge with environment variables (env vars take precedence)
        return {
            ...fileSettings,
            ...DEFAULT_SETTINGS
        };
    } catch (error) {
        // If file doesn't exist or is corrupted, return defaults
        return DEFAULT_SETTINGS;
    }
}

async function saveSettings(newSettings) {
    try {
        const currentSettings = await loadSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2));
        return true;
    } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
    }
}

function maskApiKey(key) {
    if (!key || key.length < 8) return '';
    return '••••••••' + key.slice(-4);
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Load and return masked settings
            const settings = await loadSettings();
            
            const maskedSettings = {
                apifyKey: maskApiKey(settings.apifyKey),
                openaiKey: maskApiKey(settings.openaiKey),
                openrouterKey: maskApiKey(settings.openrouterKey),
                anthropicKey: maskApiKey(settings.anthropicKey)
            };

            return res.status(200).json(maskedSettings);
        }

        if (req.method === 'POST') {
            const { apifyKey, openaiKey, openrouterKey, anthropicKey } = req.body;

            // Validate input
            const newSettings = {};
            if (apifyKey && typeof apifyKey === 'string' && apifyKey.trim()) {
                newSettings.apifyKey = apifyKey.trim();
            }
            if (openaiKey && typeof openaiKey === 'string' && openaiKey.trim()) {
                newSettings.openaiKey = openaiKey.trim();
            }
            if (openrouterKey && typeof openrouterKey === 'string' && openrouterKey.trim()) {
                newSettings.openrouterKey = openrouterKey.trim();
            }
            if (anthropicKey && typeof anthropicKey === 'string' && anthropicKey.trim()) {
                newSettings.anthropicKey = anthropicKey.trim();
            }

            if (Object.keys(newSettings).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No valid settings provided'
                });
            }

            // Save settings
            const saved = await saveSettings(newSettings);
            
            if (saved) {
                return res.status(200).json({
                    success: true,
                    message: 'Settings saved successfully'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to save settings'
                });
            }
        }

        // Method not allowed
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });

    } catch (error) {
        console.error('Settings API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}; 