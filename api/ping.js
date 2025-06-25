const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test Supabase connection
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('jobs')
      .select('count')
      .limit(1);

    res.status(200).json({
      success: true,
      message: 'Ping successful!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      supabase: {
        connected: !error,
        error: error?.message || null,
        dataCount: data?.length || 0
      }
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: 'Ping successful!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      supabase: {
        connected: false,
        error: error.message,
        dataCount: 0
      }
    });
  }
}; 