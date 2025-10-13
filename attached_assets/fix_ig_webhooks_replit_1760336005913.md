# FIX_IG_WEBHOOKS_REPLIT.md

> Goal: After Instagram Login, webhooks auto-configure and DM/comment events reliably reach `POST /api/webhooks/instagram` on Replit.

## TL;DR (what to fix)

- Use **`graph.facebook.com`** for all webhook subscriptions.
- Subscribe **DM webhooks on the *Facebook Page*** using a **Page Access Token**.
- Subscribe **comments/mentions** on the **IG user** (optional via API, or via Dashboard).
- Ensure **raw body** is available for signature verification (`X-Hub-Signature-256`) and return **200 OK within 20s**.
- Add a **health/status** endpoint and structured logs.
- Verify **device toggle** (“Allow access to messages”) is surfaced to users.

---

## 1) Environment & Secrets (Replit)

Set these in **Replit → Secrets**:

```
INSTAGRAM_APP_ID=***
INSTAGRAM_APP_SECRET=***
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=***   # 32+ random chars
OAUTH_BASE_URL=https://<your-replit-app>.repl.co  # or your custom domain
```

> Callback URL used in Meta Dashboard:
> `https://<your-replit-app>.repl.co/api/webhooks/instagram`

---

## 2) Express server: raw body + signature verification

**Why:** Meta signs payloads. We must compute HMAC on the **raw** JSON (not the parsed object). Also respond fast (ack within 20s) and process async.

```ts
// server.ts
import express from "express";
import crypto from "crypto";
import bodyParser from "body-parser";

const app = express();
// Keep a raw buffer for signature verification
app.use("/api/webhooks/instagram", bodyParser.json({
  verify: (req: any, res, buf) => { req.rawBody = buf; }
}));

const APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;
const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN!;

// GET: Verification challenge
app.get("/api/webhooks/instagram", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// POST: Event notifications
app.post("/api/webhooks/instagram", (req: any, res) => {
  // 1) Verify signature
  const signature = req.header("x-hub-signature-256") || "";
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", APP_SECRET).update(req.rawBody).digest("hex");

  const valid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );

  if (!valid) {
    console.error("Invalid webhook signature");
    return res.sendStatus(401);
  }

  // 2) ACK immediately (must be under ~20s)
  res.sendStatus(200);

  // 3) Process async
  queueMicrotask(() => {
    try {
      const payload = req.body;
      console.log("[IG WEBHOOK] received", JSON.stringify(payload));
      // TODO: persist event, route to flows, etc.
    } catch (e) {
      console.error("Webhook processing error", e);
    }
  });
});

export default app;
```

---

## 3) OAuth callback: auto-subscribe correctly

**Key:**  
- **DM webhooks**: subscribe the **Facebook Page** with a **Page Access Token**.  
- **Comments/Mentions**: subscribe the **IG user** with a **User token** (or do it in App Dashboard once).

```ts
// subscriptions.ts
import fetch from "node-fetch";

const G = "https://graph.facebook.com/v24.0";

async function graphGET(path: string, params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${G}${path}?${q}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function graphPOST(path: string, body: Record<string, string>) {
  const res = await fetch(`${G}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function autoSubscribeAfterOAuth(userAccessToken: string) {
  // 1) Get pages + linked IG user id
  const pagesResp = await graphGET("/me/accounts", {
    fields: "name,access_token,instagram_business_account",
    access_token: userAccessToken,
  });

  // Pick the page that has the IG account linked
  const page = (pagesResp.data || []).find((p: any) => p.instagram_business_account?.id);
  if (!page) throw new Error("No linked Facebook Page with instagram_business_account found");

  const pageId = page.id;
  const pageToken = page.access_token;
  const igUserId = page.instagram_business_account.id;

  // 2) Subscribe PAGE to messaging fields (DM webhooks) — use PAGE TOKEN
  await graphPOST(`/${pageId}/subscribed_apps`, {
    subscribed_fields: "messages,message_reactions,message_echoes,messaging_postbacks",
    access_token: pageToken,
  });

  // 3) Subscribe IG user to content fields (optional; or do in Dashboard)
  try {
    await graphPOST(`/${igUserId}/subscribed_apps`, {
      subscribed_fields: "comments,mentions,live_comments,story_insights",
      access_token: userAccessToken,
    });
  } catch (e) {
    // Soft-fail; Dashboard subscription also works
    console.warn("IG user subscription soft-failed:", e);
  }

  // 4) Persist health flags (pseudo)
  // await db.upsert({ pageId, igUserId, pageSubscribed: true, igSubscribed: true });
  return { ok: true, pageId, igUserId };
}
```

Call `autoSubscribeAfterOAuth(userAccessToken)` from your existing OAuth completion flow (non-blocking).

---

## 4) Health endpoints & logs

Add simple checks to debug quickly:

```ts
app.get("/api/webhook-status", async (req, res) => {
  // TODO: read from your DB/cache if you persist flags
  res.json({
    app: { callback: "/api/webhooks/instagram", verifyToken: !!VERIFY_TOKEN },
    // Optionally, call Graph to show current subs:
    // appSubscriptions: await GET /<APP_ID>/subscriptions (App Token),
    // pageSubscriptions: await GET /<PAGE_ID>/subscribed_apps (Page Token),
  });
});
```

**Replit Logs to capture:**
- App start: show `OAUTH_BASE_URL`, callback URL.
- On GET verify: dump query (sans token), show 200/403.
- On POST: print `object`, `entry[*].changes[*].field` or `messaging` keys.
- On subscription calls: log endpoint, token type used (Page vs User), and raw responses.

---

## 5) Meta Dashboard settings (once per app)

- **Webhooks → Instagram**  
  - Callback URL: `https://<replit-domain>/api/webhooks/instagram`  
  - Verify Token: `<INSTAGRAM_WEBHOOK_VERIFY_TOKEN>`  
  - Subscribe to: `comments`, `mentions`, `story_insights`, `live_comments`  
