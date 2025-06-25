const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        if (req.method === 'GET') {
            // Get all jobs
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching jobs:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch jobs',
                    message: error.message
                });
            }

            return res.status(200).json({
                success: true,
                jobs: data || [],
                count: data?.length || 0
            });
        }

        if (req.method === 'PUT') {
            // Update job status
            const { id, status } = req.body;
            if (!id || !status) {
                return res.status(400).json({
                    success: false,
                    error: 'Job ID and status are required'
                });
            }

            const updateData = {
                status: status,
                updated_at: new Date().toISOString()
            };

            if (status === 'sent') {
                updateData.email_sent_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('jobs')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('❌ Error updating job status:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update job status',
                    message: error.message
                });
            }

            return res.status(200).json({
                success: true,
                message: `Job ${id} status updated to ${status}`
            });
        }

        if (req.method === 'DELETE') {
            // Delete job (if needed in the future)
            return res.status(501).json({
                success: false,
                error: 'Delete functionality not implemented'
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('❌ Error in jobs API:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process jobs request',
            message: error.message
        });
    }
}; 