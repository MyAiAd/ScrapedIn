// Multi-purpose API endpoint - handles ping and settings
// Updated to work around deployment issues

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

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle settings functionality if requested
  const { action } = req.query;
  
  if (action === 'settings') {
    if (req.method === 'GET') {
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

      if (Object.keys(newSettings).length === 0) {
          return res.status(400).json({
              success: false,
              error: 'No valid settings provided. Make sure to enter new API keys (not masked ones).'
          });
      }
      
      return res.status(200).json({
          success: true,
          message: `Settings validated successfully! ${Object.keys(newSettings).length} API key(s) processed.`,
          note: 'In production, API keys should be set as environment variables in Vercel dashboard for security.',
          savedKeys: Object.keys(newSettings)
      });
    }
  }

  // Default ping functionality
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
} 