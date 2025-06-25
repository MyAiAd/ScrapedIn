const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    // Save a job to Supabase
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
                console.error('❌ Error saving job to Supabase:', error);
                throw error;
            }

            console.log(`✅ Job saved with ID: ${data.id}`);
            return data;
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
                console.error('❌ Error fetching jobs from Supabase:', error);
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
                console.error('❌ Error fetching job from Supabase:', error);
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

            if (status === 'sent') {
                updateData.email_sent_at = new Date().toISOString();
            }

            const { error } = await this.supabase
                .from('jobs')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('❌ Error updating job status in Supabase:', error);
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
                console.error('❌ Error fetching jobs by status from Supabase:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('❌ Error in getJobsByStatus:', error);
            throw error;
        }
    }

    // Get jobs with pagination and filtering
    async getJobsWithPagination(page = 1, limit = 10, filters = {}) {
        try {
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

            // Apply pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('❌ Error fetching paginated jobs from Supabase:', error);
                throw error;
            }

            const totalPages = Math.ceil(count / limit);

            return {
                jobs: data || [],
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
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
            const { data, error } = await this.supabase
                .from('jobs')
                .select('status');

            if (error) {
                console.error('❌ Error fetching job stats from Supabase:', error);
                throw error;
            }

            const stats = {
                total: data.length,
                pending: data.filter(job => job.status === 'pending').length,
                sent: data.filter(job => job.status === 'sent').length,
                processed: data.filter(job => job.status === 'processed').length
            };

            return stats;
        } catch (error) {
            console.error('❌ Error in getJobStats:', error);
            throw error;
        }
    }

    // Add to email queue
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
                console.error('❌ Error adding to email queue in Supabase:', error);
                throw error;
            }

            console.log(`✅ Email added to queue with ID: ${data.id}`);
            return data;
        } catch (error) {
            console.error('❌ Error in addToEmailQueue:', error);
            throw error;
        }
    }

    // Get pending emails
    async getPendingEmails() {
        try {
            const { data, error } = await this.supabase
                .from('email_queue')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('❌ Error fetching pending emails from Supabase:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('❌ Error in getPendingEmails:', error);
            throw error;
        }
    }

    // Update email status
    async updateEmailStatus(id, status) {
        try {
            const updateData = {
                status: status,
                last_attempt: new Date().toISOString()
            };

            if (status === 'failed') {
                // Increment attempts count
                const { data: currentData } = await this.supabase
                    .from('email_queue')
                    .select('attempts')
                    .eq('id', id)
                    .single();

                if (currentData) {
                    updateData.attempts = (currentData.attempts || 0) + 1;
                }
            }

            const { error } = await this.supabase
                .from('email_queue')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('❌ Error updating email status in Supabase:', error);
                throw error;
            }

            console.log(`✅ Email ${id} status updated to: ${status}`);
        } catch (error) {
            console.error('❌ Error in updateEmailStatus:', error);
            throw error;
        }
    }

    // Test database connection
    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('jobs')
                .select('count')
                .limit(1);

            if (error) {
                console.error('❌ Database connection test failed:', error);
                return false;
            }

            console.log('✅ Database connection test successful');
            return true;
        } catch (error) {
            console.error('❌ Database connection test error:', error);
            return false;
        }
    }
}

module.exports = new DatabaseService(); 