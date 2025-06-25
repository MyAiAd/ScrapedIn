# Vercel Environment Setup for ScrapedIn

## 🚨 Required Environment Variables

Your Vercel deployment needs these environment variables configured:

### 1. Supabase Configuration
```
SUPABASE_URL=https://jaymichuelonrcrzwjlt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpheW1pY2h1ZWxvbnJjcnp3amx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY3MTY4OCwiZXhwIjoyMDY2MjQ3Njg4fQ.zQBcTaCmPzmopSDPGMfsulymB-AZHWnx0waLIlt3pZU
```

### 2. Google Sheets Configuration
```
GOOGLE_SHEETS_ID=1nkZX0o_aBZkqmAenqmqEO-CrUB3eQgJKXngRw6T3crs
GOOGLE_SHEET_NAME=Sheet1
```

### 3. Apify Configuration
```
APIFY_API_KEY=apify_api_ndlgY92xAGzuRYobhYKBfPmBL9ayaa2I5Ekp
```

## 📋 How to Set Environment Variables on Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click on your ScrapedIn project

2. **Open Settings**
   - Click on the "Settings" tab
   - Navigate to "Environment Variables" in the sidebar

3. **Add Each Variable**
   - Click "Add New"
   - Enter the name (e.g., `SUPABASE_URL`)
   - Enter the value
   - Select environments: Production, Preview, Development (check all three)
   - Click "Save"

4. **Redeploy After Adding Variables**
   - Go to "Deployments" tab
   - Click the three dots (...) on the latest deployment
   - Click "Redeploy"

## 🧪 Testing the Setup

After setting up environment variables:

1. **Wait for deployment to complete** (1-2 minutes)
2. **Visit your leads page**: `https://your-app.vercel.app/leads`
3. **Click "🧪 Test API" button**
4. **Check results**:
   - ✅ Should show "API Tests Successful!"
   - ✅ Should show "Has Supabase URL: true"
   - ✅ Should show "Has Supabase Key: true"

## 🔍 Troubleshooting

### If Test API Button Shows:
- **❌ Basic ping failed**: API routing issue, check vercel.json
- **❌ Has Supabase URL: false**: Missing SUPABASE_URL environment variable
- **❌ Has Supabase Key: false**: Missing SUPABASE_SERVICE_ROLE_KEY environment variable

### Common Issues:
1. **Environment variables not set**: Follow setup steps above
2. **Need to redeploy**: Environment changes require redeployment
3. **Case sensitivity**: Variable names must match exactly

## 📞 Next Steps

1. Set up all environment variables as listed above
2. Redeploy your Vercel application
3. Test the API using the "🧪 Test API" button
4. If tests pass, the leads page should work perfectly

If you're still having issues after this setup, the problem is likely with the Vercel deployment configuration itself. 