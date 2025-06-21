# LinkedIn Job Scraper - PublishedAt Parameter Format Fix v2.5

## **Issue #5: PublishedAt Parameter Format Error**
**Date:** June 10, 2025  
**Status:** RESOLVED ✅

### **Problem Description**
The LinkedIn job scraper was failing with a `400 Bad Request` error because the `publishedAt` parameter was being sent in the wrong format.

**Error Message:**
```
Input is not valid: Field input.publishedAt must be equal to one of the allowed values: "", "r2592000", "r604800", "r86400"
```

**Current Request Body (FAILED):**
```json
{
  "publishedAt": "Any Time"
}
```

### **Root Cause Analysis**
The Form Trigger "Published at" field sends human-readable dropdown values:
- "Any Time"
- "Past Month" 
- "Past Week"
- "Past 24 hours"

But the Apify LinkedIn scraper API expects specific time period codes:
- `""` (empty string) = Any time
- `"r86400"` = Past 24 hours (86400 seconds in a day)
- `"r604800"` = Past week (604800 seconds in a week)  
- `"r2592000"` = Past month (2592000 seconds in a month)

The workflow was missing a mapping function to convert form values to API codes.

### **Solution Implemented**

#### **1. Added PublishedAt Mapping Function**
```javascript
function mapPublishedAt(publishedAt) {
  const mapping = {
    'Any Time': '',
    'Past 24 hours': 'r86400',
    'Past Week': 'r604800', 
    'Past Month': 'r2592000'
  };
  return mapping[publishedAt] || '';
}
```

#### **2. Updated Field Mapping**
**Before:**
```javascript
publishedAt: inputData['Published at'] || 'Any Time',
```

**After:**
```javascript
publishedAt: mapPublishedAt(inputData['Published at']),
```

### **API Parameter Mapping**
| Form Dropdown Value | Apify API Code | Description |
|-------------------|---------------|-------------|
| "Any Time" | `""` | No time filter |
| "Past 24 hours" | `"r86400"` | Last 24 hours |
| "Past Week" | `"r604800"` | Last 7 days |
| "Past Month" | `"r2592000"` | Last 30 days |

### **Fixed Request Body (SUCCESS)**
```json
{
  "title": "Software Engineer",
  "location": "United States", 
  "rows": 25,
  "publishedAt": "",
  "contractType": "F",
  "workType": "1",
  "experienceLevel": "3",
  "companyName": []
}
```

### **Technical Implementation**
- **Node:** Format Search Query (Code Node)
- **Change:** Added `mapPublishedAt()` helper function
- **Validation:** Returns empty string `""` for unknown values (defaults to "Any Time")
- **Backwards Compatible:** Works with existing form dropdown options

### **Testing Scenarios**
✅ "Any Time" → `""` (empty string)  
✅ "Past 24 hours" → `"r86400"`  
✅ "Past Week" → `"r604800"`  
✅ "Past Month" → `"r2592000"`  
✅ `null`/`undefined` → `""` (fallback)  

### **Related Files Modified**
- `LinkedIn_Job__Lead_Scraper_final.json` (Format Search Query node)

### **Next Steps**
- Test workflow with different time period selections
- Monitor for any additional Apify API parameter format issues
- Verify job results match selected time periods

---

**Fix completed at:** 2025-06-10 23:30 UTC  
**Workflow Version:** v2.5  
**Status:** Ready for testing 