- **App Mode:** **Live**  
- **Advanced Access:** messaging/comments as needed

*Note:* For **DM webhooks** you must subscribe the **Page** via API (`/{PAGE_ID}/subscribed_apps`) using **Page Access Token**.

---

## 6) Device setting users must flip (cannot be automated)

In the IG app (Business/Creator):
- **Settings → Privacy → Messages → Connected Tools → “Allow access to messages” = ON**

We’ll show a small banner until the first DM webhook arrives.

---

## 7) cURL tests Replit can run

```bash
# A) Verify app-level subscriptions (App Token)
curl -G "https://graph.facebook.com/v24.0/<APP_ID>/subscriptions" \
  --data-urlencode "access_token=<APP_ID>|<APP_SECRET>"

# B) Inspect Page subscriptions (Page Token)
curl -G "https://graph.facebook.com/v24.0/<PAGE_ID>/subscribed_apps" \
  --data-urlencode "access_token=<PAGE_ACCESS_TOKEN>"

# C) Manually subscribe Page (messages)
curl -X POST "https://graph.facebook.com/v24.0/<PAGE_ID>/subscribed_apps" \
  -d "subscribed_fields=messages,message_reactions,message_echoes,messaging_postbacks" \
  -d "access_token=<PAGE_ACCESS_TOKEN>"
```

Expected: `{"success": true}` and `subscribed_fields` present when listing.

---

## 8) Acceptance criteria

- [ ] GET verify succeeds (200 + `hub.challenge`) with correct verify token.  
- [ ] POST webhook requests are **validated** (signature ok), **ACKed fast** (≤ 1s), and **processed async**.  
- [ ] After OAuth, logs show:
  - Page chosen with `instagram_business_account.id`
  - `/{PAGE_ID}/subscribed_apps` success (Page token)
  - `/{IG_USER_ID}/subscribed_apps` success (optional)
- [ ] Sending a DM to the connected IG account creates a **messages** webhook event in logs.
- [ ] Commenting/@mentioning triggers **comments/mentions** webhook event in logs.
- [ ] `/api/webhook-status` returns healthy flags.

---

## 9) Common pitfalls Replit should guard against

- ❌ Using `graph.instagram.com` for webhook subscriptions (must be `graph.facebook.com`).
- ❌ Using a **User/IG token** for `/{PAGE_ID}/subscribed_apps` (must be **Page token**).
- ❌ Parsing JSON without keeping raw body → signature verification fails.
- ❌ Doing heavy work before sending 200 → Meta retries / drops events.
- ❌ Relying on webhooks without surfacing the **“Allow access to messages”** device toggle to users.

---

## 10) Optional hardening

- Add retry + deduplication (use `entry.id:time` as idempotency key).
- Queue processing (BullMQ / in-memory queue) to isolate from HTTP path.
- Structured logs with request ids.
- Alert if no webhooks seen for N hours after subscription.

---

**If you need repro:**  
1) Connect a fresh IG Business account via OAuth.  
2) Confirm auto-subscription logs.  
3) Send DM “hi” to the IG account → expect webhook within seconds.  
4) Comment “test” on a post → expect `comments` event.  

Please implement the exact code paths above and share the 3 logs:
- App start (env summary),
- Subscription responses (Page + IG),
- First webhook POST (sanitized).