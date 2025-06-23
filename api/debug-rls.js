const { createClient } = require('@supabase/supabase-js');

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
        const results = {
            timestamp: new Date().toISOString(),
            environment: {
                hasSupabaseUrl: !!process.env.SUPABASE_URL,
                hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
                hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                supabaseUrl: process.env.SUPABASE_URL ? 
                    process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET'
            },
            tests: {}
        };

        // Test 1: Service Role Client
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const serviceClient = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            try {
                // Test basic connection
                const { data: connectionTest, error: connectionError } = await serviceClient
                    .from('jobs')
                    .select('count', { count: 'exact', head: true });

                results.tests.serviceRoleConnection = {
                    success: !connectionError,
                    error: connectionError?.message,
                    count: connectionTest
                };

                // Test insert permission
                const { data: insertTest, error: insertError } = await serviceClient
                    .from('jobs')
                    .insert([{
                        title: 'RLS Test Job',
                        company: 'Test Company',
                        status: 'test'
                    }])
                    .select()
                    .single();

                results.tests.insertPermission = {
                    success: !insertError,
                    error: insertError?.message,
                    insertedId: insertTest?.id
                };

                // Test select permission
                const { data: selectTest, error: selectError } = await serviceClient
                    .from('jobs')
                    .select('id, title, company, status')
                    .eq('status', 'test')
                    .limit(5);

                results.tests.selectPermission = {
                    success: !selectError,
                    error: selectError?.message,
                    recordCount: selectTest?.length || 0
                };

                // Cleanup test data
                if (insertTest?.id) {
                    await serviceClient
                        .from('jobs')
                        .delete()
                        .eq('id', insertTest.id);
                }

            } catch (error) {
                results.tests.serviceRoleConnection = {
                    success: false,
                    error: error.message
                };
            }
        } else {
            results.tests.serviceRoleConnection = {
                success: false,
                error: 'Missing Supabase credentials'
            };
        }

        // Test 2: Anon Client (should be blocked by RLS)
        if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
            const anonClient = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
            );

            try {
                const { data: anonTest, error: anonError } = await anonClient
                    .from('jobs')
                    .select('count', { count: 'exact', head: true });

                results.tests.anonConnection = {
                    success: !anonError,
                    error: anonError?.message,
                    shouldBeBlocked: true,
                    note: 'This should fail due to RLS policies'
                };
            } catch (error) {
                results.tests.anonConnection = {
                    success: false,
                    error: error.message,
                    shouldBeBlocked: true,
                    note: 'This should fail due to RLS policies'
                };
            }
        }

        return res.status(200).json({
            success: true,
            message: 'RLS Debug Test Complete',
            results
        });

    } catch (error) {
        console.error('❌ Error in RLS debug:', error);
        return res.status(500).json({
            success: false,
            error: 'Debug test failed',
            message: error.message
        });
    }
}; 