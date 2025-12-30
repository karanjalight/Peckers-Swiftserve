# Africa's Talking Credentials Guide

## Required Credentials

You need **3 environment variables** in your `.env.local` file:

```env
AFRICAS_TALKING_API_USERNAME=your_username
AFRICAS_TALKING_API_KEY=your_api_key
AFRICAS_TALKING_SENDER_ID=your_sender_id
```

---

## How to Get Your Credentials

### Step 1: Log in to Africa's Talking Dashboard
1. Go to: https://account.africastalking.com
2. Log in with your account credentials

### Step 2: Get Your API Username

**For Sandbox/Testing:**
- Username is always: `sandbox`
- No registration needed for sandbox

**For Production:**
- Go to **Settings** → **API** or **Developer** section
- Your API username is displayed there (usually your organization name or a custom username)

### Step 3: Get Your API Key

1. In the dashboard, go to **Settings** → **API**
2. Look for **API Key** section
3. If you don't have one, click **"Generate API Key"** or **"Create API Key"**
4. **Copy the API key immediately** - you won't be able to see it again!
5. Save it securely

**Important:**
- Sandbox API keys work only with username `sandbox`
- Production API keys work only with your production username
- **Never mix sandbox and production credentials!**

### Step 4: Get Your Sender ID

**For Sandbox/Testing:**
- Use: `AFRICASTKNG` (automatically used by the system)
- Or leave it empty
- No registration needed

**For Production:**
1. Go to **SMS** → **Sender IDs** in the dashboard
2. Click **"Request Sender ID"** or **"Register Sender ID"**
3. Enter your desired Sender ID:
   - Maximum 11 characters
   - Letters and numbers only (no spaces, no special characters)
   - Example: `PECKERS`, `PECKERSLTD`
4. Submit and wait for approval (1-3 business days)
5. Once approved, use it in your `.env.local`

---

## Current Configuration Check

Based on your current `.env.local`:
```env
AFRICAS_TALKING_API_USERNAME=Peckers
AFRICAS_TALKING_API_KEY=atsk_31131f8e8194914b6c9eef9d01c2471f06d6c1b6ee294be69a1527bd0956ae5977ba5d7c
AFRICAS_TALKING_SENDER_ID=Peckers
```

### Issue Identified:
❌ **Username mismatch**: Your username is `Peckers` but your API key format (`atsk_...`) suggests it might be a production key that requires a different username.

### Solutions:

**Option 1: Use Sandbox (Recommended for Testing)**
```env
AFRICAS_TALKING_API_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=your_sandbox_api_key_from_dashboard
AFRICAS_TALKING_SENDER_ID=AFRICASTKNG
```

**Option 2: Use Production (For Live App)**
1. Verify your production username in the dashboard
2. Make sure your API key matches your username
3. Ensure your Sender ID is approved
```env
AFRICAS_TALKING_API_USERNAME=your_actual_production_username
AFRICAS_TALKING_API_KEY=your_production_api_key
AFRICAS_TALKING_SENDER_ID=Peckers
```

---

## Testing Your Credentials

1. **For Sandbox:**
   - Username must be exactly: `sandbox`
   - Get sandbox API key from dashboard
   - Add test phone numbers in **Settings** → **Sandbox** → **Phone Numbers**
   - Only test numbers will receive SMS

2. **For Production:**
   - Username must match your dashboard username exactly
   - API key must be generated for that username
   - Sender ID must be approved
   - Any valid phone number will receive SMS

---

## Common Issues & Fixes

### 401 Authentication Error
- ✅ Check username matches API key type (sandbox key → sandbox username)
- ✅ Verify API key is correct (no extra spaces, copy-paste correctly)
- ✅ Ensure API key hasn't expired (regenerate if needed)
- ✅ Make sure you're using the right environment (sandbox vs production)

### Sender ID Not Working
- ✅ For sandbox: Use `AFRICASTKNG` or leave empty
- ✅ For production: Ensure Sender ID is approved in dashboard
- ✅ Check Sender ID format (max 11 chars, alphanumeric only)

### SMS Not Sending
- ✅ Check account balance (SMS costs money)
- ✅ Verify phone number format (should be valid)
- ✅ Check if you're in sandbox mode (only registered test numbers work)

---

## Quick Setup Checklist

- [ ] Logged into Africa's Talking dashboard
- [ ] Got API username (sandbox or production)
- [ ] Generated/copied API key
- [ ] Registered Sender ID (for production only)
- [ ] Added credentials to `.env.local`
- [ ] Restarted Next.js dev server
- [ ] Tested with `/sms-test` page

---

## Support

- Africa's Talking Docs: https://developers.africastalking.com
- Support Email: support@africastalking.com
- Status Page: https://status.africastalking.com
