# Instagram Automated DM WebApp — Final Action & Reel Condition Guide

## 0) Context
- API Base: **https://graph.instagram.com/v24.0**
- Integration: **Instagram Login**, not Facebook Graph.
- Status: Webhook & event triggers working fine.
- Problem: Final DM action & condition (Reel-only logic) need refinement.

---

## 1) Token & Permission Requirements
- Account: Instagram **Business** or **Creator**.
- Scopes required:
  - `instagram_business_manage_messages`
  - `instagram_business_manage_comments`
- Token: Long-lived access token.

**Verify token:**
```bash
curl -G "https://graph.instagram.com/v24.0/me" \
  -d "fields=id,username" \
  -d "access_token=<IG_USER_TOKEN>"
```

---

## 2) Detecting Reels

Reels are identified by:
- `media_product_type = "REELS"`
- `media_type = "VIDEO"`

**Fetch media:**
```bash
curl -G "https://graph.instagram.com/v24.0/me/media" \
  -d "fields=id,caption,media_type,media_product_type,permalink,timestamp" \
  -d "limit=50" \
  -d "access_token=<IG_USER_TOKEN>"
```

In code:
```js
const isReel = (m) =>
  m.media_product_type === 'REELS' ||
  (m.media_type === 'VIDEO' && m.media_product_type === 'REELS');
```

---

## 3) Webhook → Condition → Action Flow

### Step A: Receive webhook event
Webhook provides event data (`media_id`, `conversation_id`, `sender_id`, etc.)

### Step B: Validate the media type
```bash
curl -G "https://graph.instagram.com/v24.0/<MEDIA_ID>" \
  -d "fields=id,media_type,media_product_type,caption,permalink" \
  -d "access_token=<IG_USER_TOKEN>"
```
**Condition:**
Proceed only if `media_product_type == 'REELS'`.

### Step C: Send DM (Final Action)
```bash
curl -X POST "https://graph.instagram.com/v24.0/<CONVERSATION_ID>/messages" \
  -H "Content-Type: application/json" \
  -d '{
        "message": { "text": "Thanks for engaging on our Reel ✨" }
      }' \
  -d "access_token=<IG_USER_TOKEN>"
```

To send a link:
```bash
"message": { "text": "Track it here 👉 https://example.com/track/123" }
```

---

## 4) Full Node.js Example

```js
app.post('/webhook/instagram', async (req, res) => {
  const event = req.body;
  const IG_TOKEN = process.env.IG_TOKEN;

  const mediaId = event?.media_id;
  const convId  = event?.conversation_id;

  let isReel = false;
  if (mediaId) {
    const media = await fetch(
      `https://graph.instagram.com/v24.0/${mediaId}?fields=id,media_type,media_product_type&access_token=${IG_TOKEN}`
    ).then(r => r.json());
    isReel = media.media_product_type === 'REELS';
  }

  if (!isReel) return res.status(200).send('Skipped: Not a Reel');

  const dm = await fetch(
    `https://graph.instagram.com/v24.0/${convId}/messages?access_token=${IG_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: { text: 'Hey! Thanks for engaging on our Reel 💛' }
      })
    }
  ).then(r => r.json());

  if (dm.error) console.error('DM error:', dm.error);
  res.status(200).send('OK');
});
```

---

## 5) Testing Checklist

**A) List Conversations:**
```bash
curl -G "https://graph.instagram.com/v24.0/me/conversations" \
  -d "platform=instagram" \
  -d "access_token=<IG_USER_TOKEN>"
```

**B) List Reels:**
```bash
curl -s -G "https://graph.instagram.com/v24.0/me/media" \
  -d "fields=id,media_type,media_product_type,caption,permalink,timestamp" \
  -d "limit=100" \
  -d "access_token=<IG_USER_TOKEN>" \
| jq '.data | map(select(.media_product_type=="REELS"))'
```

**C) Send DM manually:**
```bash
curl -X POST "https://graph.instagram.com/v24.0/<CONVERSATION_ID>/messages" \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"Hello from automation 👋"}}' \
  -d "access_token=<IG_USER_TOKEN>"
```

---

## 6) Common Issues & Fixes
| Problem | Fix |
|----------|------|
| Using facebook.com endpoint | Change to `graph.instagram.com` |
| 403 / Missing permission | Add `instagram_business_manage_messages` scope |
| Short-lived token | Exchange for long-lived token |
| `conversation_id` missing | Fetch `/me/conversations` and match participant IDs |
| Reels not filtered correctly | Use `media_product_type == 'REELS'` check |
| 400 error on DM | Ensure `Content-Type: application/json` |

---

## 7) TL;DR for Replit Team
1. Add conditional check using `media_product_type === 'REELS'`.
2. Trigger DM action only inside that branch.
3. POST to `https://graph.instagram.com/v24.0/<CONVERSATION_ID>/messages`.
4. Log webhook input, media lookup, and DM response.
5. Validate token scopes and use JSON body for all POST requests.

---

**Deliverable Goal:**
✅ Webhook fires → Checks media → If it’s a Reel → Sends automated DM successfully via Instagram Graph API.