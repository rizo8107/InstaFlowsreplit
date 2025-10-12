import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as FacebookStrategy } from "passport-facebook";
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
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
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

  // Facebook OAuth Strategy for Instagram connection
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: `${process.env.REPLIT_DEV_DOMAIN ? 'https://' + process.env.REPLIT_DEV_DOMAIN : 'http://localhost:5000'}/api/auth/facebook/callback`,
          profileFields: ['id', 'emails', 'name'],
          passReqToCallback: true,
        },
        async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            // Store access token in session for later use
            req.session.facebookAccessToken = accessToken;
            req.session.facebookProfile = profile;
            return done(null, req.user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

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

  // Facebook OAuth routes for Instagram connection
  app.get(
    "/api/auth/instagram",
    (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Must be logged in to connect Instagram");
      }
      next();
    },
    passport.authenticate("facebook", {
      scope: [
        "instagram_basic",
        "pages_show_list",
        "instagram_graph_user_profile",
        "instagram_graph_user_media",
        "instagram_manage_messages",
        "instagram_manage_comments",
      ],
    })
  );

  app.get(
    "/api/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/accounts?error=oauth_failed" }),
    async (req, res) => {
      try {
        const accessToken = (req.session as any).facebookAccessToken;
        
        if (!accessToken) {
          return res.redirect("/accounts?error=no_token");
        }

        // Get Instagram Business Account from Facebook
        const accountsResponse = await fetch(
          `https://graph.facebook.com/v24.0/me/accounts?fields=instagram_business_account,access_token&access_token=${accessToken}`
        );
        const accountsData = await accountsResponse.json();

        if (!accountsData.data || accountsData.data.length === 0) {
          return res.redirect("/accounts?error=no_instagram_account");
        }

        // Find the first page with an Instagram Business Account
        const pageWithInstagram = accountsData.data.find(
          (page: any) => page.instagram_business_account
        );

        if (!pageWithInstagram) {
          return res.redirect("/accounts?error=no_business_account");
        }

        const igUserId = pageWithInstagram.instagram_business_account.id;
        const pageAccessToken = pageWithInstagram.access_token;

        // Get Instagram account details
        const igResponse = await fetch(
          `https://graph.facebook.com/v24.0/${igUserId}?fields=id,username,name,profile_picture_url&access_token=${pageAccessToken}`
        );
        const igData = await igResponse.json();

        // Check if account already exists
        const existingAccount = await storage.getAccountByInstagramUserId(igUserId);
        
        if (existingAccount) {
          // Update existing account
          await storage.updateAccount(existingAccount.id, {
            accessToken: pageAccessToken,
            username: igData.username,
          });
        } else {
          // Create new account
          await storage.createAccount({
            userId: req.user!.id,
            instagramUserId: igUserId,
            username: igData.username,
            accessToken: pageAccessToken,
          });
        }

        // Clean up session
        delete (req.session as any).facebookAccessToken;
        delete (req.session as any).facebookProfile;

        res.redirect("/accounts?success=true");
      } catch (error) {
        console.error("Instagram OAuth error:", error);
        res.redirect("/accounts?error=connection_failed");
      }
    }
  );
}
