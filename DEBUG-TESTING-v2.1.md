# Debug & Testing Guide - v2.1

## Visible Changes Made ✅

You can now confirm you're using the **latest version** by checking:

1. **Header**: Shows `"v2.1 - AI MAPPING FIXED"` badge
2. **Form**: Shows `"v2.1 - Latest"` indicator in top-right
3. **Submit Button**: Now says `"Start Job Scraping & Lead Generation (v2.1)"`
4. **Debug Panel**: Blue panel appears after form submission showing exact data sent
5. **Console Logs**: Check browser console for `[DEBUG v2.1]` messages

## Issues Fixed in v2.1

### 1. **AI Prompt Mapping Issues** ✅
- Fixed field name mismatches (`"Full-time"` vs `"Fulltime"`)
- Fixed typos (`"Associate"` vs `"Assosiate"`)
- Removed hardcoded values that ignored form input
- Improved AI instructions for clearer processing

### 2. **Infinite "Updating Google Sheets" Loop** ✅
- Fixed status monitoring that never completed
- Added proper completion logic
- Added debug logging to track progress

### 3. **CompanyName API Format** ✅
- Changed from `"companyName": "string"` to `"companyName": ["array"]`
- This matches Apify LinkedIn scraper expected format

## How to Test

### Step 1: Visual Confirmation
1. **Refresh your UI** - You should see version indicators
2. **Check the header** - Look for green `v2.1` badge
3. **Look at form** - Should show `v2.1 - Latest` in corner

### Step 2: Debug the Data Flow
1. **Fill out the form** with specific criteria:
   ```
   Job Title: "Software Engineer"
   Location: "United Kingdom" 
   Job Type: "Full-time"
   Experience: "Mid-Senior Level"
   ```

2. **Submit the form** - A blue debug panel should appear showing:
   ```json
   {
     "Job Title": "Software Engineer",
     "Job Location": "United Kingdom",
     "Job Type": "Full-time",
     "Experience Level": "Mid-Senior Level",
     ...
   }
   ```

3. **Check browser console** (F12 → Console tab):
   ```
   [DEBUG v2.1] Form data being sent to webhook: {...}
   [DEBUG] Starting status monitoring - v2.1
   [DEBUG] Processing step X of 8
   ```

### Step 3: Verify Workflow Completion
- Status should progress through all 8 steps
- Should end with "Workflow completed successfully!"
- Should show results (demo data if webhook fails)

## Expected AI Processing

With the fixed prompt, the AI should now:

1. **Receive** your exact form data
2. **Map** correctly:
   - `"Full-time"` → `"F"`
   - `"United Kingdom"` → `"United Kingdom"` (no change)
   - `"Mid-Senior Level"` → `"4"`
   - `"On-site"` → `"1"`

3. **Output** proper JSON:
   ```json
   {
     "title": "Software Engineer",
     "location": "United Kingdom", 
     "companyName": [""],
     "contractType": "F",
     "experienceLevel": "4",
     "workType": "1",
     "proxy": {...}
   }
   ```

## If Still Getting Wrong Results

### Debug Checklist:
- [ ] Do you see version indicators in UI?
- [ ] Does debug panel show your exact input?
- [ ] Check browser console for `[DEBUG v2.1]` logs
- [ ] Is n8n workflow activated?
- [ ] Is webhook URL correct in `config.js`?

### AI Processing Debug:
1. **Check n8n execution history** in your n8n interface
2. **Look at "Format Search Query" node output** - should show mapped values
3. **Check "LinkedIn Scraper" node input** - should receive mapped JSON

### Possible Remaining Issues:
1. **Cached old workflow**: Try deactivating and reactivating your n8n workflow
2. **Wrong webhook**: Double-check webhook ID matches between UI and n8n
3. **AI model**: Consider switching to a different AI model if GPT-4 is inconsistent

## Testing Different Scenarios

Try these specific combinations to verify mapping:

| Test | Job Title | Location | Job Type | Expected Result |
|------|-----------|----------|----------|----------------|
| 1 | "Accountant" | "Canada" | "Part-time" | Canadian part-time accounting jobs |
| 2 | "Manager" | "Australia" | "Contract" | Australian contract management jobs |
| 3 | "Developer" | "Germany" | "Remote" | German remote developer jobs |

## Current Status

✅ **UI Updated**: Version 2.1 with visual indicators  
✅ **Debug Added**: Full data flow visibility  
✅ **AI Fixed**: Corrected mapping and instructions  
✅ **Status Fixed**: No more infinite loops  
✅ **API Format**: CompanyName now uses array format  

If you're still getting US jobs after these fixes, the issue is likely in the n8n workflow execution or AI model response consistency. 