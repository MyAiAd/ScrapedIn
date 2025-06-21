# Google Sheets API Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Google Cloud Project & Enable API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** > **Library**
4. Search for "Google Sheets API" and **Enable** it

### Step 2: Create Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **Service Account**
3. Enter name: `linkedin-scraper-service`
4. Click **Create and Continue**
5. Skip role assignment (click **Continue**)
6. Click **Done**

### Step 3: Generate Key File

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Click **Create** - this downloads the credentials file

### Step 4: Configure Your Project

1. **Move the downloaded JSON file** to your project directory:
   ```bash
   mv ~/Downloads/linkedin-scraper-service-*.json ./google-credentials.json
   ```

2. **Update your config.env file** by adding:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
   ```

3. **Share your Google Sheet** with the service account:
   - Open your Google Sheet: https://docs.google.com/spreadsheets/d/1nkZX0o_aBZkqmAenqmqEO-CrUB3eQgJKXngRw6T3crs/edit
   - Click **Share** button
   - Add the service account email (found in the JSON file as `client_email`)
   - Give it **Editor** permissions
   - Click **Send**

### Step 5: Test the Integration

Restart your Node.js server:
```bash
npm run dev
```

You should see:
```
🔐 Using service account credentials...
✅ Google Sheets API initialized successfully
```

## Alternative: Quick API Key Method (Read-Only)

If you just want to test quickly:

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API Key**
3. Copy the API key
4. Add to config.env:
   ```env
   GOOGLE_API_KEY=your-api-key-here
   ```

**Note**: API keys only work for public sheets and read-only access.

## Troubleshooting

### Error: "The caller does not have permission"
- Make sure you shared the sheet with the service account email
- Check that the service account has Editor permissions

### Error: "Credentials not found"
- Verify the path to google-credentials.json is correct
- Make sure the file exists and is valid JSON

### Error: "Sheets API not enabled"
- Go back to Google Cloud Console
- Enable the Google Sheets API for your project

## Security Note

- Keep your `google-credentials.json` file secure
- Add it to `.gitignore` to avoid committing it to version control
- The service account email will appear in your sheet's sharing settings 