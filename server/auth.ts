import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "autitrack-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', { id: user.id, avatarUrl: user.avatarUrl });
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      console.log('Deserialized user from database:', { 
        id: user?.id, 
        avatarUrl: user?.avatarUrl,
        hasAvatarField: user ? 'avatarUrl' in user : false 
      });
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const userData: InsertUser = {
        ...req.body,
        password: await hashPassword(req.body.password),
      };

      const user = await storage.createUser(userData);
      
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt with:", { 
      email: req.body.email,
      hasPassword: !!req.body.password 
    });
    
    // Handle login with email
    if (req.body.email) {
      // Custom authentication using email
      storage.getUserByEmail(req.body.email)
        .then(async (user) => {
          console.log("User found by email:", !!user);
          
          if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
          }
          
          const passwordValid = await comparePasswords(req.body.password, user.password);
          console.log("Password valid:", passwordValid);
          
          if (!passwordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
          }
          
          req.login(user, (err) => {
            if (err) {
              return next(err);
            }
            // Don't send password back to client
            const { password, ...userWithoutPassword } = user;
            return res.status(200).json(userWithoutPassword);
          });
        })
        .catch(err => {
          console.error("Error in email login:", err);
          next(err);
        });
    } else {
      // Fall back to username-based login
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: "Invalid username or password" });
        }
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          // Don't send password back to client
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Don't send password back to client
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });
}
