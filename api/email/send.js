const crypto = require('crypto');

// AWS SES using direct API calls (no SDK needed)
async function sendEmailWithSES(to, subject, htmlBody, textBody = null, fromEmail = null) {
    try {
        const region = process.env.AWS_SES_REGION || 'us-east-1';
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        
        if (!accessKeyId || !secretAccessKey) {
            throw new Error('AWS credentials not configured');
        }

        const fromAddress = fromEmail || process.env.SES_FROM_EMAIL || process.env.SMTP_USER;
        if (!fromAddress) {
            throw new Error('No from email address configured');
        }

        // Prepare the email data
        const emailData = {
            'Action': 'SendEmail',
            'Version': '2010-12-01',
            'Source': fromAddress,
            'Message.Subject.Data': subject,
            'Message.Subject.Charset': 'UTF-8',
            'Message.Body.Html.Data': htmlBody,
            'Message.Body.Html.Charset': 'UTF-8'
        };

        // Add text body if provided
        if (textBody) {
            emailData['Message.Body.Text.Data'] = textBody;
            emailData['Message.Body.Text.Charset'] = 'UTF-8';
        }

        // Add recipients
        const recipients = Array.isArray(to) ? to : [to];
        recipients.forEach((email, index) => {
            emailData[`Destination.ToAddresses.member.${index + 1}`] = email;
        });

        // Create AWS Signature Version 4
        const host = `email.${region}.amazonaws.com`;
        const endpoint = `https://${host}/`;
        const service = 'ses';
        const method = 'POST';
        
        const now = new Date();
        const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const dateStamp = amzDate.substr(0, 8);

        // Create the string to sign
        const algorithm = 'AWS4-HMAC-SHA256';
        const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
        
        // Create canonical request
        const payloadParams = new URLSearchParams(emailData).toString();
        const payloadHash = crypto.createHash('sha256').update(payloadParams).digest('hex');
        
        const canonicalHeaders = [
            `host:${host}`,
            `x-amz-date:${amzDate}`
        ].join('\n') + '\n';
        
        const signedHeaders = 'host;x-amz-date';
        
        const canonicalRequest = [
            method,
            '/',
            '',
            canonicalHeaders,
            signedHeaders,
            payloadHash
        ].join('\n');

        // Create string to sign
        const stringToSign = [
            algorithm,
            amzDate,
            credentialScope,
            crypto.createHash('sha256').update(canonicalRequest).digest('hex')
        ].join('\n');

        // Calculate signature
        const kDate = crypto.createHmac('sha256', `AWS4${secretAccessKey}`).update(dateStamp).digest();
        const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
        const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
        const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
        const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

        // Create authorization header
        const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        // Make the request
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': authorizationHeader,
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                'X-Amz-Date': amzDate,
                'Host': host
            },
            body: payloadParams
        });

        const responseText = await response.text();
        
        if (!response.ok) {
            throw new Error(`SES API error: ${response.status} - ${responseText}`);
        }

        // Parse response to get MessageId
        const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/);
        const messageId = messageIdMatch ? messageIdMatch[1] : 'unknown';

        return {
            success: true,
            messageId: messageId,
            provider: 'AWS SES'
        };

    } catch (error) {
        console.error('❌ SES Email failed:', error);
        return {
            success: false,
            error: error.message,
            provider: 'AWS SES'
        };
    }
}

// Fallback SMTP function (keeping for compatibility)
async function sendEmailWithSMTP(to, subject, htmlBody, textBody = null) {
    try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject,
            html: htmlBody,
            text: textBody
        };

        const result = await transporter.sendMail(mailOptions);
        
        return {
            success: true,
            messageId: result.messageId,
            provider: 'SMTP'
        };

    } catch (error) {
        console.error('❌ SMTP Email failed:', error);
        return {
            success: false,
            error: error.message,
            provider: 'SMTP'
        };
    }
}

// Main email sending function with auto-detection
async function sendEmail(to, subject, htmlBody, textBody = null, fromEmail = null) {
    // Determine which email service to use
    const useSES = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const useSMTP = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (useSES) {
        console.log('📧 Using AWS SES for email delivery');
        return await sendEmailWithSES(to, subject, htmlBody, textBody, fromEmail);
    } else if (useSMTP) {
        console.log('📧 Using SMTP for email delivery');
        return await sendEmailWithSMTP(to, subject, htmlBody, textBody);
    } else {
        return {
            success: false,
            error: 'No email service configured (neither SES nor SMTP)',
            provider: 'none'
        };
    }
}

// Test email function
async function sendTestEmail(to, useAI = false) {
    const subject = 'ScrapedIn Test Email';
    const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0077b5;">📧 ScrapedIn Email Test</h2>
            <p>This is a test email from your ScrapedIn application.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>AI Generated:</strong> ${useAI ? 'Yes' : 'No'}</p>
            <hr style="border: 1px solid #e9ecef; margin: 20px 0;">
            <p style="color: #666; font-size: 0.9em;">
                If you received this email, your email configuration is working correctly! 🎉
            </p>
        </div>
    `;
    
    const textBody = `
ScrapedIn Email Test

This is a test email from your ScrapedIn application.
Timestamp: ${new Date().toISOString()}
AI Generated: ${useAI ? 'Yes' : 'No'}

If you received this email, your email configuration is working correctly!
    `;

    return await sendEmail(to, subject, htmlBody, textBody);
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, subject, htmlBody, textBody, fromEmail, isTest = false, useAI = false } = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Recipient email address is required'
            });
        }

        let result;

        if (isTest) {
            // Send test email
            result = await sendTestEmail(to, useAI);
        } else {
            // Send custom email
            if (!subject || !htmlBody) {
                return res.status(400).json({
                    success: false,
                    error: 'Subject and HTML body are required for custom emails'
                });
            }

            result = await sendEmail(to, subject, htmlBody, textBody, fromEmail);
        }

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Email sent successfully',
                messageId: result.messageId,
                provider: result.provider
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.error,
                provider: result.provider
            });
        }

    } catch (error) {
        console.error('❌ Email API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

// Export functions for use in other modules
module.exports.sendEmail = sendEmail;
module.exports.sendTestEmail = sendTestEmail; 