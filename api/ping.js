// Simple ping endpoint to test API functionality
// Updated to force Vercel redeployment

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
} 