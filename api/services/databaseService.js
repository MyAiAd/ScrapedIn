const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

class DatabaseService {
    constructor() {
        this.dbPath = process.env.DATABASE_PATH || './database.sqlite';
        this.db = null;
    }

    // Initialize database and create tables
    initDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error opening database:', err);
                    reject(err);
                    return;
                }
                
                console.log('✅ Connected to SQLite database');
                this.createTables()
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    // Create necessary tables
    createTables() {
        return new Promise((resolve, reject) => {
            const createJobsTable = `
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
                    linkedin_job_id TEXT,
                    title TEXT NOT NULL,
                    company TEXT,
                    location TEXT,
                    job_url TEXT,
                    poster_profile_url TEXT,
                    poster_full_name TEXT,
                    contract_type TEXT,
                    published_at TEXT,
                    description TEXT,
                    email_content TEXT,
                    status TEXT DEFAULT 'pending',
                    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    email_sent_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const createEmailQueueTable = `
                CREATE TABLE IF NOT EXISTS email_queue (
                    id TEXT PRIMARY KEY,
                    job_id TEXT,
                    recipient_email TEXT,
                    subject TEXT,
                    body TEXT,
                    status TEXT DEFAULT 'pending',
                    attempts INTEGER DEFAULT 0,
                    last_attempt DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (job_id) REFERENCES jobs (id)
                )
            `;

            this.db.run(createJobsTable, (err) => {
                if (err) {
                    console.error('❌ Error creating jobs table:', err);
                    reject(err);
                    return;
                }

                this.db.run(createEmailQueueTable, (err) => {
                    if (err) {
                        console.error('❌ Error creating email_queue table:', err);
                        reject(err);
                        return;
                    }

                    console.log('✅ Database tables created successfully');
                    resolve();
                });
            });
        });
    }

    // Save a job to the database
    async saveJob(jobData) {
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            const sql = `
                INSERT INTO jobs (
                    id, linkedin_job_id, title, company, location, job_url,
                    poster_profile_url, poster_full_name, contract_type,
                    published_at, description, email_content, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                id,
                jobData.id || '',
                jobData.title || '',
                jobData.company || '',
                jobData.location || '',
                jobData.jobUrl || '',
                jobData.posterProfileUrl || '',
                jobData.posterFullName || '',
                jobData.contractType || '',
                jobData.publishedAt || '',
                jobData.description || '',
                jobData.emailContent || '',
                jobData.status || 'pending'
            ];

            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('❌ Error saving job:', err);
                    reject(err);
                    return;
                }

                console.log(`✅ Job saved with ID: ${id}`);
                resolve({ id, ...jobData });
            });
        });
    }

    // Get all jobs
    async getAllJobs() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM jobs ORDER BY created_at DESC';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('❌ Error fetching jobs:', err);
                    reject(err);
                    return;
                }

                resolve(rows);
            });
        });
    }

    // Get job by ID
    async getJobById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM jobs WHERE id = ?';
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error('❌ Error fetching job:', err);
                    reject(err);
                    return;
                }

                resolve(row);
            });
        });
    }

    // Update job status
    async updateJobStatus(id, status) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE jobs 
                SET status = ?, updated_at = CURRENT_TIMESTAMP,
                    email_sent_at = CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE email_sent_at END
                WHERE id = ?
            `;
            
            this.db.run(sql, [status, status, id], function(err) {
                if (err) {
                    console.error('❌ Error updating job status:', err);
                    reject(err);
                    return;
                }

                console.log(`✅ Job ${id} status updated to: ${status}`);
                resolve();
            });
        });
    }

    // Get jobs by status
    async getJobsByStatus(status) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC';
            
            this.db.all(sql, [status], (err, rows) => {
                if (err) {
                    console.error('❌ Error fetching jobs by status:', err);
                    reject(err);
                    return;
                }

                resolve(rows);
            });
        });
    }

    // Add email to queue
    async addToEmailQueue(jobId, recipientEmail, subject, body) {
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            const sql = `
                INSERT INTO email_queue (id, job_id, recipient_email, subject, body)
                VALUES (?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [id, jobId, recipientEmail, subject, body], function(err) {
                if (err) {
                    console.error('❌ Error adding to email queue:', err);
                    reject(err);
                    return;
                }

                console.log(`✅ Email queued with ID: ${id}`);
                resolve({ id, jobId, recipientEmail, subject, body });
            });
        });
    }

    // Get pending emails from queue
    async getPendingEmails() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT eq.*, j.title as job_title, j.company 
                FROM email_queue eq
                JOIN jobs j ON eq.job_id = j.id
                WHERE eq.status = 'pending'
                ORDER BY eq.created_at ASC
            `;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('❌ Error fetching pending emails:', err);
                    reject(err);
                    return;
                }

                resolve(rows);
            });
        });
    }

    // Update email queue status
    async updateEmailStatus(id, status) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE email_queue 
                SET status = ?, last_attempt = CURRENT_TIMESTAMP,
                    attempts = attempts + 1
                WHERE id = ?
            `;
            
            this.db.run(sql, [status, id], function(err) {
                if (err) {
                    console.error('❌ Error updating email status:', err);
                    reject(err);
                    return;
                }

                console.log(`✅ Email ${id} status updated to: ${status}`);
                resolve();
            });
        });
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err);
                } else {
                    console.log('✅ Database connection closed');
                }
            });
        }
    }
}

module.exports = new DatabaseService(); 