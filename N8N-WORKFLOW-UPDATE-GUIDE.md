# n8n Workflow Update Guide - Direct Apify Integration

## Overview
The frontend now sends properly formatted Apify actor parameters directly, eliminating the need for AI conversion in the n8n workflow.

## Changes Made to Frontend

### 1. New Form Field
- Added "Number of Results" dropdown (25-1000 jobs)
- Maps to Apify `rows` parameter

### 2. Direct Parameter Mapping
Frontend now sends this format directly to n8n:
```json
{
  "title": "Finance Manager",
  "location": "United Kingdom", 
  "rows": 50,
  "publishedAt": "r604800",
  "contractType": "F",
  "workType": "1",
  "experienceLevel": "3",
  "companyName": ["Company A", "Company B"],
  "proxy": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  },
  "_metadata": {
    "formFields": {...},
    "timestamp": "2024-01-01T12:00:00.000Z",
    "version": "v2.3-direct-apify"
  }
}
```

## Required n8n Workflow Updates

### Option 1: Simple Update (Recommended)
Replace the "Format Search Query" AI node with a simple Code node:

```javascript
// Code node to pass through direct Apify parameters
const { _metadata, ...apifyParams } = items[0].json;

// Remove metadata and return clean Apify parameters
return [{
  json: apifyParams
}];
```

### Option 2: Keep AI Conversion (Fallback)
Update the AI prompt to handle both old and new formats:

```
# Overview 
Check if the input data is already in Apify format. If yes, pass it through unchanged. If no, convert it.

# Check for direct Apify format:
If the input contains "title", "location", and "rows" fields, return the data unchanged (minus _metadata).

# Otherwise, apply the existing conversion rules...
```

## Step-by-Step Update Instructions

### Step 1: Open n8n Workflow
1. Open your n8n dashboard
2. Find the "LinkedIn Job Lead Scraper" workflow
3. Click to edit

### Step 2: Update the "Format Search Query" Node
1. Click on the "Format Search Query" node
2. **Option A - Replace with Code node:**
   - Delete the OpenAI node
   - Add a Code node
   - Paste the code from Option 1 above

   **Option B - Update AI prompt:**
   - Keep the OpenAI node  
   - Update the system prompt with Option 2 content

### Step 3: Test the Connection
1. Save the workflow
2. Activate the workflow
3. Test with the frontend form
4. Check the execution log to see the data format

### Step 4: Verify Apify Parameters
In the execution log, you should see:
```json
{
  "title": "Your Job Title",
  "location": "Your Location", 
  "rows": 50,
  "contractType": "F",
  // ... other properly mapped fields
}
```

## Field Mapping Reference

| Frontend Field | Apify Parameter | Values |
|---------------|----------------|---------|
| Job Title | `title` | String (required) |
| Job Location | `location` | String (required) |  
| Number of Results | `rows` | Integer 1-1000 (required) |
| Company Name | `companyName` | Array of strings |
| Published At | `publishedAt` | `""`, `r2592000`, `r604800`, `r86400` |
| Job Type | `contractType` | `F`, `P`, `C`, `T`, `I`, `V` |
| Work Type | `workType` | `1`, `2`, `3` |
| Experience Level | `experienceLevel` | `1`, `2`, `3`, `4`, `5` |

## Troubleshooting

### If Apify Returns "Invalid Parameters" Error:
1. Check the n8n execution log
2. Verify the data format matches Apify expectations
3. Ensure required fields (`title`, `location`, `rows`) are present
4. Check that mapped values are correct (e.g., `F` not `Full-time`)

### If Frontend Shows "Wrong Format" in Debug Panel:
1. Clear browser cache
2. Refresh the page
3. Check console for JavaScript errors
4. Verify config.js is loaded properly

### If Workflow Still Uses AI Conversion:
1. The AI node might be returning the old format
2. Update the AI prompt or replace with Code node
3. Test with simple parameters first

## Benefits of Direct Integration

✅ **Faster**: No AI processing delay  
✅ **Reliable**: No AI interpretation errors  
✅ **Debuggable**: Exact parameters visible in frontend  
✅ **Cost-effective**: No OpenAI API calls for format conversion  
✅ **Flexible**: Easy to add new Apify parameters  

## Testing the Update

1. Fill out the form with test data
2. Submit and watch the debug panel
3. Should show "Direct Apify Integration (v2.3)"
4. Check n8n execution log for proper parameter format
5. Verify Apify actor receives correct data

The frontend now handles all the complex mapping, so n8n just needs to pass the data through to Apify! 