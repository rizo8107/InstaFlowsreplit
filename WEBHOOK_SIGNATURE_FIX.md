# Webhook Signature Validation Fix

## Issue Summary
Webhooks from Instagram were being rejected with signature validation errors:

```
❌ Signature validation failed
Received: ea37e1eeaf560cbd4f45...
Expected: d08dd2729571590a2aaa...
🚨 SECURITY: Invalid webhook signature - possible forged request!
POST /api/webhooks/instagram 403
```

This meant Instagram was sending webhooks but our server was rejecting them due to signature mismatch.

## Root Cause

The problem was in the **Express middleware configuration** in `server/index.ts`:

### ❌ Before (Broken):
```typescript
// Webhook-specific middleware
app.use('/api/webhooks', express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

// PROBLEM: This overwrites the webhook middleware!
app.use(express.json());
```

**Why it failed:**
1. First middleware captures raw body for `/api/webhooks` routes
2. Second `express.json()` **overwrites** the body parsing for ALL routes including `/api/webhooks`
3. The `req.rawBody` is never properly captured
4. Signature validation uses wrong payload → signature mismatch → 403 error

## The Fix

### ✅ After (Fixed):
```typescript
// Single JSON middleware with conditional raw body capture
app.use(express.json({
  verify: (req: any, res, buf) => {
    // Only capture raw body for webhook routes
    if (req.path.startsWith('/api/webhooks')) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));
```

**Why it works:**
1. **Single** `express.json()` middleware for all routes
2. Raw body captured **conditionally** only for webhook routes
3. No middleware conflicts
4. `req.rawBody` correctly contains the raw payload string
5. Signature validation uses correct payload → signatures match → webhooks accepted

## Additional Improvements

### Enhanced Debug Logging

Added comprehensive logging to help diagnose signature issues:

**In webhook POST handler:**
```typescript
console.log("\n📥 Webhook POST received:");
console.log(`   Raw body exists: ${!!req.rawBody}`);
console.log(`   Raw body type: ${typeof req.rawBody}`);
console.log(`   Raw body length: ${req.rawBody.length} bytes`);
```

**In signature validation function:**
```typescript
console.log("🔍 Signature Validation Debug:");
console.log(`   Payload length: ${payload.length} bytes`);
console.log(`   Payload preview: ${payload.substring(0, 100)}...`);

// ... validation logic ...

if (isValid) {
  console.log("✅ Signature validation successful");
}
```

## Files Modified

1. **server/index.ts** - Fixed Express middleware configuration
2. **server/routes.ts** - Added debug logging to webhook handler and validation function

## Testing the Fix

When Instagram sends a webhook, you should now see:

```
📥 Webhook POST received:
   Raw body exists: true
   Raw body type: string
   Raw body length: 147 bytes

🔍 Signature Validation Debug:
   Payload length: 147 bytes
   Payload preview: {"object":"instagram","entry":[{"id":"12345",...

✅ Signature validation successful
✅ Webhook signature validated
[IG WEBHOOK] received: {...}
```

Instead of the previous errors.

## Why This Matters

Instagram webhooks are **critical** for real-time automation:
- DM notifications trigger instant responses
- Comment monitoring enables automated moderation
- Mention tracking allows engagement automation

Without proper signature validation, webhooks fail and automation breaks.

## Security Note

The signature validation is a **security feature** that ensures webhooks are genuinely from Instagram and not forged by attackers. The fix maintains this security while ensuring legitimate webhooks are accepted.

## Current Status

✅ **Fix Applied** - Middleware properly configured  
✅ **Debug Logging Added** - Can diagnose future issues  
✅ **App Running** - Ready to receive webhooks  
⏳ **Awaiting Test** - Waiting for Instagram to send next webhook to confirm fix  

## Next Steps

1. **Wait for Instagram webhook** - Instagram will retry failed webhooks
2. **Check logs** - Verify signature validation succeeds
3. **Test flow execution** - Ensure automation triggers correctly
4. **Remove debug logs** (optional) - Once confirmed working, can reduce verbosity

---

**Summary:** The webhook signature validation is now fixed by using a single `express.json()` middleware with conditional raw body capture. Instagram webhooks should now be accepted and processed correctly.
