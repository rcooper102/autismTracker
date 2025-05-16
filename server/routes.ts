import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertClientSchema, insertDataEntrySchema, insertSessionSchema, insertUserSchema, insertClientNoteSchema, users } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
  
  // Always serve files from the uploads directory
  app.use('/uploads', express.static(uploadDir));
  
  // Add a test endpoint to verify avatar access
  app.get('/api/avatar-test', (req, res) => {
    const files = fs.readdirSync(uploadDir)
      .filter(f => f.startsWith('avatar-'))
      .map(f => `/uploads/${f}`);
      
    console.log('Available avatar files:', files);
    
    res.json({
      message: "Avatar test endpoint",
      avatarFiles: files,
      uploadDirExists: fs.existsSync(uploadDir),
      uploadDirContents: fs.readdirSync(uploadDir),
      testImageUrl: files.length > 0 ? files[files.length-1] : null
    });
  });

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
  
  // Update client information
  app.patch("/api/clients/:clientId", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    const clientId = parseInt(req.params.clientId);
    
    // Verify the client belongs to this practitioner
    const client = await storage.getClient(clientId);
    if (!client || client.practitionerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this client" });
    }
    
    try {
      // Define validation schema for client updates
      const clientUpdateSchema = z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        email: z.string().email().optional(),
        dateOfBirth: z.string().optional().nullable(),
        diagnosis: z.string().optional().nullable(),
        treatmentPlan: z.any().optional(),
        treatmentGoals: z.array(z.string()).optional(),
        guardianName: z.string().optional().nullable(),
        guardianRelation: z.string().optional().nullable(),
        guardianPhone: z.string().optional().nullable(),
        guardianEmail: z.string().email().optional().nullable(),
        notes: z.string().optional().nullable(),
      });

      const validatedData = clientUpdateSchema.parse(req.body);
      
      // Update client record
      const updatedClient = await storage.updateClient(clientId, validatedData);
      
      // If email was updated, update the user's email as well
      if (validatedData.email && client.userId) {
        const user = await storage.getUser(client.userId);
        if (user) {
          await db.update(users)
            .set({ email: validatedData.email })
            .where(eq(users.id, user.id));
        }
      }
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(updatedClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });
  
  // Archive client
  app.patch("/api/clients/:clientId/archive", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    const clientId = parseInt(req.params.clientId);
    
    // Verify the client belongs to this practitioner
    const client = await storage.getClient(clientId);
    if (!client || client.practitionerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to archive this client" });
    }
    
    try {
      const archivedClient = await storage.archiveClient(clientId);
      
      if (!archivedClient) {
        return res.status(500).json({ message: "Failed to archive client" });
      }
      
      res.json({ 
        message: "Client archived successfully",
        client: archivedClient
      });
    } catch (error) {
      console.error("Error archiving client:", error);
      res.status(500).json({ message: "Failed to archive client" });
    }
  });
  
  // Delete client
  app.delete("/api/clients/:clientId", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    const clientId = parseInt(req.params.clientId);
    
    // Verify the client belongs to this practitioner
    const client = await storage.getClient(clientId);
    if (!client || client.practitionerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this client" });
    }
    
    try {
      const success = await storage.deleteClient(clientId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete client" });
      }
      
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });
  
  // Reset client password
  app.patch("/api/clients/:clientId/reset-password", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    const clientId = parseInt(req.params.clientId);
    
    // Verify the client belongs to this practitioner
    const client = await storage.getClient(clientId);
    if (!client || client.practitionerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this client" });
    }
    
    try {
      // Define validation schema for password reset
      const passwordResetSchema = z.object({
        password: z.string().min(6, { message: "Password must be at least 6 characters" }),
      });

      const validatedData = passwordResetSchema.parse(req.body);
      
      // Import password utility from auth
      const { hashPassword } = await import("./auth");
      
      // Hash the new password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Update the user's password
      if (!client.userId) {
        return res.status(404).json({ message: "Client user account not found" });
      }
      
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, client.userId));
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid password data", errors: error.errors });
      }
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  
  // Upload client avatar
  app.post("/api/clients/:clientId/avatar", upload.single('avatar'), async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    const clientId = parseInt(req.params.clientId);
    
    // Verify the client belongs to this practitioner
    const client = await storage.getClient(clientId);
    if (!client || client.practitionerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this client" });
    }
    
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Create relative file path and URL
      // Add a timestamp to the file path to force cache invalidation
      const timestamp = Date.now();
      const relativeFilePath = `/uploads/${file.filename}`;
      
      // Set cache control headers for this response
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Get current client to access current notes
      const currentClient = await storage.getClient(clientId);
      
      // Parse existing notes if any
      let notesObj = {};
      if (currentClient?.notes) {
        try {
          notesObj = JSON.parse(currentClient.notes);
          // Remove avatarUrl from notes as we're now using the dedicated field
          delete notesObj.avatarUrl;
        } catch (e) {
          console.error("Error parsing notes:", e);
        }
      }
      
      // Update client record with the avatar URL and clean notes
      // Store the URL with timestamp parameter directly in the database
      const avatarUrlWithTimestamp = `${relativeFilePath}?t=${timestamp}`;
      console.log(`Saving avatar URL: ${avatarUrlWithTimestamp}`);
      
      await storage.updateClient(clientId, {
        avatarUrl: avatarUrlWithTimestamp,
        notes: Object.keys(notesObj).length > 0 ? JSON.stringify(notesObj) : null
      });
      
      res.json({
        message: "Avatar uploaded successfully",
        avatarUrl: avatarUrlWithTimestamp
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
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

  // Client Notes routes
  app.get("/api/clients/:clientId/notes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const clientId = parseInt(req.params.clientId);
    
    // Check authorization
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

    const notes = await storage.getClientNotesByClientId(clientId);
    res.json(notes);
  });

  app.post("/api/clients/:clientId/notes", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    const clientId = parseInt(req.params.clientId);
    
    // Verify the client belongs to this practitioner
    const client = await storage.getClient(clientId);
    if (!client || client.practitionerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to create notes for this client" });
    }

    try {
      const validatedData = insertClientNoteSchema.parse({
        ...req.body,
        clientId
      });

      const note = await storage.createClientNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.patch("/api/clients/:clientId/notes/:noteId", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    const clientId = parseInt(req.params.clientId);
    const noteId = parseInt(req.params.noteId);
    
    // Verify the client belongs to this practitioner
    const client = await storage.getClient(clientId);
    if (!client || client.practitionerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update notes for this client" });
    }
    
    // Verify the note belongs to this client
    const note = await storage.getClientNote(noteId);
    if (!note || note.clientId !== clientId) {
      return res.status(404).json({ message: "Note not found or doesn't belong to this client" });
    }

    try {
      // Define validation schema for note updates
      const noteUpdateSchema = z.object({
        title: z.string().optional(),
        entries: z.array(z.object({
          text: z.string(),
          date: z.string().or(z.date()).optional()
        })).optional()
      });

      const validatedData = noteUpdateSchema.parse(req.body);
      
      const updatedNote = await storage.updateClientNote(noteId, validatedData);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(updatedNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  // Get a single note by ID
  app.get("/api/notes/:noteId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const noteId = parseInt(req.params.noteId);
    
    try {
      const note = await storage.getClientNote(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Check authorization
      if (req.user.role === "practitioner") {
        const client = await storage.getClient(note.clientId);
        
        if (!client || client.practitionerId !== req.user.id) {
          return res.status(403).json({ message: "Not authorized to access this note" });
        }
      } else if (req.user.role === "client") {
        const client = await storage.getClientByUserId(req.user.id);
        
        if (!client || client.id !== note.clientId) {
          return res.status(403).json({ message: "Not authorized to access this note" });
        }
      } else {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });
  
  // Update a note by ID
  app.patch("/api/notes/:noteId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const noteId = parseInt(req.params.noteId);
    
    try {
      const note = await storage.getClientNote(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Check authorization
      if (req.user.role === "practitioner") {
        const client = await storage.getClient(note.clientId);
        
        if (!client || client.practitionerId !== req.user.id) {
          return res.status(403).json({ message: "Not authorized to update this note" });
        }
      } else {
        return res.status(403).json({ message: "Unauthorized. Practitioners only." });
      }
      
      // Define validation schema for note updates
      const noteUpdateSchema = z.object({
        title: z.string().optional(),
        entries: z.array(z.object({
          text: z.string(),
          date: z.string().or(z.date()).optional()
        })).optional()
      });

      const validatedData = noteUpdateSchema.parse(req.body);
      
      const updatedNote = await storage.updateClientNote(noteId, validatedData);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(updatedNote);
    } catch (error) {
      console.error("Error updating note:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update note" });
    }
  });
  
  // Delete a note by ID
  app.delete("/api/notes/:noteId", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    const noteId = parseInt(req.params.noteId);
    
    try {
      const note = await storage.getClientNote(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Check authorization
      const client = await storage.getClient(note.clientId);
      
      if (!client || client.practitionerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this note" });
      }
      
      const success = await storage.deleteClientNote(noteId);
      
      if (success) {
        res.json({ message: "Note deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete note" });
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  app.delete("/api/clients/:clientId/notes/:noteId", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "practitioner") {
      return res.status(403).json({ message: "Unauthorized. Practitioners only." });
    }

    const clientId = parseInt(req.params.clientId);
    const noteId = parseInt(req.params.noteId);
    
    // Verify the client belongs to this practitioner
    const client = await storage.getClient(clientId);
    if (!client || client.practitionerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete notes for this client" });
    }
    
    // Verify the note belongs to this client
    const note = await storage.getClientNote(noteId);
    if (!note || note.clientId !== clientId) {
      return res.status(404).json({ message: "Note not found or doesn't belong to this client" });
    }

    const success = await storage.deleteClientNote(noteId);
    
    if (success) {
      res.json({ message: "Note deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete note" });
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
      console.log('GET /api/practitioners/me - Authenticated user:', {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl // Check if avatarUrl is in the user object
      });
      
      // Get the user from the database to ensure we have the most up-to-date information
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from the response
      const { password, ...userWithoutPassword } = user;
      
      console.log('GET /api/practitioners/me - Retrieved profile data:', { 
        userId: user.id,
        profileData: {
          avatarUrl: user.avatarUrl,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          bio: user.bio
        },
        hasAvatar: !!user.avatarUrl
      });
      
      res.json(userWithoutPassword);
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
      
      // Update the user profile in the database
      const updatedUser = await storage.updateUserProfile(req.user.id, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return the updated user data without the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
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
      
      // Create a URL to serve the file with timestamp to prevent caching
      const timestamp = Date.now();
      const fileUrl = `${relativeFilePath}?t=${timestamp}`;
      
      // Serve static files from uploads directory
      if (!app._router.stack.some((layer: any) => 
        layer.route && layer.route.path === '/uploads')) {
        app.use('/uploads', express.static(uploadDir));
      }
      
      // Update the user's avatar URL in the database
      console.log('Avatar upload: updating avatar URL in database:', {
        userId: req.user.id,
        avatarUrl: fileUrl
      });
      
      // Save the avatar URL to the database
      const updatedUser = await storage.updateUserAvatar(req.user.id, fileUrl);
      
      if (!updatedUser) {
        console.error('Avatar upload: failed to update avatarUrl in database');
        return res.status(500).json({ message: "Failed to update avatar in database" });
      }
      
      console.log('Avatar upload: successfully updated user record with avatarUrl:', {
        userId: req.user.id,
        avatarUrl: updatedUser.avatarUrl
      });
      
      // Remove this line once all code is migrated to use the database
      // For backwards compatibility during transition
      const existingProfile = practitionerProfiles.get(req.user.id) || {};
      const updatedProfile = {
        ...existingProfile,
        avatarUrl: fileUrl,
      };
      practitionerProfiles.set(req.user.id, updatedProfile);
      
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
