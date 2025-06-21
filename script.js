// Load configuration
const N8N_WEBHOOK_URL = window.CONFIG?.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/56729510-e43f-4aee-9878-16043881f687';
const GOOGLE_SHEET_URL = window.CONFIG?.GOOGLE_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1eUVs9FOhFDwFWvsw_OHcvohAYWm5Oq9NAtSMOHA5BqA/edit';

// Global variables
let currentWorkflowId = null;
let isWorkflowRunning = false;
let statusMonitoringTimeout = null;

// DOM elements are now initialized inside DOMContentLoaded
let form, submitBtn, abortBtn, statusSection, statusContainer, resultsSection, viewSheetBtn, exportBtn;

// =================================================================================
// NEW HELPER FUNCTIONS v3.9
// =================================================================================

/**
 * Gets the appropriate n8n webhook URL (local or production)
 * based on the current hostname.
 */
function getWebhookUrl() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Use the production URL by default
    let url = window.CONFIG.N8N_WEBHOOK_URL;

    // Check if a local override exists in config.js and we are on a local environment
    if (isLocal) {
        // Find the commented-out local URL
        const localUrlMatch = /N8N_WEBHOOK_URL:\s*'(http:\/\/localhost[^']+)'/.exec(
            window.CONFIG.toString()
        );
        if (localUrlMatch && localUrlMatch[1]) {
            // Check if the production URL is commented out, indicating local mode
            if (/^\s*\/\/\s*N8N_WEBHOOK_URL: 'https.+'/.test(window.CONFIG.toString())) {
                console.log('[DEBUG v3.9] Using local n8n webhook URL:', localUrlMatch[1]);
                url = localUrlMatch[1];
            }
        }
    }
    console.log(`[DEBUG v3.9] Final webhook URL: ${url}`);
    return url;
}


/**
 * Returns Basic Authentication headers if n8n is running locally
 * and credentials are provided in config.js.
 */
function getAuthHeaders(endpoint) {
    const isLocal = endpoint.includes('localhost');
    const auth = window.CONFIG.N8N_AUTH;

    if (isLocal && auth && auth.user && auth.pass) {
        console.log('[DEBUG v3.9] Using basic authentication for local n8n.');
        return {
            'Authorization': 'Basic ' + btoa(auth.user + ':' + auth.pass)
        };
    }
    return {};
}


// =================================================================================
// CORE FUNCTIONS
// =================================================================================

