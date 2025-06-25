const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Initialize Supabase client directly
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Missing Supabase configuration',
                message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured'
            });
        }
        const { 
            page = 1, 
            limit = 20, 
            status, 
            company, 
            title, 
            location, 
            dateFrom, 
            dateTo 
        } = req.query;

        // Build filters object
        const filters = {};
        if (status) filters.status = status;
        if (company) filters.company = company;
        if (title) filters.title = title;
        if (location) filters.location = location;
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;

        console.log('🔍 Fetching leads with filters:', { page, limit, filters });

        // Get leads with pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Build query
        let query = supabase
            .from('jobs')
            .select('*', { count: 'exact' });

        // Apply filters
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.company) {
            query = query.ilike('company', `%${filters.company}%`);
        }
        if (filters.title) {
            query = query.ilike('title', `%${filters.title}%`);
        }
        if (filters.location) {
            query = query.ilike('location', `%${filters.location}%`);
        }
        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo);
        }

        // Apply pagination and ordering
        const { data: leads, error: leadsError, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (leadsError) {
            console.error('❌ Error fetching leads:', leadsError);
            throw leadsError;
        }

        // Get statistics
        const { count: totalCount, error: totalError } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true });

        const { count: pendingCount, error: pendingError } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        const { count: sentCount, error: sentError } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'sent');

        if (totalError || pendingError || sentError) {
            console.error('❌ Error fetching stats:', totalError || pendingError || sentError);
        }

        const totalPages = Math.ceil(count / parseInt(limit));

        const result = {
            data: leads || [],
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: count,
                itemsPerPage: parseInt(limit),
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            }
        };

        const stats = {
            total: totalCount || 0,
            pending: pendingCount || 0,
            sent: sentCount || 0,
            processed: sentCount || 0
        };

        res.status(200).json({
            success: true,
            leads: result.data,
            pagination: result.pagination,
            stats: stats
        });

    } catch (error) {
        console.error('❌ Error fetching leads:', error);
        
        // Return detailed error for debugging
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leads',
            message: error.message,
            debug: {
                hasSupabaseUrl: !!process.env.SUPABASE_URL,
                hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                errorType: error.constructor.name,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
}; 