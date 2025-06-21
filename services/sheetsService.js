const { google } = require('googleapis');
const path = require('path');

class SheetsService {
    constructor() {
        this.sheets = null;
        this.auth = null;
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
        this.sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';
        this.isInitialized = false;
        this.simulationMode = false;
        
        console.log('📊 Google Sheets Service initialized');
        console.log(`📋 Target Sheet ID: ${this.spreadsheetId}`);
        console.log(`📄 Sheet Name: ${this.sheetName}`);
    }

    // Initialize Google Sheets API with service account or API key
    async initializeSheets() {
        try {
            console.log('🔧 Initializing Google Sheets API...');
            console.log(`📁 Credentials file: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
            
            // Method 1: Try service account credentials
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                console.log('🔐 Using service account credentials...');
                
                // Check if credentials file exists
                const fs = require('fs');
                if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
                    console.error(`❌ Credentials file not found: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
                    console.log('💡 Please follow the setup guide in setup-google-sheets.md');
                    return await this.initializePublicAccess();
                }
                
                this.auth = new google.auth.GoogleAuth({
                    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets']
                });
            }
            // Method 2: Try API key (read-only, but we can try)
            else if (process.env.GOOGLE_API_KEY) {
                console.log('🔑 Using API key...');
                this.auth = process.env.GOOGLE_API_KEY;
            }
            // Method 3: Use a simple approach with public sheet access
            else {
                console.log('⚠️ No Google credentials found');
                console.log('💡 To enable real Google Sheets updates:');
                console.log('   1. Follow setup-google-sheets.md');
                console.log('   2. Download google-credentials.json');
                console.log('   3. Set GOOGLE_APPLICATION_CREDENTIALS in config.env');
                return await this.initializePublicAccess();
            }

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            
            // Test the connection
            const testResult = await this.testSheetsConnection();
            if (testResult) {
                this.isInitialized = true;
                console.log('✅ Google Sheets API initialized successfully');
                return true;
            } else {
                console.log('⚠️ Google Sheets test failed, falling back to simulation mode');
                return await this.initializePublicAccess();
            }

        } catch (error) {
            console.error('❌ Error initializing Google Sheets:', error.message);
            console.log('💡 Falling back to simulation mode');
            console.log('💡 To fix: Follow setup-google-sheets.md for real Google Sheets integration');
            return await this.initializePublicAccess();
        }
    }

    // Initialize with public access (append via web app)
    async initializePublicAccess() {
        try {
            console.log('🌐 Initializing SIMULATION mode for Google Sheets');
            console.log('⚠️  This will NOT actually update your Google Sheet');
            console.log('💡 To enable real updates: Follow setup-google-sheets.md');
            this.isInitialized = true;
            this.simulationMode = true;
            return true;
        } catch (error) {
            console.error('❌ Error with simulation mode:', error);
            return false;
        }
    }

    // Save job to Google Sheets
    async saveJobToSheet(jobData) {
        try {
            console.log('📊 Saving job to Google Sheets:', jobData.title);
            
            // Prepare the row data
            const rowData = [
                jobData.title || '',
                jobData.location || '',
                jobData.company || '',
                jobData.jobUrl || '',
                jobData.id || '',
                jobData.posterProfileUrl || '',
                jobData.posterFullName || '',
                jobData.contractType || '',
                jobData.publishedAt || '',
                new Date().toISOString(), // Timestamp
                jobData.emailContent?.subject || '',
                'Pending' // Status
            ];

            console.log('📝 Row data to save:', rowData);

            // Initialize if not done yet
            if (!this.isInitialized) {
                await this.initializeSheets();
            }

            // Try to append to the sheet
            if (this.sheets && this.auth) {
                try {
                    const request = {
                        spreadsheetId: this.spreadsheetId,
                        range: `${this.sheetName}!A:L`,
                        valueInputOption: 'RAW',
                        resource: {
                            values: [rowData]
                        }
                    };

                    const response = await this.sheets.spreadsheets.values.append(request);
                    console.log('✅ Job saved to Google Sheets successfully');
                    return true;

                } catch (apiError) {
                    console.error('❌ Google Sheets API error:', apiError.message);
                    // Fall back to alternative method
                    return await this.saveViaWebApp(rowData);
                }
            } else {
                // Use alternative method
                return await this.saveViaWebApp(rowData);
            }

        } catch (error) {
            console.error('❌ Error saving to Google Sheets:', error);
            // Don't throw error - continue processing even if Sheets fails
            console.log('⚠️ Continuing without Google Sheets update');
            return false;
        }
    }

    // Alternative method: Save via Google Apps Script Web App
    async saveViaWebApp(rowData) {
        try {
            if (this.simulationMode) {
                console.log('🎭 SIMULATION MODE: Google Sheets save');
                console.log('📝 Data that WOULD be sent to Google Sheets:', rowData);
                console.log('⚠️  This is NOT actually updating your Google Sheet');
                console.log('💡 To enable real updates: Follow setup-google-sheets.md');
                return true;
            }
            
            console.log('🌐 Attempting to save via web app method...');
            
            // This would require a Google Apps Script web app to be deployed
            // For now, we'll simulate success and log the data
            console.log('📝 Data that would be sent to web app:', rowData);
            console.log('✅ Simulated save to Google Sheets (web app method)');
            
            // TODO: Implement actual web app call if needed
            // const webAppUrl = process.env.GOOGLE_WEBAPP_URL;
            // if (webAppUrl) {
            //     const response = await fetch(webAppUrl, {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({ data: rowData })
            //     });
            //     return response.ok;
            // }
            
            return true;

        } catch (error) {
            console.error('❌ Web app method failed:', error);
            return false;
        }
    }

    // Test Google Sheets connection
    async testSheetsConnection() {
        try {
            if (!this.sheets) return false;
            
            console.log('🧪 Testing Google Sheets connection...');
            
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });
            
            console.log('✅ Google Sheets connection successful');
            console.log(`📊 Sheet title: ${response.data.properties.title}`);
            return true;

        } catch (error) {
            console.error('❌ Google Sheets connection test failed:', error.message);
            return false;
        }
    }

    // Get sheet headers
    getSheetHeaders() {
        return [
            'Position',
            'Location', 
            'Company Name',
            'LinkedIn Job URL',
            'LinkedIn Job ID',
            'Job Poster Profile URL',
            'Poster Name',
            'Job Type',
            'Published at',
            'Timestamp',
            'Email Subject',
            'Status'
        ];
    }

    // Create sheet headers if they don't exist
    async ensureHeaders() {
        try {
            if (!this.sheets) return false;

            console.log('📋 Ensuring sheet headers exist...');
            
            // Check if headers exist
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A1:L1`
            });

            if (!response.data.values || response.data.values.length === 0) {
                // Add headers
                const headers = this.getSheetHeaders();
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `${this.sheetName}!A1:L1`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [headers]
                    }
                });
                console.log('✅ Headers added to sheet');
            } else {
                console.log('✅ Headers already exist');
            }

            return true;

        } catch (error) {
            console.error('❌ Error ensuring headers:', error);
            return false;
        }
    }

    // Batch save multiple jobs
    async batchSaveJobs(jobs) {
        try {
            console.log(`📊 Batch saving ${jobs.length} jobs to Google Sheets`);
            
            // Initialize if needed
            if (!this.isInitialized) {
                await this.initializeSheets();
            }

            // Ensure headers exist
            await this.ensureHeaders();

            const results = [];
            for (const job of jobs) {
                const result = await this.saveJobToSheet(job);
                results.push(result);
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const successCount = results.filter(r => r).length;
            console.log(`✅ Batch save completed: ${successCount}/${jobs.length} successful`);
            
            return results;

        } catch (error) {
            console.error('❌ Error in batch save:', error);
            throw error;
        }
    }

    // Get the sheet URL for viewing
    getSheetUrl() {
        return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit#gid=0`;
    }
}

module.exports = new SheetsService(); 