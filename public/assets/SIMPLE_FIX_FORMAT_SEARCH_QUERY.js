// SIMPLE FIX v3.6 - Robust Field Extraction
// This handles all possible n8n data access patterns

console.log('\n🔍 ========== SIMPLE FIX v3.6 ==========');

// Get the form data - try all possible access patterns
let formData = {};

// Pattern 1: items[0].json (most common)
if (items[0]?.json && Object.keys(items[0].json).length > 0) {
  formData = items[0].json;
  console.log('✅ Using items[0].json - Found', Object.keys(formData).length, 'fields');
}
// Pattern 2: items[0] direct access
else if (items[0] && typeof items[0] === 'object' && Object.keys(items[0]).length > 0) {
  formData = items[0];
  console.log('✅ Using items[0] direct - Found', Object.keys(formData).length, 'fields');
}
// Pattern 3: Check if data is nested deeper
else if (items[0]?.body) {
  formData = items[0].body;
  console.log('✅ Using items[0].body - Found', Object.keys(formData).length, 'fields');
}
// Pattern 4: Check if data is in parameters
else if (items[0]?.parameters) {
  formData = items[0].parameters;
  console.log('✅ Using items[0].parameters - Found', Object.keys(formData).length, 'fields');
}
else {
  console.error('❌ No form data found in any expected location');
  console.error('❌ Available items:', JSON.stringify(items, null, 2));
  throw new Error('No form data received from Form Trigger');
}

console.log('📊 Form data keys:', Object.keys(formData));
console.log('📊 Form data:', JSON.stringify(formData, null, 2));

// Simple field extraction - just get the values directly
const jobTitle = formData['Job Title'] || formData['title'] || formData['jobTitle'] || '';
const jobLocation = formData['Job Location'] || formData['location'] || formData['jobLocation'] || '';
const totalRows = formData['Date posted'] || formData['totalRows'] || formData['rows'] || 25;

console.log('🔍 Extracted values:');
console.log('  Job Title:', jobTitle);
console.log('  Job Location:', jobLocation);
console.log('  Total Rows:', totalRows);

// Validate required fields
if (!jobTitle || jobTitle.trim() === '') {
  console.error('❌ Job Title is missing or empty');
  console.error('❌ Available fields:', Object.keys(formData));
  throw new Error('Job Title is required but not provided in form data.');
}

if (!jobLocation || jobLocation.trim() === '') {
  console.error('❌ Job Location is missing or empty');
  console.error('❌ Available fields:', Object.keys(formData));
  throw new Error('Job Location is required but not provided in form data.');
}

// Extract optional fields
const companyName = formData['Company Name'] || formData['companyName'] || '';
const jobType = formData['Job Type'] || formData['jobType'] || '';
const experienceLevel = formData['Experience Level'] || formData['experienceLevel'] || '';
const publishedAt = formData['Published at'] || formData['publishedAt'] || '';
const workType = formData['On-site/Remote/Hybrid'] || formData['workType'] || '';

// Map dropdown values to Apify format
function mapJobType(value) {
  const mapping = {
    'Full-time': 'F',
    'Part-time': 'P', 
    'Contract': 'C',
    'Temporary': 'T',
    'Volunteer': 'V',
    'Internship': 'I',
    'Other': 'O'
  };
  return mapping[value] || '';
}

function mapExperienceLevel(value) {
  const mapping = {
    'Internship': '1',
    'Entry level': '2',
    'Associate': '3', 
    'Mid-Senior Level': '4',
    'Director': '5',
    'Executive': '6'
  };
  return mapping[value] || '';
}

function mapPublishedAt(value) {
  const mapping = {
    'Past 24 hours': '1',
    'Past Week': '2',
    'Past Month': '3',
    'Any time': ''
  };
  return mapping[value] || '';
}

function mapWorkType(value) {
  const mapping = {
    'On-site': '1',
    'Remote': '2', 
    'Hybrid': '3'
  };
  return mapping[value] || '';
}

// Build final parameters
const searchParams = {
  title: jobTitle.trim(),
  location: jobLocation.trim(),
  rows: parseInt(totalRows) || 25,
  companyName: companyName.trim(),
  jobType: mapJobType(jobType),
  experienceLevel: mapExperienceLevel(experienceLevel),
  publishedAt: mapPublishedAt(publishedAt),
  workType: mapWorkType(workType)
};

console.log('✅ SUCCESS - Final search parameters:');
console.log(JSON.stringify(searchParams, null, 2));

return [{ json: searchParams }]; 