// Create properly formatted Apify actor parameters
function createApifyParameters(formData) {
    // Value mapping functions
    const mapPublishedAt = (value) => {
        const mapping = {
            'Any Time': '',
            'Past Month': 'r2592000',
            'Past Week': 'r604800',
            'Past 24 hours': 'r86400'
        };
        return mapping[value] || '';
    };

    const mapJobType = (value) => {
        const mapping = {
            'Full-time': 'F',
            'Part-time': 'P',
            'Contract': 'C',
            'Temporary': 'T',
            'Internship': 'I',
            'Volunteer': 'V'
        };
        return mapping[value] || '';
    };

    const mapWorkType = (value) => {
        const mapping = {
            'On-site': '1',
            'Remote': '2',
            'Hybrid': '3'
        };
        return mapping[value] || '';
    };

    const mapExperienceLevel = (value) => {
        const mapping = {
            'Internship': '1',
            'Entry Level': '2',
            'Associate': '3',
            'Mid-Senior Level': '4',
            'Director': '5'
        };
        return mapping[value] || '';
    };

    // Normalize location for better Apify compatibility
    const normalizeLocation = (location) => {
        if (!location) return 'United States'; // Default fallback
        
        // Handle common UK variations
        const ukVariations = {
            'United Kingdom': 'United Kingdom',
            'UK': 'United Kingdom',
            'England': 'United Kingdom',
            'Great Britain': 'United Kingdom',
            'Britain': 'United Kingdom'
        };
        
        // Check if it's a UK variation
        const normalized = ukVariations[location.trim()];
        if (normalized) return normalized;
        
        // For city-specific locations in UK, ensure they include country
        const ukCities = ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Edinburgh', 'Glasgow', 'Cardiff'];
        const locationLower = location.toLowerCase();
        
        if (ukCities.some(city => locationLower.includes(city.toLowerCase()))) {
            // If it's a UK city but doesn't already include UK/United Kingdom, add it
            if (!locationLower.includes('uk') && !locationLower.includes('united kingdom') && !locationLower.includes('england')) {
                return `${location}, United Kingdom`;
            }
        }
        
        return location;
    };

    // Build Apify parameters object
    const apifyParams = {
        // Required fields - ensure they exist and are not empty
        title: formData.get('jobTitle')?.trim() || '',
        location: normalizeLocation(formData.get('jobLocation')?.trim()) || 'United States',
        rows: parseInt(formData.get('totalRows')) || 25,
        
        // Optional fields (only include if they have values)
        publishedAt: mapPublishedAt(formData.get('publishedAt')),
        contractType: mapJobType(formData.get('jobType')),
        workType: mapWorkType(formData.get('workType')),
        experienceLevel: mapExperienceLevel(formData.get('experienceLevel')),
        
        // Default proxy configuration for better results
        proxy: {
            useApifyProxy: true,
            apifyProxyGroups: ["RESIDENTIAL"]
        }
    };

    // Handle company name - convert to array if provided
    const companyName = formData.get('companyName');
    if (companyName && companyName.trim()) {
        // Split by comma and clean up
        apifyParams.companyName = companyName.split(',').map(name => name.trim()).filter(name => name.length > 0);
    }

    // Remove empty optional fields to avoid issues
    Object.keys(apifyParams).forEach(key => {
        if (key !== 'title' && key !== 'location' && key !== 'rows' && key !== 'proxy') {
            if (!apifyParams[key] || apifyParams[key] === '' || (Array.isArray(apifyParams[key]) && apifyParams[key].length === 0)) {
                delete apifyParams[key];
            }
        }
    });

    // Final validation to ensure required fields are not empty
    if (!apifyParams.title || !apifyParams.location || !apifyParams.rows) {
        console.error('[DEBUG v2.4] FRONTEND VALIDATION FAILED - Missing required fields:', {
            title: apifyParams.title,
            location: apifyParams.location, 
            rows: apifyParams.rows
        });
        throw new Error('Frontend validation failed: Missing required fields for Apify actor');
    }

    console.log('[DEBUG v2.4] Created Apify parameters:', apifyParams);
    
    return apifyParams;
}

// Form validation
function validateForm() {
    const requiredFields = ['jobTitle', 'jobLocation'];
    let isValid = true;

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.classList.add('border-red-500');
            isValid = false;
        } else if (field) {
            field.classList.remove('border-red-500');
        }
    });

    return isValid;
}

/*
 The old form submission handler that was here has been removed 
 as it is now correctly handled inside the DOMContentLoaded event listener 
 at the end of this file. This resolves the TypeError on page load.
*/

