# Webhook Security Fix - X-Hub-Signature-256 Validation

## Critical Security Issue Fixed

**Issue:** The Instagram webhook POST endpoint was not validating the `X-Hub-Signature-256` header, allowing anyone to send forged webhook events to the server.

**Fix:** Added HMAC SHA256 signature validation to verify all incoming webhook payloads are genuinely from Instagram/Meta.

## What Was Changed

### 1. Added Signature Validation Function

```typescript
// server/routes.ts
function validateWebhookSignature(
  payload: string,
  signature: string | undefined,
  appSecret: string
): boolean {
  // Fail fast if app secret is not configured
  if (!appSecret) {
    console.error("🚨 CRITICAL: INSTAGRAM_APP_SECRET is not set!");
    return false;
  }

  if (!signature) {
    console.log("❌ No X-Hub-Signature-256 header found");
    return false;
  }

  // Remove 'sha256=' prefix
  const signatureHash = signature.startsWith("sha256=") 
    ? signature.substring(7) 
    : signature;

  // Generate expected signature using app secret
  const expectedHash = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");

  // Check lengths match before comparison to prevent timingSafeEqual crash (DoS vector)
  if (signatureHash.length !== expectedHash.length) {
    console.log("❌ Signature validation failed - length mismatch");
    return false;
  }

  try {
    // Secure comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch (error) {
    console.error("❌ Signature validation error:", error.message);
    return false;
  }
}
```

**Security Improvements:**
1. ✅ **DoS Prevention**: Length check before `timingSafeEqual()` prevents crashes on malformed signatures
2. ✅ **Config Validation**: Explicit check for missing `INSTAGRAM_APP_SECRET`
3. ✅ **Error Handling**: Try-catch wrapper for edge cases (invalid hex, etc.)

### 2. Raw Body Capture Middleware

```typescript
// server/index.ts
app.use('/api/webhooks', express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
```

**Why:** Instagram signs the **raw body** before JSON parsing. We must capture it before express.json() parses it.

### 3. Webhook Endpoint Security

```typescript
// server/routes.ts
app.post("/api/webhooks/instagram", async (req: any, res) => {
  // Validate webhook signature (CRITICAL SECURITY)
  const appSecret = process.env.INSTAGRAM_APP_SECRET || "";
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  
  if (!validateWebhookSignature(req.rawBody || JSON.stringify(req.body), signature, appSecret)) {
    console.error("🚨 SECURITY: Invalid webhook signature - possible forged request!");
    return res.sendStatus(403);
  }

  console.log("✅ Webhook signature validated");
  // ... process webhook
});
```

## How It Works

### Instagram's Signature Process

1. **Instagram creates payload** (JSON object)
2. **Instagram signs payload** using HMAC SHA256 with your App Secret
3. **Instagram sends request** with:
   - Header: `X-Hub-Signature-256: sha256={signature}`
   - Body: Raw JSON payload

### Your Server's Validation Process

1. **Capture raw body** (before JSON parsing)
2. **Extract signature** from `X-Hub-Signature-256` header
3. **Compute expected signature** using raw body + App Secret
4. **Compare signatures** using timing-safe comparison
5. **Accept/Reject** webhook based on match

## Security Benefits

### ✅ Prevents Forged Webhooks
Without validation, attackers could:
- Send fake comment/DM events
- Trigger unauthorized flow executions
- Spam your automation system
- Consume server resources

### ✅ DoS Attack Prevention
- **Length check** before `timingSafeEqual()` prevents crashes on malformed signatures
- Invalid signatures return 403 instead of 500 (no stack traces leaked)
- **Fail fast** on missing app secret configuration

### ✅ Timing Attack Protection
Uses `crypto.timingSafeEqual()` with length validation to prevent timing-based attacks that could reveal signature information.

### ✅ Configuration Safety
Explicitly checks for `INSTAGRAM_APP_SECRET` and logs clear errors if missing, preventing silent failures.

### ✅ Complies with Meta Standards
Follows Instagram/Meta's official webhook security requirements.

## Testing Signature Validation

### Valid Request Test

```bash
# Generate signature
PAYLOAD='{"object":"instagram","entry":[{"id":"123","messaging":[]}]}'
SECRET="your_app_secret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

# Send request
curl -X POST https://your-app.com/api/webhooks/instagram \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -d "$PAYLOAD"

# Expected: 200 OK (signature valid)
```

