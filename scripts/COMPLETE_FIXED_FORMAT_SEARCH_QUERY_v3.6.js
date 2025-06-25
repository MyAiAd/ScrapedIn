// COMPLETE v3.6 - FIELD MAPPING FIXED - Direct Field Extraction
// This replaces the entire Format Search Query node code

console.log('\n🔍 ========== COMPLETE v3.6 FIELD MAPPING FIXED ==========');
console.log('📥 Raw items array:', JSON.stringify(items, null, 2));
console.log('📥 First item:', JSON.stringify(items[0], null, 2));

// Form Trigger data detection - try multiple access patterns
let inputData = {};

if (items[0]?.json) {
  inputData = items[0].json;
  console.log('✅ Using items[0].json format');
} else if (items[0]) {
  inputData = items[0];
  console.log('✅ Using items[0] direct format');
} else {
  console.error('❌ No data found in items');
  throw new Error('No form data received');
}

console.log('\n📊 Available fields:', Object.keys(inputData));
console.log('\n🔍 Field values:');
for (const [key, value] of Object.entries(inputData)) {
  console.log(`  "${key}": ${typeof value} = "${value}"`);
}

// Field extraction with comprehensive empty value handling
function extractField(primaryName, altNames = [], description = '') {
  const fieldNames = [primaryName, ...altNames];
  
  for (const fieldName of fieldNames) {
    let value = inputData[fieldName];
    
    if (value === null || value === undefined || value === '' || value === 'undefined') {
      continue;
    }
    
    if (typeof value !== 'string') {
      value = String(value);
    }
    
    value = value.trim();
    
    if (value !== '') {
      console.log(`✅ ${description}: "${value}" from field "${fieldName}"`);
      return value;
    }
  }
  
  console.log(`⚠️ ${description}: No value found in [${fieldNames.join(', ')}]`);
  return null;
}

// Extract required fields - FIXED with ALL possible field name variations
const jobTitle = extractField('Job Title', ['title', 'jobTitle', 'Job Title'], 'Job Title');
const jobLocation = extractField('Job Location', ['location', 'jobLocation', 'Job Location'], 'Job Location');

// Validate required fields (v3.6 - JSON format with correct field names)
if (!jobTitle) {
  console.error('\n🚨 ERROR: Job Title is required but not provided');
  console.error('Available fields:', Object.keys(inputData));
  console.error('Field values:', JSON.stringify(inputData, null, 2));
  throw new Error('Job Title is required but not provided in form data.');
}

if (!jobLocation) {
  console.error('\n🚨 ERROR: Job Location is required but not provided');
  console.error('Available fields:', Object.keys(inputData));
  console.error('Field values:', JSON.stringify(inputData, null, 2));
  throw new Error('Job Location is required but not provided in form data.');
}

console.log('✅ VALIDATION PASSED: Both Job Title and Job Location found!');

// Extract optional fields - FIXED with ALL possible field name variations
const companyName = extractField('Company Name', ['companyName', 'company', 'Company Name'], 'Company Name');
const jobType = extractField('Job Type', ['jobType', 'contractType', 'Job Type'], 'Job Type');
const experienceLevel = extractField('Experience Level', ['experienceLevel', 'experience', 'Experience Level'], 'Experience Level');
const publishedAt = extractField('Published at', ['publishedAt', 'published', 'Published at'], 'Published At');
const workType = extractField('On-site/Remote/Hybrid', ['workType', 'remote', 'On-site/Remote/Hybrid'], 'Work Type');

// Extract total rows with ALL possible field name variations - FIXED
const totalRows = extractField('Date posted', ['Total Jobs to Scrape', 'totalRows', 'rows', 'Date posted'], 'Total Rows');
const finalRows = totalRows ? parseInt(totalRows) : 25;

// Map dropdown values to API codes
function mapJobType(jobType) {
  const mapping = {
    'Full-time': 'F',
    'Part-time': 'P',
    'Contract': 'C',
    'Temporary': 'T',
    'Internship': 'I',
    'Volunteer': 'V'
  };
  return mapping[jobType] || '';
}

function mapExperienceLevel(level) {
  const mapping = {
    'Internship': '1',
    'Entry Level': '2',
    'Associate': '3',
    'Mid-Senior Level': '4',
    'Director': '5'
  };
  return mapping[level] || '';
}

function mapPublishedAt(period) {
  const mapping = {
    'Any Time': '',
    'Past Month': 'r2592000',
    'Past Week': 'r604800',
    'Past 24 hours': 'r86400'
  };
  return mapping[period] || '';
}

function mapWorkType(type) {
  const mapping = {
    'On-site': '1',
    'Remote': '2',
    'Hybrid': '3'
  };
  return mapping[type] || '';
}

console.log('\n🔧 FINAL VALUES FOR APIFY (v3.6 - FIELD MAPPING FIXED):');
console.log('Job Title:', jobTitle);
console.log('Job Location:', jobLocation);
console.log('Total Rows:', finalRows);

// Build final Apify parameters
const apifyParams = {
  title: jobTitle,
  location: jobLocation,
  rows: finalRows
};

// Add optional parameters with proper mapping
if (companyName) {
  apifyParams.companyName = [companyName];
}

if (jobType) {
  apifyParams.contractType = mapJobType(jobType);
}

if (experienceLevel) {
  apifyParams.experienceLevel = mapExperienceLevel(experienceLevel);
}

if (publishedAt) {
  apifyParams.publishedAt = mapPublishedAt(publishedAt);
}

if (workType) {
  apifyParams.workType = mapWorkType(workType);
}

// Add proxy configuration (same as original)
apifyParams.proxy = {
  useApifyProxy: true,
  apifyProxyGroups: ['RESIDENTIAL']
};

console.log('\n🎯 Final Apify Parameters (v3.6):', JSON.stringify(apifyParams, null, 2));
console.log('✅ SUCCESS - Field mapping fixed, ready for LinkedIn scraper');

return [{ json: apifyParams }]; 