// Start the job scraping process (Node.js API - replaces n8n)
async function startWorkflow(formData) {
    console.log('[DEBUG] Starting job scraping with Node.js API...');
    console.log('[DEBUG] Form data received:', formData);
    
    try {
        // Update workflow state
        isWorkflowRunning = true;
        currentWorkflowId = Date.now().toString();
        
        // Update UI to show loading state
        setButtonLoading(true);
        showAbortButton(true);
        showStatusSection();
        
        // Clear previous results
        if (resultsSection) {
            resultsSection.classList.add('hidden');
        }
        
        // Add initial status messages
        addStatusItem('🚀 Starting job scraping process...', 'running');
        addStatusItem('📝 Preparing search parameters...', 'running');

        // Show what data we're sending
        addDebugPanel(formData);

        const baseUrl = window.CONFIG?.API_URL || 'http://localhost:3000';
        const endpoint = `${baseUrl}/api/scrape-jobs`;
        console.log(`[DEBUG] API Endpoint: ${endpoint}`);
        
        addStatusItem('🔍 Calling LinkedIn scraper via Apify...', 'running');

        // Send the request to Node.js API
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
            mode: 'cors'
        });

        console.log(`[DEBUG] Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[ERROR] API request failed:', errorText);
            updateStatusItem(2, `❌ Error: API returned ${response.status}. ${errorText}`, 'error');
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        // Parse the response
        const result = await response.json();
        console.log(`[DEBUG] API response:`, result);

        if (result.success) {
            updateStatusItem(2, `✅ LinkedIn scraping completed! Found ${result.totalFound || 0} jobs`, 'completed');
            addStatusItem('📊 Processing jobs and generating emails...', 'running');
            addStatusItem(`🤖 Generated personalized emails for ${result.jobs?.length || 0} jobs`, 'completed');
            addStatusItem('💾 Saved all data to database and Google Sheets', 'completed');
            
            // Show results if we have them
            if (result.jobs && result.jobs.length > 0) {
                addStatusItem(`🎉 Process completed! Ready to view ${result.jobs.length} results`, 'completed');
                
                // Store and display results
                storeWorkflowResults(result.jobs);
                await showResults();
                updateSummaryCards(result.jobs);
                populateResultsTable(result.jobs);
            } else {
                addStatusItem('⚠️ No jobs found matching your criteria', 'error');
                showNoResultsMessage();
            }
            
        } else {
            updateStatusItem(2, `❌ Error: ${result.error || 'Unknown error occurred'}`, 'error');
            throw new Error(result.error || 'Unknown error occurred');
        }

    } catch (error) {
        console.error('[ERROR] Job scraping failed:', error);
        addStatusItem(`❌ Fatal Error: ${error.message}`, 'error');
    } finally {
        // Always clean up UI state
        setButtonLoading(false);
        showAbortButton(false);
        isWorkflowRunning = false;
    }
}

// Add debug panel to show what data is being sent
function addDebugPanel(formData) {
    console.log('[DEBUG] Adding debug panel with form data:', formData);
    
    try {
        const debugPanel = document.createElement('div');
        debugPanel.className = 'mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg';
        
        debugPanel.innerHTML = `
            <h4 class="font-semibold text-blue-800 mb-2">🔍 DEBUG: Data Being Sent to Node.js API</h4>
            <div class="space-y-3">
                <div>
                    <h5 class="font-medium text-blue-700">📡 JSON Data:</h5>
                    <pre class="text-sm text-blue-600 whitespace-pre-wrap overflow-x-auto bg-blue-25 p-2 rounded">${JSON.stringify(formData, null, 2)}</pre>
                </div>
                <div>
                    <h5 class="font-medium text-blue-700">🎯 Data Flow:</h5>
                    <div class="text-sm text-blue-600 space-y-1">
                        <div>1. Frontend Form → Node.js API (localhost:3000)</div>
                        <div>2. Node.js → Apify LinkedIn Scraper</div>
                        <div>3. Results → Database + Google Sheets + AI Emails</div>
                        <div>4. Display results in frontend</div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after the form
        const form = document.getElementById('scrapeForm');
        if (form && form.parentNode) {
            form.parentNode.insertBefore(debugPanel, form.nextSibling);
        }
        
    } catch (error) {
        console.error('[DEBUG] Error creating debug panel:', error);
    }
}

// UI Helper Functions
function setButtonLoading(loading) {
    if (loading) {
        submitBtn.innerHTML = '<div class="loading-spinner mr-2"></div>Processing...';
        submitBtn.disabled = true;
    } else {
        submitBtn.innerHTML = '<i class="fas fa-rocket mr-2"></i>Start Job Scraping & Lead Generation';
        submitBtn.disabled = false;
    }
}

function showStatusSection() {
    statusSection.classList.remove('hidden');
    statusContainer.innerHTML = '';
}

function addStatusItem(message, status) {
    const statusItem = document.createElement('div');
    statusItem.className = 'flex items-center space-x-3 p-3 bg-gray-50 rounded-md';
    
    const iconClass = status === 'running' ? 'fas fa-spinner fa-spin' : 
                     status === 'completed' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    
    statusItem.innerHTML = `
        <i class="${iconClass} status-${status}"></i>
        <span class="${status === 'error' ? 'text-red-600' : 'text-gray-700'}">${message}</span>
    `;
    
    statusContainer.appendChild(statusItem);
    statusContainer.scrollTop = statusContainer.scrollHeight;
}

