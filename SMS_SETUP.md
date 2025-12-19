# Africa's Talking SMS Integration Setup

This guide will help you set up SMS notifications using Africa's Talking API.

## Prerequisites

1. **Africa's Talking Account**
   - Sign up at [https://africastalking.com](https://africastalking.com)
   - Complete account verification
   - Add credit to your account (SMS is charged per message)

2. **Get Your Credentials**
   - Log in to your Africa's Talking dashboard
   - Go to **Settings** → **API** or **Developer** section
   - You'll need:
     - **API Username** (e.g., `sandbox` for testing or your production username)
     - **API Key** (generate a new one if needed)
     - **Sender ID** (shortcode or alphanumeric ID, max 11 characters)

## Environment Variables

Add the following variables to your `.env.local` file (or your production environment):

```env
# Africa's Talking SMS Configuration
AFRICAS_TALKING_API_USERNAME=your_api_username
AFRICAS_TALKING_API_KEY=your_api_key
AFRICAS_TALKING_SENDER_ID=PECKERS

# Your application URL (for payment links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production, use: NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Getting Your Credentials

### 1. API Username
- For **Sandbox/Testing**: Use `sandbox`
- For **Production**: Use your registered username from the dashboard

### 2. API Key
- Go to **Settings** → **API** in your dashboard
- Click **Generate API Key** if you don't have one
- Copy the API key (keep it secret!)

### 3. Sender ID
- **Option A - Shortcode**: Request a shortcode from Africa's Talking (takes time, requires approval)
- **Option B - Alphanumeric**: Use an alphanumeric sender ID (e.g., `PECKERS`, `PECKERSLTD`)
  - Must be registered in your dashboard
  - Maximum 11 characters
  - Only letters and numbers, no spaces or special characters

## Testing

1. **Sandbox Mode** (Free testing):
   - Use `sandbox` as your API username
   - Use the sandbox API key from your dashboard
   - Test with phone numbers registered in your sandbox account
   - Add test numbers in **Settings** → **Sandbox** → **Phone Numbers**

2. **Production Mode**:
   - Use your production API username and key
   - Use your registered sender ID
   - SMS will be sent to any valid phone number
   - Charges apply per SMS sent

## Phone Number Format

The system automatically formats phone numbers:
- `0712345678` → `254712345678`
- `+254712345678` → `254712345678`
- `254712345678` → `254712345678` (unchanged)

## SMS Message Format

When a quote is sent, customers receive:
```
Hello [Customer Name], your [service type] quote is ready! 
Amount: Ksh [amount]. 
Click this link to pay: [payment link]
```

## Cost

- SMS pricing varies by country
- Check Africa's Talking pricing page for current rates
- Kenya: Typically ~KES 1-2 per SMS
- Charges are deducted from your account balance

## Troubleshooting

### SMS Not Sending
1. Check your account balance
2. Verify API credentials are correct
3. Ensure sender ID is registered and approved
4. Check phone number format (must be valid Kenyan number)
5. Review error logs in the browser console

### Common Errors
- **401 Unauthorized**: Invalid API credentials
- **403 Forbidden**: Sender ID not approved or insufficient balance
- **400 Bad Request**: Invalid phone number format

## Support

- Africa's Talking Documentation: [https://developers.africastalking.com](https://developers.africastalking.com)
- Support: support@africastalking.com
- Status Page: [https://status.africastalking.com](https://status.africastalking.com)

## Security Notes

⚠️ **Important**: Never commit your `.env.local` file to version control!

- Keep API keys secret
- Use environment variables for all sensitive data
- Rotate API keys periodically
- Monitor your account for unusual activity



