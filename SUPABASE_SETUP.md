# 🚀 ScrapedIn - Supabase Migration Guide

## Overview
This guide walks you through migrating your LinkedIn scraper from SQLite to Supabase for full cloud deployment.

## ✅ Prerequisites Completed
- [x] Environment variables updated (`config.env`)
- [x] Package dependencies updated (`package.json`)  
- [x] Database service rewritten (`services/databaseService.js`)
- [x] SQL schema created (`supabase-schema.sql`)

## 🗂️ Next Steps to Complete Migration

### Step 1: Set Up Database Schema in Supabase

1. **Go to your Supabase project dashboard**:
   - URL: https://jaymichuelonrcrzwjlt.supabase.co
   - Click on **"SQL Editor"** in the left sidebar

2. **Run the schema creation script**:
   - Copy the entire content from `supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click **"Run"** to execute the script

3. **Verify tables were created**:
   ```sql
   SELECT table_name, column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name IN ('jobs', 'email_queue')
   ORDER BY table_name, ordinal_position;
   ```

### Step 2: Test the Connection

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Test database connection**:
   ```bash
   npm run dev
   ```

3. **Check logs for**:
   - ✅ Supabase client initialized
   - ✅ Connected to Supabase database

### Step 3: Verify API Endpoints

Test these endpoints to ensure they work with Supabase:

1. **Scrape jobs**: `POST /api/scrape-jobs`
2. **Get all jobs**: `GET /api/jobs`
3. **Update job status**: `PUT /api/jobs/:id/status`
4. **Email queue**: `POST /api/email/queue`

## 🔧 Configuration Changes Made

### Database Service Changes:
- **Before**: SQLite with callback-based queries
- **After**: Supabase with async/await and PostgreSQL

### Schema Improvements:
- **UUID primary keys** instead of text IDs
- **Proper timestamps** with timezone support  
- **Indexes** for better performance
- **Foreign key constraints** with cascade delete
- **Row Level Security** enabled

### Environment Variables:
```env
# Removed
DATABASE_PATH=./database.sqlite

# Added
SUPABASE_URL=https://jaymichuelonrcrzwjlt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎯 Benefits of Migration

1. **Cloud-Native**: No more local database files
2. **Scalable**: Handles unlimited concurrent users
3. **Real-time**: Built-in real-time subscriptions
4. **Secure**: Row-level security and built-in auth
5. **Backup**: Automatic backups and point-in-time recovery
6. **Performance**: Optimized with indexes and connection pooling

## 🔍 Troubleshooting

### Common Issues:

**Connection Error**:
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in config.env
- Check if Supabase project is active

**Table Not Found**:
- Run the `supabase-schema.sql` script in Supabase SQL Editor
- Verify tables exist: Go to Database > Tables

**Permission Denied**:
- Ensure Row Level Security policies are properly set
- Using SERVICE_ROLE_KEY should bypass RLS

### Logs to Monitor:
```bash
✅ Supabase client initialized
✅ Connected to Supabase database  
✅ Job saved with ID: [uuid]
✅ Email queued with ID: [uuid]
```

## 📊 Database Schema Overview

### Jobs Table:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
linkedin_job_id TEXT
title TEXT NOT NULL
company TEXT
location TEXT
job_url TEXT
poster_profile_url TEXT
poster_full_name TEXT
contract_type TEXT
published_at TEXT
description TEXT
email_content TEXT
status TEXT DEFAULT 'pending'
scraped_at TIMESTAMPTZ DEFAULT NOW()
email_sent_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### Email Queue Table:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
job_id UUID (FK to jobs.id)
recipient_email TEXT
subject TEXT
body TEXT
status TEXT DEFAULT 'pending'
attempts INTEGER DEFAULT 0
last_attempt TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
```

---

🎉 **You're ready for full cloud deployment!** Once this migration is complete, your entire application will run in the cloud without any local dependencies. 