import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const parts = stored.split(".");
  if (parts.length !== 2) {
    return false;
  }
  const [hashed, salt] = parts;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      const user = await storage.getUserByEmail(email);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  // Instagram Business Login OAuth Routes
  // Step 1: Redirect to Instagram authorization
  app.get("/api/auth/instagram", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to connect Instagram");
    }

    if (!process.env.INSTAGRAM_APP_ID) {
      return res.status(500).send("Instagram App ID not configured");
    }

    // Determine the callback URL based on environment
    // Use custom OAuth base URL if set, otherwise fall back to Replit domains
    const baseUrl = process.env.OAUTH_BASE_URL || 
      (process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : 'http://localhost:5000');
    
    const redirectUri = `${baseUrl}/api/auth/instagram/callback`;
    
    const authUrl = new URL("https://www.instagram.com/oauth/authorize");
    authUrl.searchParams.set("client_id", process.env.INSTAGRAM_APP_ID);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
      "instagram_business_content_publish",
    ].join(","));

    res.redirect(authUrl.toString());
  });

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByEmail(req.body.email);
    if (existingUser) {
      return res.status(400).send("Email already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const { password, ...safeUser } = req.user!;
    res.status(200).json(safeUser);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...safeUser } = req.user!;
    res.json(safeUser);
  });

  // Step 2: Handle Instagram callback and exchange code for tokens
  app.get("/api/auth/instagram/callback", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.redirect("/auth?error=not_logged_in");
      }

      const { code, error, error_reason, error_description } = req.query;

      // Handle authorization cancelation
      if (error) {
        console.error("Instagram OAuth error:", error, error_reason, error_description);
        return res.redirect("/accounts?error=oauth_cancelled");
      }

      if (!code) {
        return res.redirect("/accounts?error=no_code");
      }

      if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_APP_SECRET) {
        return res.redirect("/accounts?error=config_missing");
      }

      // Determine the callback URL (must match exactly)
      // Use custom OAuth base URL if set, otherwise fall back to Replit domains
      const baseUrl = process.env.OAUTH_BASE_URL || 
        (process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
          : process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}`
            : 'http://localhost:5000');
      
      const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

      // Step 2a: Exchange authorization code for short-lived access token
      const tokenParams = new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code as string,
      });

      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        console.error("Token exchange failed:", tokenData);
        return res.redirect("/accounts?error=token_exchange_failed");
      }

      const shortLivedToken = tokenData.access_token;
      const igUserId = tokenData.user_id;

      // Step 2b: Exchange short-lived token for long-lived token (60 days)
      const longLivedResponse = await fetch(
        `https://graph.instagram.com/access_token?` +
        `grant_type=ig_exchange_token&` +
        `client_secret=${process.env.INSTAGRAM_APP_SECRET}&` +
        `access_token=${shortLivedToken}`
      );

      const longLivedData = await longLivedResponse.json();

      if (!longLivedResponse.ok || !longLivedData.access_token) {
        console.error("Long-lived token exchange failed:", longLivedData);
        // Fallback to short-lived token if long-lived exchange fails
        var finalToken = shortLivedToken;
      } else {
        var finalToken = longLivedData.access_token;
      }

      // Step 3: Get Instagram account details
      const profileResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${finalToken}`
      );

      const profileData = await profileResponse.json();

      if (!profileResponse.ok || !profileData.username) {
        console.error("Profile fetch failed:", profileData);
        return res.redirect("/accounts?error=profile_fetch_failed");
      }

      // Step 4: Check if account already exists and create/update
      const existingAccount = await storage.getAccountByInstagramUserId(igUserId);
      
      if (existingAccount) {
        // Update existing account with new token
        await storage.updateAccount(existingAccount.id, {
          accessToken: finalToken,
          username: profileData.username,
        });
      } else {
        // Create new account
        await storage.createAccount({
          userId: req.user!.id,
          instagramUserId: igUserId,
          username: profileData.username,
          accessToken: finalToken,
        });
      }

      res.redirect("/accounts?success=true");
    } catch (error) {
      console.error("Instagram OAuth callback error:", error);
      res.redirect("/accounts?error=connection_failed");
    }
  });
}
