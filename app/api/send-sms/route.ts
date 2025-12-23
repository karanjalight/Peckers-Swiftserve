import { NextRequest, NextResponse } from 'next/server';
const AfricasTalking = require('africastalking');

/**
 * Format phone number to international format for Africa's Talking
 * Supports formats: +254XXXXXXXXX, 254XXXXXXXXX, 0XXXXXXXXX
 */
function formatPhoneNumber(phone: string): string {
  // Remove all spaces and special characters except +
  let formatted = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Remove leading + if present
  if (formatted.startsWith('+')) {
    formatted = formatted.substring(1);
  }
  
  // If starts with 0, replace with 254 (Kenya country code)
  if (formatted.startsWith('0')) {
    formatted = '254' + formatted.substring(1);
  }
  
  // If doesn't start with country code, assume Kenya (254)
  if (!formatted.startsWith('254')) {
    formatted = '254' + formatted;
  }
  
  return formatted;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Support both 'to' and 'phone' parameter names for compatibility
    // Accept single phone number (string) or multiple (array/comma-separated string) for bulk SMS
    const phoneNumber = body.to || body.phone;
    const message = body.message;

    // Validate input
    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Handle bulk SMS: convert to array if needed
    let phoneNumbers: string[];
    if (Array.isArray(phoneNumber)) {
      phoneNumbers = phoneNumber;
    } else if (typeof phoneNumber === 'string' && phoneNumber.includes(',')) {
      // Comma-separated string
      phoneNumbers = phoneNumber.split(',').map(p => p.trim()).filter(p => p);
    } else {
      // Single phone number
      phoneNumbers = [phoneNumber];
    }

    if (phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: 'At least one phone number is required' },
        { status: 400 }
      );
    }

    // Get credentials from environment variables (support both naming conventions)
    const username = (process.env.AFRICAS_TALKING_API_USERNAME || process.env.AFRICASTALKING_API_USERNAME)?.trim();
    const apiKey = (process.env.AFRICAS_TALKING_API_KEY || process.env.AFRICASTALKING_API_KEY)?.trim();
    const isSandboxMode = username?.toLowerCase() === 'sandbox';
    
    // In sandbox mode, sender ID is usually not allowed or must be omitted
    // In production, use the configured sender ID or default
    const senderIdFromEnv = (process.env.AFRICAS_TALKING_SENDER_ID || process.env.AFRICASTALKING_SENDER_ID)?.trim();
    const from = isSandboxMode 
      ? undefined // Omit sender ID in sandbox mode
      : (senderIdFromEnv || undefined); // Only use sender ID in production if provided

    if (!username || !apiKey) {
      console.error('❌ Africa\'s Talking credentials not configured');
      return NextResponse.json(
        { error: 'Africa\'s Talking credentials not configured. Please set AFRICAS_TALKING_API_USERNAME and AFRICAS_TALKING_API_KEY in .env.local' },
        { status: 500 }
      );
    }

    // Validate credentials format
    if (username.length === 0 || apiKey.length === 0) {
      console.error('❌ Africa\'s Talking credentials are empty');
      return NextResponse.json(
        { error: 'Africa\'s Talking credentials are empty. Please check your .env.local file' },
        { status: 500 }
      );
    }

    // Validate API key format
    // Sandbox keys typically start with different prefixes than production
    const apiKeyPrefix = apiKey.substring(0, 10);
    
    // Log credential info (without exposing full API key)
    console.log('🔑 Using credentials:', {
      username: username,
      apiKeyPrefix: apiKeyPrefix + '...',
      apiKeyLength: apiKey.length,
      senderId: from || '(omitted - sandbox mode)',
      isSandbox: isSandboxMode,
      apiKeyFormat: apiKey.startsWith('atsk_') ? 'Production format (atsk_...)' : 
                    apiKey.length > 20 ? 'Valid length' : 'Suspicious length',
    });
    
    // Warn if sandbox username but production-looking API key
    if (isSandboxMode && apiKey.startsWith('atsk_')) {
      console.warn('⚠️ WARNING: Using "sandbox" username with production-format API key. This will fail!');
      console.warn('   Sandbox API keys have a different format. Get your sandbox key from the dashboard.');
    }
    
    // Warn if production username but short API key (might be sandbox key)
    if (!isSandboxMode && !apiKey.startsWith('atsk_') && apiKey.length < 50) {
      console.warn('⚠️ WARNING: Production username with short API key. Make sure this is a production key.');
    }

    // Format all phone numbers to international format with + prefix for SDK
    const formattedPhones = phoneNumbers.map(phone => {
      const formatted = formatPhoneNumber(phone);
      return '+' + formatted; // SDK expects international format with +
    });
    
    // Validate phone number formats (Kenya: +254XXXXXXXXX = 13 characters total)
    formattedPhones.forEach((formattedPhone, index) => {
      if (formattedPhone.startsWith('+254') && formattedPhone.length !== 13) {
        console.warn('⚠️ Phone number format warning:', {
          original: phoneNumbers[index],
          formatted: formattedPhone,
          length: formattedPhone.length,
          expected: '13 characters for Kenya (+254XXXXXXXXX)'
        });
      }
    });

    const isBulkSMS = formattedPhones.length > 1;
    console.log(`📤 Sending ${isBulkSMS ? 'BULK' : ''} SMS via Africa's Talking SDK:`, {
      recipients: formattedPhones.length,
      to: isBulkSMS ? `${formattedPhones.length} recipients` : formattedPhones[0],
      from: from,
      messageLength: message.length,
      username: username,
    });

    // Initialize the SDK with credentials
    const credentials = {
      apiKey: apiKey,
      username: username,
    };

    const africastalking = AfricasTalking(credentials);

    // Get the SMS service
    const sms = africastalking.SMS;

    // Prepare options for sending SMS
    const options: any = {
      // Set the numbers you want to send to in international format
      to: formattedPhones,
      // Set your message
      message: message.trim(),
    };
    
    // Only include 'from' field if we have a sender ID (not in sandbox mode typically)
    if (from) {
      options.from = from;
    }

    // Send SMS using the SDK
    let data: any;
    try {
      data = await sms.send(options);
      console.log('📥 Africa\'s Talking SDK Response:', JSON.stringify(data, null, 2));
    } catch (sdkError: any) {
      console.error('❌ Africa\'s Talking SDK error:', sdkError);
      
      // Handle SDK errors
      const errorMessage = sdkError.message || sdkError.toString() || 'Failed to send SMS';
      const errorString = JSON.stringify(sdkError).toLowerCase();
      
      // Check if it's an InvalidSenderId error
      if (errorMessage.includes('InvalidSenderId') || errorString.includes('invalidsenderid')) {
        const helpfulMessage = `Invalid Sender ID error. Solutions:
1. In Sandbox mode: The sender ID field should be omitted (left empty)
   - Sandbox typically doesn't allow custom sender IDs
   - Remove AFRICAS_TALKING_SENDER_ID from .env.local when using sandbox

2. In Production mode: Ensure your sender ID is:
   - Registered and approved in your Africa's Talking dashboard
   - Maximum 11 characters (alphanumeric, no spaces)
   - Matches exactly what's registered in your account

3. Check your dashboard:
   - Go to https://account.africastalking.com
   - Navigate to Settings → Sender IDs
   - Verify your sender ID is approved and active

Current configuration:
- Username: "${username}"
- Is Sandbox: ${isSandboxMode}
- Sender ID: ${from || '(not set)'}`;
        
        return NextResponse.json(
          { 
            error: 'Invalid Sender ID',
            message: helpfulMessage,
            details: {
              isSandbox: isSandboxMode,
              senderId: from || '(not set)',
              sdkError: errorMessage,
            }
          },
          { status: 400 }
        );
      }
      
      // Check if it's an authentication error
      if (errorMessage.includes('Authentication') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        const helpfulMessage = `Authentication failed. Common causes:
1. Username and API key don't match (sandbox key requires username "sandbox")
2. API key is incorrect or has extra spaces
3. API key has expired (regenerate in dashboard)
4. Wrong environment (mixing sandbox and production credentials)

Current username: "${username}"
Check your .env.local file and verify:
- Username matches your dashboard exactly
- API key is correct and matches the username type
- No extra spaces or quotes around values
- Restart your dev server after changing .env.local`;
        
        return NextResponse.json(
          { 
            error: 'Authentication failed - Invalid credentials',
            message: helpfulMessage,
            details: {
              username: username,
              apiKeyLength: apiKey.length,
              isSandbox: isSandboxMode,
              sdkError: errorMessage,
            }
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: sdkError 
        },
        { status: 500 }
      );
    }

    // Check for InvalidSenderId error in the response
    if (data?.SMSMessageData?.Message === 'InvalidSenderId' || data?.errorMessage?.includes('InvalidSenderId')) {
      const helpfulMessage = `Invalid Sender ID error. Solutions:
1. In Sandbox mode: The sender ID field should be omitted (left empty)
   - Sandbox typically doesn't allow custom sender IDs
   - Remove AFRICAS_TALKING_SENDER_ID from .env.local when using sandbox

2. In Production mode: Ensure your sender ID is:
   - Registered and approved in your Africa's Talking dashboard
   - Maximum 11 characters (alphanumeric, no spaces)
   - Matches exactly what's registered in your account

3. Check your dashboard:
   - Go to https://account.africastalking.com
   - Navigate to Settings → Sender IDs
   - Verify your sender ID is approved and active

Current configuration:
- Username: "${username}"
- Is Sandbox: ${isSandboxMode}
- Sender ID: ${from || '(not set)'}`;
      
      return NextResponse.json(
        { 
          error: 'Invalid Sender ID',
          message: helpfulMessage,
          details: {
            isSandbox: isSandboxMode,
            senderId: from || '(not set)',
            rawResponse: data,
          }
        },
        { status: 400 }
      );
    }

    // Check if the request was successful
    if (data && data.SMSMessageData?.Recipients?.length > 0) {
      const recipients = data.SMSMessageData.Recipients;
      const isBulkSMS = recipients.length > 1;
      
      // Check all recipients' status
      const successfulRecipients = recipients.filter((r: any) => 
        r.statusCode === 101 || r.status === 'Success'
      );
      const failedRecipients = recipients.filter((r: any) => 
        r.statusCode !== 101 && r.status !== 'Success'
      );
      
      if (successfulRecipients.length > 0) {
        const totalCost = recipients.reduce((sum: number, r: any) => sum + parseFloat(r.cost || '0'), 0);
        
        console.log(`✅ ${isBulkSMS ? 'BULK ' : ''}SMS sent successfully:`, {
          total: recipients.length,
          successful: successfulRecipients.length,
          failed: failedRecipients.length,
        });
        
        return NextResponse.json({
          success: true,
          message: isBulkSMS 
            ? `SMS sent to ${successfulRecipients.length} of ${recipients.length} recipients`
            : 'SMS sent successfully',
          data: {
            isBulk: isBulkSMS,
            totalRecipients: recipients.length,
            successful: successfulRecipients.length,
            failed: failedRecipients.length,
            recipients: recipients.map((r: any) => ({
              phoneNumber: r.number,
              status: r.status,
              statusCode: r.statusCode,
              messageId: r.messageId,
              cost: r.cost,
            })),
            totalCost: totalCost.toFixed(4),
          },
        });
      } else {
        console.error('❌ SMS sending failed for all recipients:', recipients);
        return NextResponse.json(
          { 
            error: `Failed to send SMS to all recipients`,
            details: recipients 
          },
          { status: 400 }
        );
      }
    } else {
      // Handle API errors
      const errorMessage = data?.errorMessage || data?.error || 'Failed to send SMS';
      console.error('❌ Africa\'s Talking SDK error:', errorMessage, data);
      
      // Provide helpful error messages for authentication issues
      if (data?.errorMessage && (data.errorMessage.includes('Invalid') || data.errorMessage.includes('Authentication'))) {
        const helpfulMessage = `Authentication failed. Common causes:
1. Username and API key don't match (sandbox key requires username "sandbox")
2. API key is incorrect or has extra spaces
3. API key has expired (regenerate in dashboard)
4. Wrong environment (mixing sandbox and production credentials)

Current username: "${username}"
Check your .env.local file and verify:
- Username matches your dashboard exactly
- API key is correct and matches the username type
- No extra spaces or quotes around values
- Restart your dev server after changing .env.local`;
        
        return NextResponse.json(
          { 
            error: 'Authentication failed - Invalid credentials',
            message: helpfulMessage,
            details: {
              username: username,
              apiKeyLength: apiKey.length,
              isSandbox: username.toLowerCase() === 'sandbox',
              rawError: data,
            }
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: data 
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('❌ Error sending SMS:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}