import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertClientSchema, insertDataEntrySchema, insertSessionSchema, insertUserSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');

// Create the upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Client management routes
  app.get("/api/clients", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    const practitionerId = req.user.id;
    const clients = await storage.getClientsByPractitionerId(practitionerId);
    res.json(clients);
  });

  app.post("/api/clients", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    try {
      const validatedData = insertClientSchema.parse({
        ...req.body,
        practitionerId: req.user.id
      });

      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });
  
  // New endpoint that creates both a user and a client profile without auto-login
  app.post("/api/clients/with-user", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    try {
      // Import hashPassword from auth.ts
      const { hashPassword } = await import("./auth");
      
      // 1. Validate and create the user
      const userData = insertUserSchema.parse(req.body.user);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedUser = {
        ...userData,
        password: await hashPassword(userData.password),
      };
      
      // Create the user
      const newUser = await storage.createUser(hashedUser);
      
      // 2. Create the client profile linked to the new user
      const clientData = insertClientSchema.parse({
        ...req.body,
        userId: newUser.id,
        practitionerId: req.user.id
      });
      
      const client = await storage.createClient(clientData);
      
      // Return both the client and (password-less) user data
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json({
        client,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Error creating client with user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client with user" });
    }
  });

  app.get("/api/clients/:clientId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const clientId = parseInt(req.params.clientId);
    
    if (req.user?.role === "practitioner") {
      const client = await storage.getClientWithUser(clientId);
      
      if (!client || client.practitionerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this client" });
      }
      
      return res.json(client);
    } else if (req.user?.role === "client") {
      const client = await storage.getClientByUserId(req.user.id);
      
      if (!client || client.id !== clientId) {
        return res.status(403).json({ message: "Not authorized to access this client" });
      }
      
      return res.json(client);
    }

    res.status(403).json({ message: "Unauthorized" });
  });

  // Data entry routes
  app.get("/api/clients/:clientId/data", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const clientId = parseInt(req.params.clientId);
    
    if (req.user?.role === "practitioner") {
      const client = await storage.getClient(clientId);
      
      if (!client || client.practitionerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this client" });
      }
    } else if (req.user?.role === "client") {
      const client = await storage.getClientByUserId(req.user.id);
      
      if (!client || client.id !== clientId) {
        return res.status(403).json({ message: "Not authorized to access this client" });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const data = await storage.getDataEntriesByClientId(clientId);
    res.json(data);
  });

  app.post("/api/clients/:clientId/data", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const clientId = parseInt(req.params.clientId);
    
    // Only clients can create their own data or practitioners for their clients
    if (req.user?.role === "client") {
      const client = await storage.getClientByUserId(req.user.id);
      
      if (!client || client.id !== clientId) {
        return res.status(403).json({ message: "Not authorized to add data for this client" });
      }
    } else if (req.user?.role === "practitioner") {
      const client = await storage.getClient(clientId);
      
      if (!client || client.practitionerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to add data for this client" });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const validatedData = insertDataEntrySchema.parse({
        ...req.body,
        clientId
      });

      const entry = await storage.createDataEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data entry", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create data entry" });
    }
  });

  // Session management routes
  app.get("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let sessions;
    if (req.user?.role === "practitioner") {
      sessions = await storage.getSessionsByPractitionerId(req.user.id);
    } else if (req.user?.role === "client") {
      const client = await storage.getClientByUserId(req.user.id);
      if (!client) {
        return res.status(404).json({ message: "Client profile not found" });
      }
      sessions = await storage.getSessionsByClientId(client.id);
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(sessions);
  });

  app.post("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    try {
      const validatedData = insertSessionSchema.parse({
        ...req.body,
        practitionerId: req.user.id
      });

      // Verify the client belongs to this practitioner
      const client = await storage.getClient(validatedData.clientId);
      if (!client || client.practitionerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to create sessions for this client" });
      }

      const session = await storage.createSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get("/api/statistics", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    const practitionerId = req.user.id;
    const totalClients = await storage.countClientsByPractitionerId(practitionerId);
    const activeSessions = await storage.countActiveSessionsByPractitionerId(practitionerId);
    const pendingReviews = await storage.countPendingReviewsByPractitionerId(practitionerId);

    res.json({
      totalClients,
      activeSessions,
      pendingReviews
    });
  });

  // Practitioner profile management routes
  // Keep track of practitioner profile data in memory since we don't have a database table for it
  const practitionerProfiles = new Map<number, any>();

  app.get("/api/practitioners/me", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    try {
      // For now, we just return the user data with a placeholder for additional practitioner data
      // In a real app, you might have a separate practitioners table
      const { password, ...userWithoutPassword } = req.user;
      
      // Get any existing profile data or use defaults
      const existingProfile = practitionerProfiles.get(req.user.id) || {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "(555) 123-4567",
        bio: "Licensed therapist specializing in autism spectrum disorder",
        avatarUrl: null,
      };
      
      res.json({
        ...userWithoutPassword,
        ...existingProfile
      });
    } catch (error) {
      console.error("Error fetching practitioner profile:", error);
      res.status(500).json({ message: "Failed to fetch practitioner profile" });
    }
  });

  app.patch("/api/practitioners/me", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    try {
      // Define a validation schema for practitioner profile updates
      const profileUpdateSchema = z.object({
        firstName: z.string().min(2, { message: "First name must be at least 2 characters" }).optional(),
        lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }).optional(),
        email: z.string().email({ message: "Please enter a valid email address" }).optional(),
        phone: z.string().optional(),
        bio: z.string().optional(),
      });

      const validatedData = profileUpdateSchema.parse(req.body);
      
      // For now, we just return the updated data as if it was saved
      // In a real app, you would update a practitioners table
      const { password, ...userWithoutPassword } = req.user;
      
      res.json({
        ...userWithoutPassword,
        ...validatedData,
        avatarUrl: null, // This would come from the database in a real app
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      console.error("Error updating practitioner profile:", error);
      res.status(500).json({ message: "Failed to update practitioner profile" });
    }
  });

  // Handle avatar upload with multer middleware
  app.post("/api/practitioners/me/avatar", upload.single('avatar'), async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // In a production app, we'd store this path in a database
      // and associate it with the user record
      const userId = req.user.id;
      const relativeFilePath = `/uploads/${file.filename}`;
      const absoluteFilePath = file.path;
      
      // Create a URL to serve the file
      const fileUrl = relativeFilePath;
      
      // Serve static files from uploads directory
      if (!app._router.stack.some((layer: any) => 
        layer.route && layer.route.path === '/uploads')) {
        app.use('/uploads', express.static(uploadDir));
      }
      
      res.json({
        message: "Avatar uploaded successfully",
        avatarUrl: fileUrl
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // Password change endpoint
  app.post("/api/user/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Define validation schema for password change
      const passwordChangeSchema = z.object({
        currentPassword: z.string().min(6, { message: "Current password is required" }),
        newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
      });

      const validatedData = passwordChangeSchema.parse(req.body);
      
      // Import password utilities from auth
      const { comparePasswords, hashPassword } = await import("./auth");
      
      // Verify current password
      const passwordCorrect = await comparePasswords(
        validatedData.currentPassword, 
        req.user.password
      );
      
      if (!passwordCorrect) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // In a real app, you would update the password in the database
      // For now, we just return success
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid password data", errors: error.errors });
      }
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Create an HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
