# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Download Files
Make sure you have these 4 files:
- ✅ `index.html` - Main interface
- ✅ `script.js` - JavaScript functionality  
- ✅ `config.js` - Configuration settings
- ✅ `README.md` - Full documentation

### Step 2: Update Configuration
Open `config.js` and update these two lines:

```javascript
N8N_WEBHOOK_URL: 'YOUR_ACTUAL_WEBHOOK_URL_HERE',
GOOGLE_SHEET_URL: 'YOUR_GOOGLE_SHEET_URL_HERE'
```

**To find your webhook URL:**
1. Open your n8n workflow
2. Find the "LinkedIn Apify Actor" node (Form Trigger)
3. Copy the webhook URL
4. Paste it in `config.js`

### Step 3: Open & Test
1. Open `index.html` in your web browser
2. Fill in some test search criteria
3. Click "Start Job Scraping & Lead Generation"
4. If webhook isn't connected yet, you'll see demo data

### Step 4: Go Live
Once your webhook URL is correct:
1. Upload all files to your web server
2. Access via your domain
3. Start scraping LinkedIn jobs!

## 🎯 For Your Use Case

Since you're focusing on **finance and accounting in the UK**, the form is pre-filled with:
- Job Title: "Finance Manager, Accounting Specialist, Financial Analyst"
- Location: "United Kingdom"  
- Job Type: "Full-time"
- Experience Level: "Associate"

## 🔧 Common Issues

**Webhook not working?**
- Check the URL is correct
- Test it directly in your browser
- Make sure n8n workflow is active

**No results showing?**
- Check your Google Sheets permissions
- Verify Apify API credentials in n8n
- Check n8n execution logs

## 📞 Your Client's Flow

1. **You run searches** using this frontend
2. **Workflow finds jobs** and researches posters  
3. **Emails are generated** and sent automatically
4. **Appointments get booked** directly to their calendar
5. **Client only sees** the booked appointments!

Perfect for keeping your process secret while delivering results. 🎯 