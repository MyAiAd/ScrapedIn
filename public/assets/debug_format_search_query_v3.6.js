// COMPLETE DEBUG v3.6 - COMPREHENSIVE DATA ANALYSIS
// This will show us EXACTLY what data is being received

console.log('\n🔍 ========== COMPREHENSIVE DEBUG v3.6 ==========');
console.log('🔍 Raw items type:', typeof items);
console.log('🔍 Raw items length:', items ? items.length : 'undefined');
console.log('🔍 Raw items array (full):', JSON.stringify(items, null, 2));

// Check if items exists and has content
if (!items || items.length === 0) {
  console.error('❌ CRITICAL: No items received at all');
  console.error('❌ This means the Form Trigger is not passing data to this node');
  throw new Error('DEBUG: No items received from Form Trigger');
}

console.log('\n📊 ANALYZING FIRST ITEM:');
console.log('📊 items[0] type:', typeof items[0]);
console.log('📊 items[0] keys:', items[0] ? Object.keys(items[0]) : 'no keys');
console.log('📊 items[0] full content:', JSON.stringify(items[0], null, 2));

// Try different data access patterns
let inputData = {};
let dataSource = 'unknown';

if (items[0]?.json) {
  inputData = items[0].json;
  dataSource = 'items[0].json';
  console.log('✅ Using items[0].json format');
  console.log('✅ items[0].json keys:', Object.keys(inputData));
  console.log('✅ items[0].json content:', JSON.stringify(inputData, null, 2));
} else if (items[0]) {
  inputData = items[0];
  dataSource = 'items[0] direct';
  console.log('✅ Using items[0] direct format');
  console.log('✅ items[0] keys:', Object.keys(inputData));
  console.log('✅ items[0] content:', JSON.stringify(inputData, null, 2));
} else {
  console.error('❌ No data found in items');
  throw new Error('DEBUG: No form data received');
}

console.log('\n🔍 DATA SOURCE ANALYSIS:');
console.log('🔍 Data source:', dataSource);
console.log('🔍 Input data type:', typeof inputData);
console.log('🔍 Input data keys:', Object.keys(inputData));
console.log('🔍 Input data values:');
for (const [key, value] of Object.entries(inputData)) {
  console.log(`  "${key}": ${typeof value} = "${value}"`);
}

// Check for specific field names we expect
const expectedFields = ['Job Title', 'Job Location', 'Date posted', 'Company Name', 'Published at', 'Job Type', 'On-site/Remote/Hybrid', 'Experience Level'];
console.log('\n🔍 FIELD PRESENCE CHECK:');
expectedFields.forEach(field => {
  const hasField = inputData.hasOwnProperty(field);
  const value = inputData[field];
  console.log(`  "${field}": ${hasField ? '✅ PRESENT' : '❌ MISSING'} - Value: "${value}"`);
});

// Check for alternative field names
const alternativeFields = ['title', 'jobTitle', 'location', 'jobLocation', 'totalRows', 'rows', 'companyName', 'company'];
console.log('\n🔍 ALTERNATIVE FIELD CHECK:');
alternativeFields.forEach(field => {
  const hasField = inputData.hasOwnProperty(field);
  const value = inputData[field];
  console.log(`  "${field}": ${hasField ? '✅ PRESENT' : '❌ MISSING'} - Value: "${value}"`);
});

