# Default Parameters Issue - Comprehensive Debug Guide (v2.7)

## 🚨 CRITICAL ISSUE IDENTIFIED

**Problem**: Despite all field mapping fixes, Apify actor is receiving **default parameters** instead of user-submitted form data.

**Evidence**: Apify actor execution shows:
```json
{
  "title": "Software Engineer",      // ❌ DEFAULT (should be user input)
  "location": "United States",       // ❌ DEFAULT (should be user input)  
  "rows": 25,                       // ❌ DEFAULT (should be user input)
  "publishedAt": "",
  "proxy": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

## 🔍 ROOT CAUSE ANALYSIS

The issue persists even after v2.6 universal field mapping, which suggests:

1. **Data Reception Issue**: Webhook not receiving expected data structure
2. **Execution Path Issue**: Workflow using old cached data or wrong execution path
3. **Field Mapping Logic Issue**: Logic failing for specific data format
4. **Timing Issue**: Form Trigger processing data differently than expected

## 🛠️ COMPREHENSIVE DEBUG SOLUTION (v2.7)

### **Enhanced "Format Search Query" Node**

The workflow now includes **comprehensive debugging** that will identify the exact issue:

```javascript
// COMPREHENSIVE DEBUG ANALYSIS (v2.7)
// This identifies exactly why default parameters are being used

// ============= KEY DEBUG SECTIONS =============
1. 📥 COMPREHENSIVE INPUT ANALYSIS - Shows raw data structure
2. 🔬 INDIVIDUAL FIELD ANALYSIS - Checks each expected field
3. 🎯 DATA SOURCE DETECTION - Identifies data format type  
4. ⚙️ ENHANCED FIELD EXTRACTION - Traces extraction process
5. 🏗️ APIFY PARAMETER CONSTRUCTION - Shows mapping results
6. 📊 FINAL ANALYSIS - Identifies default usage
```

### **Debug Output Sections**

When the workflow runs, check n8n logs for:

#### **1. Input Data Structure**
```
📊 Primary Input Data Structure: {...}
📋 Available Fields Count: X
🔑 Available Field Names: [...]
```

#### **2. Field-by-Field Analysis**
```
"Job Title": "actual_value" (string) ✅ HAS_VALUE
"Job Location": "actual_value" (string) ✅ HAS_VALUE  
"Total Jobs to Scrape": "50" (string) ✅ HAS_VALUE
```

#### **3. Field Extraction Process**
```
🔍 Extracting Job Title:
  📋 Form Trigger ("Job Title"): "user_input" ✅
  🖥️ Frontend ("title"): undefined ❌
  📝 HTML Form ("jobTitle"): undefined ❌
  🎯 Final Result: "user_input" ✅ SUCCESS
```

#### **4. Default Usage Analysis**
```
⚠️ DEFAULT USAGE ANALYSIS:
  📝 Title using default: ❌ YES / ✅ NO
  📍 Location using default: ❌ YES / ✅ NO  
  🔢 Rows using default: ❌ YES / ✅ NO
  📊 Total defaults used: 0/3
```

#### **5. Critical Issue Detection**
If defaults are used, logs will show:
```
🚨 CRITICAL ISSUE IDENTIFIED
🔥 PROBLEM: Default parameters are being used instead of user input!
🔍 LIKELY CAUSES:
   1. Frontend form field names don't match expected field names
   2. Form data is being sent in unexpected structure
   3. Webhook is receiving data from different source
   4. n8n Form Trigger is processing data differently
```

## 🧪 TESTING PROCEDURE

### **Step 1: Test with Debug Script**

Run the test script to isolate frontend vs backend issues:

```bash
node test-webhook-debug.js
```

This sends exact frontend data format to webhook and shows:
- ✅ Webhook connectivity status
- 📥 Response from n8n
- 🔍 Instructions to check n8n logs

### **Step 2: Analyze n8n Workflow Logs**

1. **Access n8n interface** (localhost:5678)
2. **Go to Executions** tab
3. **Find latest execution** (triggered by test or frontend)
4. **Click on "Format Search Query" node**
5. **Check console output** for comprehensive debug info

### **Step 3: Compare Frontend vs Test Data**

**Frontend sends:**
```javascript
{
    'Job Title': formData.get('jobTitle'),
    'Job Location': formData.get('jobLocation'),
    'Total Jobs to Scrape': formData.get('totalRows'),
    // ...
}
```

**Test script sends:**
```javascript
{
    'Job Title': 'Test Frontend Manager',
    'Job Location': 'Test Frontend Location',
    'Total Jobs to Scrape': '50',
    // ...
}
```

Both should show identical debug patterns in n8n logs.

## 🎯 EXPECTED DEBUG OUTCOMES

### **Scenario 1: Field Mapping Works (Good)**
```
🔍 Extracting Job Title:
  📋 Form Trigger ("Job Title"): "User Input Title" ✅
  🎯 Final Result: "User Input Title" ✅ SUCCESS

📝 Title: "User Input Title" → "User Input Title" → "User Input Title" ✅ USER_INPUT
```

### **Scenario 2: Field Mapping Fails (Issue)**
```
🔍 Extracting Job Title:
  📋 Form Trigger ("Job Title"): undefined ❌
  🖥️ Frontend ("title"): undefined ❌  
  📝 HTML Form ("jobTitle"): undefined ❌
  🎯 Final Result: "" ❌ WILL_USE_DEFAULT

📝 Title: "" → "" → "Software Engineer" ⚠️ DEFAULT_USED
```

### **Scenario 3: Data Structure Issue (Problem)**
```
📊 Primary Input Data Structure: {
  "body": { "Job Title": "value" },  // ❌ Nested structure
  "headers": {...}
}
🔑 Available Field Names: ["body", "headers"]  // ❌ Wrong level
```

## 🔧 TROUBLESHOOTING ACTIONS

Based on debug output:

### **If All Fields Show "undefined" or "❌ EMPTY"**
- **Issue**: Data not reaching Format Search Query node correctly
- **Check**: Workflow connections, webhook configuration, execution path

### **If Data Shows Nested Structure**
- **Issue**: n8n Form Trigger wrapping data differently
- **Fix**: Update field extraction to handle nested structure

### **If Frontend vs Test Shows Different Results**
- **Issue**: Frontend sending different data than expected
- **Check**: Browser Network tab, form field names, JavaScript processing

### **If Everything Looks Correct But Still Using Defaults**
- **Issue**: Logic error in field mapping or parameter construction
- **Check**: String processing, data type conversions, conditional logic

## 📋 NEXT STEPS

1. **Run test script**: `node test-webhook-debug.js`
2. **Check n8n logs**: Look for comprehensive debug output
3. **Identify specific issue**: Use debug patterns above
4. **Apply targeted fix**: Based on root cause identified
5. **Verify resolution**: Confirm real user data reaches Apify actor

## 🎯 SUCCESS CRITERIA

When fixed, Apify actor should receive:
```json
{
  "title": "User Actual Input",      // ✅ USER DATA
  "location": "User Actual Input",   // ✅ USER DATA
  "rows": 50,                       // ✅ USER DATA (not 25)
  "publishedAt": "r604800",         // ✅ MAPPED VALUE
  "contractType": "F",              // ✅ MAPPED VALUE
  // ... other user-specified fields
}
```

The debug system will provide exact visibility into where the data flow breaks and enable precise targeted fixes. 