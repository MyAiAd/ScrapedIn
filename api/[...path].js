// Import the Express app
const app = require('./app');

// Export the serverless function
module.exports = (req, res) => {
    // Set base path for API
    req.url = req.url.replace(/^\/api/, '');
    if (req.url === '') req.url = '/';
    
    return app(req, res);
}; 