// Field extraction with comprehensive empty value handling
function extractField(primaryName, altNames = [], description = '') {
  const fieldNames = [primaryName, ...altNames];
  
  console.log(`\n🔍 Extracting ${description}:`);
  console.log(`🔍 Looking for fields: [${fieldNames.join(', ')}]`);
  
  for (const fieldName of fieldNames) {
    const hasField = inputData.hasOwnProperty(fieldName);
    let value = inputData[fieldName];
    
    console.log(`  🔍 Checking "${fieldName}": exists=${hasField}, value="${value}", type=${typeof value}`);
    
    if (value === null || value === undefined || value === '' || value === 'undefined') {
      console.log(`    ❌ Skipping "${fieldName}" - empty value`);
      continue;
    }
    
    if (typeof value !== 'string') {
      value = String(value);
      console.log(`    🔄 Converted to string: "${value}"`);
    }
    
    value = value.trim();
    
    if (value !== '') {
      console.log(`    ✅ ${description}: "${value}" from field "${fieldName}"`);
      return value;
    } else {
      console.log(`    ❌ Skipping "${fieldName}" - empty after trim`);
    }
  }
  
  console.log(`  ⚠️ ${description}: No value found in [${fieldNames.join(', ')}]`);
  return null;
}

// Extract required fields - FIXED with ALL possible field name variations
console.log('\n🔍 ========== FIELD EXTRACTION ==========');
const jobTitle = extractField('Job Title', ['title', 'jobTitle', 'Job Title'], 'Job Title');
const jobLocation = extractField('Job Location', ['location', 'jobLocation', 'Job Location'], 'Job Location');

console.log('\n🔍 ========== VALIDATION RESULTS ==========');
console.log('🔍 Job Title result:', jobTitle);
console.log('🔍 Job Location result:', jobLocation);

// Enhanced validation with detailed error reporting
if (!jobTitle) {
  console.error('\n🚨 VALIDATION FAILED: Job Title is missing or empty');
  console.error('🚨 Available fields:', Object.keys(inputData));
  console.error('🚨 Field values:', JSON.stringify(inputData, null, 2));
  console.error('🚨 Data source was:', dataSource);
  throw new Error('DEBUG: Job Title is required but not provided in form data.');
}

if (!jobLocation) {
  console.error('\n🚨 VALIDATION FAILED: Job Location is missing or empty');
  console.error('🚨 Available fields:', Object.keys(inputData));
  console.error('🚨 Field values:', JSON.stringify(inputData, null, 2));
  console.error('🚨 Data source was:', dataSource);
  throw new Error('DEBUG: Job Location is required but not provided in form data.');
}

console.log('\n✅ VALIDATION PASSED: Both Job Title and Job Location found!');

// Extract optional fields - FIXED with ALL possible field name variations
const companyName = extractField('Company Name', ['companyName', 'company', 'Company Name'], 'Company Name');
const jobType = extractField('Job Type', ['jobType', 'contractType', 'Job Type'], 'Job Type');
const experienceLevel = extractField('Experience Level', ['experienceLevel', 'experience', 'Experience Level'], 'Experience Level');
const publishedAt = extractField('Published at', ['publishedAt', 'published', 'Published at'], 'Published At');
const workType = extractField('On-site/Remote/Hybrid', ['workType', 'remote', 'On-site/Remote/Hybrid'], 'Work Type');

// Extract total rows with ALL possible field name variations - FIXED
const totalRows = extractField('Date posted', ['Total Jobs to Scrape', 'totalRows', 'rows', 'Date posted'], 'Total Rows');
const finalRows = totalRows ? parseInt(totalRows) : 25;

console.log('\n🔍 ========== FINAL EXTRACTED VALUES ==========');
console.log('🔍 Job Title:', jobTitle);
console.log('🔍 Job Location:', jobLocation);
console.log('🔍 Company Name:', companyName);
console.log('🔍 Job Type:', jobType);
console.log('🔍 Experience Level:', experienceLevel);
console.log('🔍 Published At:', publishedAt);
console.log('🔍 Work Type:', workType);
console.log('🔍 Total Rows:', finalRows);

// Build final Apify parameters
const apifyParams = {
  title: jobTitle,
  location: jobLocation,
  rows: finalRows
};

console.log('\n🎯 SUCCESS - Debug analysis complete');
console.log('🎯 Final Apify Parameters:', JSON.stringify(apifyParams, null, 2));

return [{ json: apifyParams }]; 