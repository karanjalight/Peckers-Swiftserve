# ✅ Credentials Summary for Africa's Talking SMS

## What You Need (3 Required Variables)

```env
AFRICAS_TALKING_API_USERNAME=your_username
AFRICAS_TALKING_API_KEY=your_api_key  
AFRICAS_TALKING_SENDER_ID=your_sender_id
```

---

## 🔍 Current Issue: 401 Authentication Error

Your current credentials show:
- **Username**: `Peckers` 
- **API Key**: `atsk_...` (production format)
- **Sender ID**: `Peckers`

**Problem**: The username `Peckers` likely doesn't match your API key. You need to verify the correct username in your dashboard.

---

## 🚀 Quick Fix Options

### Option 1: Use Sandbox (Easiest for Testing)

1. Go to: https://account.africastalking.com
2. Log in → **Settings** → **API**
3. Find your **Sandbox API Key**
4. Update `.env.local`:

```env
AFRICAS_TALKING_API_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=your_sandbox_api_key_here
AFRICAS_TALKING_SENDER_ID=AFRICASTKNG
```

5. Add test phone numbers: **Settings** → **Sandbox** → **Phone Numbers**
6. Restart your dev server: `npm run dev`

### Option 2: Use Production (For Live App)

1. Go to: https://account.africastalking.com
2. Log in → **Settings** → **API**
3. Check your **Production Username** (displayed in dashboard)
4. Verify your **Production API Key** matches
5. Update `.env.local`:

```env
AFRICAS_TALKING_API_USERNAME=your_actual_production_username_from_dashboard
AFRICAS_TALKING_API_KEY=your_production_api_key
AFRICAS_TALKING_SENDER_ID=Peckers
```

6. Ensure Sender ID `Peckers` is approved in dashboard
7. Restart your dev server: `npm run dev`

---

## 📋 Where to Find Each Credential

### 1. API Username
- **Location**: Dashboard → **Settings** → **API**
- **Sandbox**: Always use `sandbox`
- **Production**: Your username is displayed in the dashboard

### 2. API Key
- **Location**: Dashboard → **Settings** → **API** → **API Key**
- Click **"Generate"** or **"Create"** if you don't have one
- **Copy immediately** - you can't see it again!

### 3. Sender ID
- **Sandbox**: Use `AFRICASTKNG` (no registration needed)
- **Production**: Dashboard → **SMS** → **Sender IDs** → **Request Sender ID**
- Wait for approval (1-3 days)

---

## ✅ Testing Checklist

After updating credentials:

1. ✅ Credentials added to `.env.local`
2. ✅ No extra spaces in credentials
3. ✅ Restarted dev server (`npm run dev`)
4. ✅ Go to `/sms-test` page
5. ✅ Enter a test phone number
6. ✅ Send test SMS
7. ✅ Check for success message

---

## 🔧 If Still Getting 401 Error

1. **Double-check username**: Must match exactly (case-sensitive)
2. **Verify API key**: Copy-paste again, check for hidden characters
3. **Check key type**: Sandbox key → sandbox username, Production key → production username
4. **Regenerate API key**: Sometimes keys expire or get corrupted
5. **Check dashboard**: Ensure account is active and has balance

---

## 📞 Need Help?

- Full guide: See `AFRICAS_TALKING_CREDENTIALS.md`
- Dashboard: https://account.africastalking.com
- Support: support@africastalking.com
- Docs: https://developers.africastalking.com














