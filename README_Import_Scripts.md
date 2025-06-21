# N8N Workflow Bulk Import Scripts

This directory contains scripts to automatically import all workflows from the `exported-workflows` folder into your n8n instance.

## Available Scripts

### 1. Python Script (`import_workflows_to_n8n.py`)
**Recommended for most users** - Full featured with better error handling

### 2. Bash Script (`import_workflows.sh`) 
**Lightweight alternative** - Simple and fast

## Prerequisites

### For Python Script:
```bash
# Install Python dependencies
pip install requests
```

### For Bash Script:
```bash
# Install required tools (Ubuntu/Debian)
sudo apt-get install curl jq

# For macOS
brew install curl jq
```

## Configuration

### 1. Edit the configuration in your chosen script:

**Python Script (`import_workflows_to_n8n.py`):**
```python
N8N_CONFIG = {
    "base_url": "http://localhost:5678",  # Your n8n URL
    "api_key": None,                      # Your API key (if using)
    "username": None,                     # Basic auth username (if using)
    "password": None,                     # Basic auth password (if using)
}
```

**Bash Script (`import_workflows.sh`):**
```bash
N8N_BASE_URL="http://localhost:5678"   # Your n8n URL
N8N_API_KEY=""                         # Your API key (if using)
N8N_USERNAME=""                        # Basic auth username (if using)  
N8N_PASSWORD=""                        # Basic auth password (if using)
```

### 2. Import Settings:
Both scripts allow you to configure:
- `UPDATE_EXISTING`: Update workflows if they already exist
- `ACTIVATE_AFTER_IMPORT`: Activate workflows after import
- `DELAY_BETWEEN_IMPORTS`: Seconds to wait between imports

## Usage

### Python Script:
```bash
python import_workflows_to_n8n.py
```

### Bash Script:
```bash
./import_workflows.sh
```

## What the Scripts Do

1. **🔍 Discover workflows**: Scans the `exported-workflows` directory for `.json` files
2. **🔗 Test connection**: Verifies connection to your n8n instance
3. **📋 List existing**: Gets list of existing workflows in n8n
4. **📥 Import workflows**: For each workflow file:
   - Creates new workflow if it doesn't exist
   - Updates existing workflow if `UPDATE_EXISTING` is true
   - Activates workflow if `ACTIVATE_AFTER_IMPORT` is true
5. **📊 Show summary**: Reports success/failure count

## Expected Output

```
============================================================
🚀 N8N Workflow Bulk Import Script
============================================================
[INFO] Found 42 workflow files
[✅ SUCCESS] Connected to n8n at http://localhost:5678
[INFO] Fetching existing workflows...
[INFO] Found 3 existing workflows in n8n

============================================================
📥 Starting workflow import process...
============================================================

[1/42] Processing: 3_linkedin_scraper.json
[INFO] Updating existing workflow: LinkedIn Scraper
[✅ SUCCESS] Updated workflow: LinkedIn Scraper

[2/42] Processing: 4_linkedin_recruiting.json
[INFO] Creating new workflow: LinkedIn Recruiting
[✅ SUCCESS] Created workflow: LinkedIn Recruiting
...

============================================================
📊 Import Summary
============================================================
[INFO] Total workflows processed: 42
[✅ SUCCESS] Successfully imported: 42
[✅ SUCCESS] All workflows imported successfully! 🎉

🔗 Access your workflows at: http://localhost:5678/workflows
```

## Authentication Options

### Option 1: No Authentication (Default n8n setup)
Leave all auth fields empty - works for local n8n instances without auth.

### Option 2: API Key Authentication
Set your API key in the config:
```python
"api_key": "your-api-key-here"
```

### Option 3: Basic Authentication  
Set username and password:
```python
"username": "your-username",
"password": "your-password"
```

## Troubleshooting

### "Could not connect to n8n"
- Make sure n8n is running
- Check the `base_url` is correct
- Verify n8n API is accessible (try visiting `http://localhost:5678/rest/workflows` in your browser)

### "Authentication failed"
- Check your API key or username/password
- Make sure authentication is properly configured in n8n

### "Failed to import workflow"
- Check the workflow JSON file is valid
- Some workflows may have credentials or dependencies that need manual setup
- Review the error message for specific details

## Files Imported

The scripts will import all `.json` files from the `exported-workflows` directory, including:

- `3_linkedin_scraper.json` ← **Your fixed LinkedIn workflow!**
- `4_linkedin_recruiting.json`
- All other workflow files (42 total)

## Important Notes

⚠️ **The scripts will update your existing workflows!** Make sure you want to replace them.

✅ **Your fixed LinkedIn workflow** (`LinkedIn_Job__Lead_Scraper_final.json`) is not in the exported-workflows directory, so you'll need to import it manually or copy it there first.

🔄 **Recommended**: Copy your fixed workflow to exported-workflows first:
```bash
cp LinkedIn_Job__Lead_Scraper_final.json exported-workflows/0_linkedin_scraper_fixed.json
```

Then run the import script to update all workflows including your fixes! 