### Invalid Request Test

```bash
# Send without signature
curl -X POST https://your-app.com/api/webhooks/instagram \
  -H "Content-Type: application/json" \
  -d '{"object":"instagram","entry":[]}'

# Expected: 403 Forbidden (no signature)
```

```bash
# Send with wrong signature
curl -X POST https://your-app.com/api/webhooks/instagram \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=invalid_signature_here" \
  -d '{"object":"instagram","entry":[]}'

# Expected: 403 Forbidden (invalid signature)
```

## Monitoring Logs

### Successful Validation
```
✅ Webhook signature validated
Webhook received: {...}
```

### Failed Validation (No Signature)
```
❌ No X-Hub-Signature-256 header found
🚨 SECURITY: Invalid webhook signature - possible forged request!
```

### Failed Validation (Wrong Signature)
```
❌ Signature validation failed
   Received: abc123def456...
   Expected: 789xyz012abc...
🚨 SECURITY: Invalid webhook signature - possible forged request!
```

## Environment Requirements

**Required:**
- `INSTAGRAM_APP_SECRET` environment variable must be set
- Must match the App Secret in Meta App Dashboard

**Check:**
```bash
# Verify app secret is configured
echo $INSTAGRAM_APP_SECRET

# In Docker/Easypanel, check environment variables
docker-compose exec app env | grep INSTAGRAM_APP_SECRET
```

## Migration Guide

If you're updating from an older version without signature validation:

1. **Update Code** (already done in this fix)
   - ✅ Added `validateWebhookSignature()` function
   - ✅ Added raw body capture middleware
   - ✅ Updated webhook POST handler

2. **Verify Environment**
   ```bash
   # Check app secret is set
   echo $INSTAGRAM_APP_SECRET
   ```

3. **Test Locally**
   ```bash
   # Start server
   npm run dev

   # Send test webhook (see Testing section above)
   ```

4. **Deploy**
   ```bash
   # Docker
   docker-compose build
   docker-compose up -d

   # Easypanel
   # Redeploy via dashboard
   ```

5. **Verify in Production**
   - Check logs for signature validation messages
   - Test Meta App Dashboard webhook test button
   - Monitor for any 403 errors (indicates validation working)

## Common Issues

### Issue: All webhooks return 403

**Cause:** App Secret mismatch

**Fix:**
```bash
# 1. Check App Secret in Meta Dashboard
# App Dashboard → Settings → Basic → App Secret

# 2. Update environment variable
export INSTAGRAM_APP_SECRET="your_actual_app_secret"

# 3. Restart server
docker-compose restart app
```

### Issue: Signature always fails

**Cause:** Raw body not captured correctly

**Check:**
```typescript
// Verify req.rawBody exists
console.log('Raw body:', req.rawBody);
console.log('Parsed body:', req.body);
```

**Fix:** Ensure middleware order in `server/index.ts` is correct:
```typescript
// 1. Raw body capture (webhook routes only)
app.use('/api/webhooks', express.json({ verify: ... }));

// 2. Regular JSON parsing (all other routes)
app.use(express.json());
```

### Issue: Works locally but fails in production

**Cause:** Environment variable not set in production

**Fix:**
```bash
# Easypanel: Add environment variable in app settings
# Docker: Update docker-compose.yml or .env file

# Verify in container
docker-compose exec app env | grep INSTAGRAM_APP_SECRET
```

## Documentation References

- [Instagram Webhooks Documentation](https://developers.facebook.com/docs/instagram-platform/webhooks)
- [Meta Webhook Security](https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests)
- [HMAC SHA256 Validation](https://en.wikipedia.org/wiki/HMAC)

## Summary

**Before:** ❌ No signature validation - vulnerable to forged webhooks
**After:** ✅ Full HMAC SHA256 validation - secure webhook processing

**Action Required:** None if deploying fresh. Existing deployments just need `INSTAGRAM_APP_SECRET` environment variable set.

---

**Security Level:** ✅ Production-Ready
**Compliance:** ✅ Meta/Instagram Standards
**Protection:** ✅ Timing Attack Safe
