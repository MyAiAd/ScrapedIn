const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './config.env' });

class DatabaseService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        console.log('✅ Supabase client initialized');
    }

    // Initialize database (tables should be created via Supabase console)
    async initDatabase() {
        try {
            // Test the connection
            const { data, error } = await this.supabase
                .from('jobs')
                .select('count', { count: 'exact', head: true });

            if (error) {
                console.error('❌ Error connecting to Supabase:', error);
                throw error;
            }
            
            console.log('✅ Connected to Supabase database');
            return Promise.resolve();
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    // Save a job to the database
    async saveJob(jobData) {
        try {
            const jobRecord = {
                linkedin_job_id: jobData.id || '',
                title: jobData.title || '',
                company: jobData.company || '',
                location: jobData.location || '',
                job_url: jobData.jobUrl || '',
                poster_profile_url: jobData.posterProfileUrl || '',
                poster_full_name: jobData.posterFullName || '',
                contract_type: jobData.contractType || '',
                published_at: jobData.publishedAt || '',
                description: jobData.description || '',
                email_content: jobData.emailContent || '',
                status: jobData.status || 'pending'
            };

            const { data, error } = await this.supabase
                .from('jobs')
                .insert([jobRecord])
                .select()
                .single();

            if (error) {
                console.error('❌ Error saving job:', error);
                throw error;
            }

            console.log(`✅ Job saved with ID: ${data.id}`);
            return { id: data.id, ...jobData };
        } catch (error) {
            console.error('❌ Error in saveJob:', error);
            throw error;
        }
    }

    // Get all jobs
    async getAllJobs() {
        try {
            const { data, error } = await this.supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching jobs:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('❌ Error in getAllJobs:', error);
            throw error;
        }
    }

    // Get job by ID
    async getJobById(id) {
        try {
            const { data, error } = await this.supabase
                .from('jobs')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    return null;
                }
                console.error('❌ Error fetching job:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('❌ Error in getJobById:', error);
            throw error;
        }
    }

    // Update job status
    async updateJobStatus(id, status) {
        try {
            const updateData = {
                status: status,
                updated_at: new Date().toISOString()
            };

            // If status is 'sent', also update email_sent_at
            if (status === 'sent') {
                updateData.email_sent_at = new Date().toISOString();
            }

            const { error } = await this.supabase
                .from('jobs')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('❌ Error updating job status:', error);
                throw error;
            }

            console.log(`✅ Job ${id} status updated to: ${status}`);
        } catch (error) {
            console.error('❌ Error in updateJobStatus:', error);
            throw error;
        }
    }

    // Get jobs by status
    async getJobsByStatus(status) {
        try {
            const { data, error } = await this.supabase
                .from('jobs')
                .select('*')
                .eq('status', status)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching jobs by status:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('❌ Error in getJobsByStatus:', error);
            throw error;
        }
    }

    // Add email to queue
    async addToEmailQueue(jobId, recipientEmail, subject, body) {
        try {
            const emailRecord = {
                job_id: jobId,
                recipient_email: recipientEmail,
                subject: subject,
                body: body,
                status: 'pending',
                attempts: 0
            };

            const { data, error } = await this.supabase
                .from('email_queue')
                .insert([emailRecord])
                .select()
                .single();

            if (error) {
                console.error('❌ Error adding to email queue:', error);
                throw error;
            }

            console.log(`✅ Email queued with ID: ${data.id}`);
            return { 
                id: data.id, 
                jobId, 
                recipientEmail, 
                subject, 
                body 
            };
        } catch (error) {
            console.error('❌ Error in addToEmailQueue:', error);
            throw error;
        }
    }

    // Get pending emails from queue
    async getPendingEmails() {
        try {
            const { data, error } = await this.supabase
                .from('email_queue')
                .select(`
                    *,
                    jobs:job_id (
                        title,
                        company
                    )
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('❌ Error fetching pending emails:', error);
                throw error;
            }

            // Transform the data to match the original format
            const transformedData = data?.map(item => ({
                ...item,
                job_title: item.jobs?.title,
                company: item.jobs?.company
            })) || [];

            return transformedData;
        } catch (error) {
            console.error('❌ Error in getPendingEmails:', error);
            throw error;
        }
    }

    // Update email queue status
    async updateEmailStatus(id, status) {
        try {
            // First get current attempts
            const { data: currentEmail, error: fetchError } = await this.supabase
                .from('email_queue')
                .select('attempts')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.error('❌ Error fetching current email:', fetchError);
                throw fetchError;
            }

            // Update with incremented attempts
            const { error } = await this.supabase
                .from('email_queue')
                .update({
                    status: status,
                    last_attempt: new Date().toISOString(),
                    attempts: (currentEmail.attempts || 0) + 1
                })
                .eq('id', id);

            if (error) {
                console.error('❌ Error updating email status:', error);
                throw error;
            }

            console.log(`✅ Email ${id} status updated to: ${status}`);
        } catch (error) {
            console.error('❌ Error in updateEmailStatus:', error);
            throw error;
        }
    }

    // Close database connection (not needed for Supabase, but keeping for compatibility)
    close() {
        console.log('✅ Supabase client - no connection to close');
    }

    // Get jobs with pagination
    async getJobsWithPagination(page = 1, limit = 20, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            
            // Build query
            let query = this.supabase
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
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                console.error('❌ Error fetching jobs with pagination:', error);
                throw error;
            }

            const totalPages = Math.ceil(count / limit);

            return {
                data: data || [],
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: count,
                    itemsPerPage: limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('❌ Error in getJobsWithPagination:', error);
            throw error;
        }
    }

    // Get job statistics
    async getJobStats() {
        try {
            const { data: totalCount, error: totalError } = await this.supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true });

            const { data: pendingCount, error: pendingError } = await this.supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { data: sentCount, error: sentError } = await this.supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'sent');

            if (totalError || pendingError || sentError) {
                throw totalError || pendingError || sentError;
            }

            return {
                total: totalCount || 0,
                pending: pendingCount || 0,
                sent: sentCount || 0,
                processed: (sentCount || 0)
            };
        } catch (error) {
            console.error('❌ Error in getJobStats:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService(); 