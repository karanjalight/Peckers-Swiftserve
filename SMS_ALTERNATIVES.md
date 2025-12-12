# SMS Service Alternatives to Africa's Talking

## Recommended: Termii (Best for Africa)

### Why Termii?
- ✅ **Cheaper**: ~KES 0.50-1.00 per SMS (vs Africa's Talking ~KES 1-2)
- ✅ **Easy Integration**: Simple REST API, JSON-based
- ✅ **Africa-Focused**: Built for African markets
- ✅ **Good Documentation**: Clear API docs
- ✅ **No Complex Auth**: Just API key in request body

### Setup Steps:

1. **Sign Up**: https://termii.com
2. **Get API Key**: 
   - Go to https://dashboard.termii.com
   - Settings → API Key
   - Copy your API key
3. **Register Sender ID**:
   - Go to Sender ID section
   - Register "PECKERS" or "Peckers" (max 11 chars)
   - Wait for approval (usually instant for testing)

### Environment Variables:
```env
TERMII_API_KEY=your_termii_api_key_here
TERMII_SENDER_ID=PECKERS
```

### Pricing:
- Kenya: ~KES 0.50-1.00 per SMS
- Nigeria: ~NGN 2-3 per SMS
- Ghana: ~GHS 0.05-0.10 per SMS

---

## Alternative 2: Twilio

### Pros:
- ✅ Very reliable
- ✅ Excellent documentation
- ✅ Works globally
- ✅ Good for production

### Cons:
- ❌ More expensive (~KES 2-3 per SMS)
- ❌ Requires credit card

### Setup:
1. Sign up: https://twilio.com
2. Get Account SID and Auth Token
3. Buy a phone number or use trial

### Environment Variables:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+254XXXXXXXXX
```

---

## Alternative 3: SMS Gateway Hub

### Pros:
- ✅ Simple API
- ✅ Affordable
- ✅ Good for bulk SMS

### Cons:
- ❌ Less documentation
- ❌ May require account verification

### Setup:
1. Sign up: https://smsgatewayhub.com
2. Get API key
3. Register sender ID

---

## Alternative 4: Infobip

### Pros:
- ✅ Enterprise-grade
- ✅ Global reach
- ✅ Good reliability

### Cons:
- ❌ More complex setup
- ❌ Pricing not transparent (contact sales)

---

## Quick Comparison

| Service | Price/SMS (KES) | Ease of Setup | Documentation | Best For |
|---------|-----------------|---------------|---------------|----------|
| **Termii** | 0.50-1.00 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **Recommended** |
| Twilio | 2-3 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Production apps |
| SMS Gateway Hub | 0.50-1.50 | ⭐⭐⭐ | ⭐⭐⭐ | Budget projects |
| Infobip | Varies | ⭐⭐⭐ | ⭐⭐⭐⭐ | Enterprise |
| Africa's Talking | 1-2 | ⭐⭐ | ⭐⭐⭐ | Local preference |

---

## Migration Guide: Switching to Termii

### Step 1: Update `.env.local`
```env
# Remove or comment out Africa's Talking
# AFRICAS_TALKING_API_USERNAME=sandbox
# AFRICAS_TALKING_API_KEY=...

# Add Termii
TERMII_API_KEY=your_termii_api_key
TERMII_SENDER_ID=PECKERS
```

### Step 2: Update the API route
The code already includes a Termii route at `/api/send-sms-termii`. You can:
- Option A: Replace the existing route
- Option B: Update the existing route to use Termii
- Option C: Use both (switch via env variable)

### Step 3: Update frontend calls
Change the API endpoint from `/api/send-sms` to `/api/send-sms-termii` (or update the route to use Termii by default)

---

## Recommendation

**Use Termii** because:
1. Cheapest option for Kenya
2. Easiest to integrate (no complex auth)
3. Built for African markets
4. Good documentation
5. Simple API structure

The Termii integration is already created in `/app/api/send-sms-termii/route.ts`. Just:
1. Sign up at termii.com
2. Get your API key
3. Add to `.env.local`
4. Update the frontend to use the new endpoint