function updateStatusItem(index, message, status) {
    const statusItems = statusContainer.children;
    if (statusItems[index]) {
        const iconClass = status === 'running' ? 'fas fa-spinner fa-spin' : 
                         status === 'completed' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        
        statusItems[index].innerHTML = `
            <i class="${iconClass} status-${status}"></i>
            <span class="${status === 'error' ? 'text-red-600' : 'text-gray-700'}">${message}</span>
        `;
    }
}

async function showResults() {
    resultsSection.classList.remove('hidden');
}

function showNoResultsMessage() {
    resultsSection.classList.remove('hidden');
    const resultsTableBody = document.getElementById('resultsTableBody');
    if (resultsTableBody) {
        resultsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-search text-4xl mb-4 text-gray-300"></i>
                        <h3 class="text-lg font-medium mb-2">No Jobs Found</h3>
                        <p>Try adjusting your search criteria or expanding your location/job title.</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function storeWorkflowResults(results) {
    // Store results in localStorage for persistence
    localStorage.setItem('lastWorkflowResults', JSON.stringify(results));
    localStorage.setItem('lastWorkflowTimestamp', Date.now().toString());
    // Also store in memory for immediate access
    window.currentResults = results;
}

function updateSummaryCards(results) {
    const summaryContainer = document.getElementById('resultsSummary');
    if (!summaryContainer || !results) return;

    const totalJobs = results.length;
    const companies = [...new Set(results.map(job => job.company))].length;
    const locations = [...new Set(results.map(job => job.location))].length;
    const emailsGenerated = results.filter(job => job.emailContent).length;

    summaryContainer.innerHTML = `
        <div class="bg-blue-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-blue-600">${totalJobs}</div>
            <div class="text-sm text-blue-800">Total Jobs</div>
        </div>
        <div class="bg-green-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-green-600">${companies}</div>
            <div class="text-sm text-green-800">Companies</div>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-purple-600">${locations}</div>
            <div class="text-sm text-purple-800">Locations</div>
        </div>
        <div class="bg-orange-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-orange-600">${emailsGenerated}</div>
            <div class="text-sm text-orange-800">Emails Generated</div>
        </div>
    `;
}

function populateResultsTable(results) {
    const tbody = document.getElementById('resultsTableBody');
    if (!tbody || !results) return;

    tbody.innerHTML = '';

    results.forEach((job, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        
        row.innerHTML = `
            <td class="px-4 py-3">
                <div class="font-medium text-gray-900">${job.title || 'N/A'}</div>
                <div class="text-sm text-gray-500">${job.jobType || 'N/A'}</div>
            </td>
            <td class="px-4 py-3">
                <div class="font-medium text-gray-900">${job.company || 'N/A'}</div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">${job.location || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${job.postedDate || 'N/A'}</td>
            <td class="px-4 py-3">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    job.status === 'sent' ? 'bg-green-100 text-green-800' : 
                    job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                }">
                    ${job.status || 'pending'}
                </span>
            </td>
            <td class="px-4 py-3 text-sm">
                <div class="flex space-x-2">
                    ${job.url ? `<a href="${job.url}" target="_blank" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-external-link-alt"></i>
                    </a>` : ''}
                    ${job.emailContent ? `<button onclick="showEmailPreview('${job.id}')" class="text-green-600 hover:text-green-800">
                        <i class="fas fa-envelope"></i>
                    </button>` : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Show/hide abort button
function showAbortButton(show) {
    if (!abortBtn) return;

    try {
        if (show) {
            abortBtn.classList.remove('hidden');
            abortBtn.classList.add('abort-pulse');
        } else {
            abortBtn.classList.add('hidden');
            abortBtn.classList.remove('abort-pulse');
        }
    } catch (error) {
        console.error('Error modifying abort button class:', error);
    }
}

// Abort workflow function
function abortWorkflow() {
    console.log('[DEBUG] Aborting workflow...');
    
    // Update workflow state
    isWorkflowRunning = false;
    currentWorkflowId = null;
    
    // Update UI
    setButtonLoading(false);
    showAbortButton(false);
    
    // Add abort message to status
    addStatusItem('❌ Workflow aborted by user', 'error');
}

/**
 * Updates the status display in the UI.
 */
function updateStatus(message, type = 'info') {
    if (!statusContainer) return;
    const statusSection = document.getElementById('statusSection');
    
    if (statusSection && statusSection.classList.contains('hidden')) {
        statusSection.classList.remove('hidden');
    }

    const statusItem = document.createElement('div');
    const typeClass = {
        error: 'text-red-600',
        completed: 'text-green-600',
        info: 'text-gray-700'
    };

    statusItem.className = `status-item ${typeClass[type] || 'text-gray-700'}`;
    statusItem.innerHTML = `<p>${message}</p>`;
    statusContainer.appendChild(statusItem);
    statusContainer.scrollTop = statusContainer.scrollHeight;
}

// Email preview function
function showEmailPreview(jobId) {
    const results = JSON.parse(localStorage.getItem('lastWorkflowResults') || '[]');
    const job = results.find(j => j.id === jobId);
    
    if (job && job.emailContent) {
        alert(`Email Preview for ${job.title}:\n\n${job.emailContent}`);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] 🚀 DOM Content Loaded - Initializing v2.8...');
    
    // Initialize DOM elements
    form = document.getElementById('scrapeForm');
    submitBtn = document.getElementById('submitBtn');
    abortBtn = document.getElementById('abortBtn');
    statusSection = document.getElementById('statusSection');
    statusContainer = document.getElementById('statusContainer');
    resultsSection = document.getElementById('resultsSection');
    viewSheetBtn = document.getElementById('viewSheetBtn');
    exportBtn = document.getElementById('exportBtn');

    console.log('[DEBUG] DOM Elements found:', {
        form: !!form,
        submitBtn: !!submitBtn,
        abortBtn: !!abortBtn,
        testApiBtn: !!document.getElementById('testApiBtn'),
        sendToSheetsBtn: !!document.getElementById('sendToSheetsBtn')
    });

    // Form submission handler
    if (form) {
        console.log('[DEBUG] Form element found, adding event listener');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[DEBUG] ✅ Form submission started - EVENT TRIGGERED!');
            console.log('[DEBUG] Form element:', form);
            console.log('[DEBUG] Event:', e);

            if (!validateForm()) {
                console.log('[DEBUG] ❌ Form validation failed');
                alert('Please fill in all required fields.');
                return;
            }
            
            console.log('[DEBUG] ✅ Form validation passed');
            
            // Get form data and format it correctly for Node.js API
            const formData = new FormData(form);
            
            // Create the data object that matches what the Node.js server expects
            const searchCriteria = {
                'Job Title': formData.get('jobTitle'),
                'Job Location': formData.get('jobLocation'),
                'Company Name': formData.get('companyName') || '',
                'Job Type': formData.get('jobType'),
                'Experience Level': formData.get('experienceLevel'),
                'On-site/Remote/Hybrid': formData.get('workType'),
                'Published at': formData.get('publishedAt'),
                'Total Jobs to Scrape': parseInt(formData.get('totalRows')) || 25
            };

            console.log('[DEBUG] Sending search criteria:', searchCriteria);
            await startWorkflow(searchCriteria);
        });
    }

    // Abort button handler
    if (abortBtn) {
        abortBtn.addEventListener('click', () => {
            abortWorkflow();
        });
    }
    
    // View sheet button handler
    if (viewSheetBtn) {
        viewSheetBtn.addEventListener('click', () => {
            window.open(GOOGLE_SHEET_URL, '_blank');
        });
    }

    // Export button handler
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const results = JSON.parse(localStorage.getItem('lastWorkflowResults') || '[]');
            if (results.length > 0) {
                // Simple CSV export
                const csv = results.map(job => 
                    `"${job.title}","${job.company}","${job.location}","${job.url}"`
                ).join('\n');
                
                const blob = new Blob([`Title,Company,Location,URL\n${csv}`], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'linkedin-jobs.csv';
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('No results to export. Please run a search first.');
            }
        });
    }

    // Auto-fill form with default values
    const defaults = window.CONFIG?.DEFAULT_SEARCH || {};
    
    if (defaults.jobTitle) {
        document.getElementById('jobTitle').value = defaults.jobTitle;
    }
    if (defaults.jobLocation) {
        document.getElementById('jobLocation').value = defaults.jobLocation;
    }
    if (defaults.publishedAt) {
        document.getElementById('publishedAt').value = defaults.publishedAt;
    }
    if (defaults.jobType) {
        document.getElementById('jobType').value = defaults.jobType;
    }
    if (defaults.workType) {
        document.getElementById('workType').value = defaults.workType;
    }
    if (defaults.experienceLevel) {
        document.getElementById('experienceLevel').value = defaults.experienceLevel;
    }
    if (defaults.totalRows) {
        document.getElementById('totalRows').value = defaults.totalRows;
    }

    // Test API Connection button
    const testApiBtn = document.getElementById('testApiBtn');
    if (testApiBtn) {
        console.log('[DEBUG] ✅ Test API button found, adding click listener');
        testApiBtn.addEventListener('click', async function(e) {
            console.log('[DEBUG] 🔥 TEST API BUTTON CLICKED!');
            e.preventDefault();
            await testApiConnection();
        });
        
        // Also add immediate test
        testApiBtn.onclick = async function(e) {
            console.log('[DEBUG] 🔥 TEST API BUTTON CLICKED (onclick)!');
            alert('🧪 Test API button clicked! Check console for details.');
            e.preventDefault();
            await testApiConnection();
        };
    } else {
        console.error('[DEBUG] ❌ Test API button NOT found!');
    }
    
    // Send to Google Sheets button (uses cached results - no new API call)
    const sendToSheetsBtn = document.getElementById('sendToSheetsBtn');
    if (sendToSheetsBtn) {
        sendToSheetsBtn.addEventListener('click', async function() {
            await sendCachedResultsToSheets();
        });
    }
    
    // View Google Sheet button
    if (viewSheetBtn) {
        viewSheetBtn.addEventListener('click', function() {
            const sheetUrl = window.CONFIG?.GOOGLE_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1nkZX0o_aBZkqmAenqmqEO-CrUB3eQgJKXngRw6T3crs/edit';
            window.open(sheetUrl, '_blank');
        });
    }
    
    // Export CSV button
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportResultsToCSV();
        });
    }
});

// Test API Connection (proves frontend is working)
async function testApiConnection() {
    try {
        console.log('[DEBUG] 🧪 testApiConnection() function called!');
        console.log('[DEBUG] Testing API connection...');
        
        const testBtn = document.getElementById('testApiBtn');
        const originalText = testBtn.innerHTML;
        testBtn.innerHTML = '<div class="loading-spinner mr-2"></div>Testing...';
        testBtn.disabled = true;

        // Test basic API endpoint
        const apiUrl = window.CONFIG?.API_URL || 'http://localhost:3000';
        const testUrl = `${apiUrl}/api/sheets-status`;
        console.log(`[DEBUG] Testing: ${testUrl}`);

        const response = await fetch(testUrl, {
            method: 'GET',
            mode: 'cors'
        });

        if (response.ok) {
            const result = await response.json();
            console.log('[DEBUG] API Response:', result);
            
            const status = result.googleSheets;
            const message = `✅ API CONNECTION SUCCESSFUL!\n\n` +
                          `🔗 Server: ${apiUrl}\n` +
                          `📊 Google Sheets: ${status.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}\n` +
                          `🔐 Credentials: ${status.credentialsExists ? 'FOUND' : 'MISSING'}\n` +
                          `📋 Sheet ID: ${status.sheetsId}\n` +
                          `🎯 Mode: ${status.mode.toUpperCase()}\n\n` +
                          `Frontend Version: v2.8 (Updated)\n` +
                          `Timestamp: ${new Date().toLocaleString()}`;
            
            alert(message);
        } else {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

    } catch (error) {
        console.error('[ERROR] API test failed:', error);
        alert(`❌ API CONNECTION FAILED!\n\nError: ${error.message}\n\nCheck:\n1. Node.js server running on port 3000\n2. CORS configuration\n3. Network connectivity`);
    } finally {
        const testBtn = document.getElementById('testApiBtn');
        testBtn.innerHTML = '<i class="fas fa-wifi mr-2"></i>Test API Connection';
        testBtn.disabled = false;
    }
}

// Send cached results to Google Sheets (no new API call - saves credits!)
async function sendCachedResultsToSheets() {
    try {
        const cachedResults = getCachedResults();
        if (!cachedResults || cachedResults.length === 0) {
            alert('No cached results found. Please run a job search first.');
            return;
        }

        // Update button to show loading
        const sendBtn = document.getElementById('sendToSheetsBtn');
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<div class="loading-spinner mr-2"></div>Sending...';
        sendBtn.disabled = true;

        console.log(`[DEBUG] Sending ${cachedResults.length} cached results to Google Sheets...`);

        // Send to Node.js API to save to Google Sheets
        const baseUrl = window.CONFIG?.API_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/send-to-sheets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jobs: cachedResults,
                source: 'manual_send'
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                alert(`✅ Successfully sent ${cachedResults.length} jobs to Google Sheets!`);
                console.log('[DEBUG] Google Sheets update successful:', result);
            } else {
                alert(`❌ Error: ${result.error || 'Failed to update Google Sheets'}`);
                console.error('[ERROR] Google Sheets update failed:', result);
            }
        } else {
            const errorText = await response.text();
            alert(`❌ Server Error: ${response.status} - ${errorText}`);
            console.error('[ERROR] Server error:', errorText);
        }

    } catch (error) {
        console.error('[ERROR] Failed to send to Google Sheets:', error);
        alert(`❌ Error: ${error.message}`);
    } finally {
        // Restore button
        const sendBtn = document.getElementById('sendToSheetsBtn');
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
}

// Get cached results from localStorage or memory
function getCachedResults() {
    // First try to get from memory (current session)
    if (window.currentResults && window.currentResults.length > 0) {
        console.log(`[DEBUG] Found ${window.currentResults.length} results in memory`);
        return window.currentResults;
    }
    
    // Then try localStorage
    try {
        const cached = localStorage.getItem('lastWorkflowResults');
        if (cached) {
            const results = JSON.parse(cached);
            console.log(`[DEBUG] Found ${results.length} results in localStorage`);
            return results;
        }
    } catch (error) {
        console.error('[DEBUG] Error reading from localStorage:', error);
    }
    
    console.log('[DEBUG] No cached results found');
    return null;
}

// Export results to CSV
function exportResultsToCSV() {
    const results = getCachedResults();
    if (!results || results.length === 0) {
        alert('No results to export. Please run a job search first.');
        return;
    }

    // Create CSV content
    const headers = ['Position', 'Company', 'Location', 'Job URL', 'Poster Name', 'Poster Profile', 'Job Type', 'Published At'];
    const csvContent = [
        headers.join(','),
        ...results.map(job => [
            `"${(job.title || '').replace(/"/g, '""')}"`,
            `"${(job.company || '').replace(/"/g, '""')}"`,
            `"${(job.location || '').replace(/"/g, '""')}"`,
            `"${(job.jobUrl || '').replace(/"/g, '""')}"`,
            `"${(job.posterFullName || '').replace(/"/g, '""')}"`,
            `"${(job.posterProfileUrl || '').replace(/"/g, '""')}"`,
            `"${(job.contractType || '').replace(/"/g, '""')}"`,
            `"${(job.publishedAt || '').replace(/"/g, '""')}"`
        ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset-utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `linkedin-jobs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`[DEBUG] Exported ${results.length} jobs to CSV`);
}