const mjml = require('mjml');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const { mjml: mjmlCode, deviceView = 'desktop' } = req.body;

        if (!mjmlCode) {
            return res.status(400).json({ 
                success: false, 
                error: 'MJML code is required' 
            });
        }

        console.log('Compiling MJML code...');
        
        // Compile MJML to HTML
        const result = mjml(mjmlCode, {
            validationLevel: 'soft',
            minify: false
        });

        if (result.errors && result.errors.length > 0) {
            console.warn('MJML compilation warnings:', result.errors);
        }

        // Add responsive CSS for mobile view if needed
        let html = result.html;
        if (deviceView === 'mobile') {
            html = html.replace(
                '<style type="text/css">',
                `<style type="text/css">
                    @media only screen and (max-width: 480px) {
                        .mj-column-per-100 { width: 100% !important; max-width: 100% !important; }
                        .mj-column-per-50 { width: 100% !important; max-width: 100% !important; }
                        .mj-column-per-33 { width: 100% !important; max-width: 100% !important; }
                        .mj-column-per-25 { width: 100% !important; max-width: 100% !important; }
                    }`
            );
        }

        console.log('MJML compilation successful');
        
        res.json({ 
            success: true, 
            html: html,
            warnings: result.errors || []
        });
        
    } catch (error) {
        console.error('MJML compilation error:', error);
        res.status(400).json({ 
            success: false, 
            error: `MJML compilation failed: ${error.message}` 
        });
    }
}; 