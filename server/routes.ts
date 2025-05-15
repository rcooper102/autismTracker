import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertClientSchema, insertDataEntrySchema, insertSessionSchema } from "@shared/schema";

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

  // Create an HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
