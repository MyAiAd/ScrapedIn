# Fix n8n Authentication Issue v2.9

## 🚨 PROBLEM IDENTIFIED
Your n8n instance requires **Basic Authentication** for webhook access, causing `401 Unauthorized` errors.

**Error:** `HTTP 401: Unauthorized` when frontend tries to send data to n8n workflow.

**Result:** Form data never reaches the workflow → Apify gets default parameters → Wrong job results.

## ✅ SOLUTION OPTIONS

### **Option 1: Provide n8n Credentials (Recommended)**

Update your `config.js` file:

```javascript
N8N_AUTH: {
    username: 'your-actual-n8n-username',
    password: 'your-actual-n8n-password'
},
```

**How to find your n8n credentials:**
1. Check your n8n startup logs
2. Look for environment variables: `N8N_BASIC_AUTH_ACTIVE`, `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`
3. Check your n8n configuration files

### **Option 2: Use Production Webhook (ngrok)**

If you have a production n8n instance without authentication:

```javascript
// In config.js, uncomment and update:
N8N_WEBHOOK_URL: 'https://your-ngrok-url.app/webhook/56729510-e43f-4aee-9878-16043881f687',
```

### **Option 3: Disable n8n Authentication (Development Only)**

**⚠️ ONLY FOR LOCAL DEVELOPMENT**

Restart your n8n without authentication:
```bash
N8N_BASIC_AUTH_ACTIVE=false n8n start
```

Or set environment variables:
```bash
export N8N_BASIC_AUTH_ACTIVE=false
n8n start
```

## 🧪 TEST YOUR FIX

Run the test script to verify:
```bash
node test-data-flow.js
```

**Expected Success:**
- ✅ Response Status: 200 (not 401)
- ✅ HTML completion page received
- ✅ n8n workflow executes with your test data

## 🔍 VERIFICATION STEPS

1. **Test webhook access:**
   ```bash
   curl -X POST http://localhost:5678/webhook/56729510-e43f-4aee-9878-16043881f687 \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "Job+Title=Test" \
        -u "your-username:your-password"
   ```

2. **Check n8n execution logs:**
   - Go to n8n UI: http://localhost:5678
   - Check recent workflow executions
   - Look for your test data in the "Format Search Query" node

3. **Verify data flow:**
   - Form data should show "Data Scientist" (not "Software Engineer")
   - Location should be "San Francisco, CA" (not "United States")
   - Apify should receive these values

## 🎯 EXPECTED RESULTS AFTER FIX

**Before Fix:**
- ❌ 401 Unauthorized error
- ❌ Workflow never executes
- ❌ Apify gets default parameters
- ❌ Google Sheets shows "Software Engineer" jobs

**After Fix:**
- ✅ 200 OK response
- ✅ Workflow executes with your data
- ✅ Apify gets your search criteria
- ✅ Google Sheets shows actual requested jobs

## 🔧 TROUBLESHOOTING

### Still getting 401?
1. Double-check username/password in config.js
2. Verify n8n is running: http://localhost:5678
3. Check n8n environment variables
4. Try Option 3 (disable auth for testing)

### Workflow runs but uses defaults?
1. Check n8n execution logs for data received
2. Verify field name mapping in "Format Search Query" node
3. Test with: node test-data-flow.js

### Need to find n8n credentials?
1. Check how you started n8n
2. Look for docker-compose.yml or .env files
3. Check n8n documentation: https://docs.n8n.io/hosting/authentication/ 