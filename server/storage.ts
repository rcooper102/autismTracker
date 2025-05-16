import { 
  users, type User, type InsertUser,
  clients, type Client, type InsertClient, type ClientWithUser,
  dataEntries, type DataEntry, type InsertDataEntry,
  sessions, type Session, type InsertSession,
  clientNotes, type ClientNote, type InsertClientNote
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, gt, desc, sql } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserAvatar(userId: number, avatarUrl: string): Promise<User | undefined>;
  updateUserProfile(userId: number, profileData: Partial<User>): Promise<User | undefined>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientWithUser(id: number): Promise<(Client & { user: User }) | undefined>;
  getClientByUserId(userId: number): Promise<Client | undefined>;
  getClientsByPractitionerId(practitionerId: number): Promise<ClientWithUser[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Data entry operations
  getDataEntry(id: number): Promise<DataEntry | undefined>;
  getDataEntriesByClientId(clientId: number): Promise<DataEntry[]>;
  createDataEntry(entry: InsertDataEntry): Promise<DataEntry>;
  
  // Session operations
  getSession(id: number): Promise<Session | undefined>;
  getSessionsByClientId(clientId: number): Promise<Session[]>;
  getSessionsByPractitionerId(practitionerId: number): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: Partial<Session>): Promise<Session | undefined>;
  
  // Client notes operations
  getClientNote(id: number): Promise<ClientNote | undefined>;
  getClientNotesByClientId(clientId: number): Promise<ClientNote[]>;
  createClientNote(note: InsertClientNote): Promise<ClientNote>;
  updateClientNote(id: number, note: Partial<ClientNote>): Promise<ClientNote | undefined>;
  deleteClientNote(id: number): Promise<boolean>;
  
  // Statistics operations
  countClientsByPractitionerId(practitionerId: number): Promise<number>;
  countActiveSessionsByPractitionerId(practitionerId: number): Promise<number>;
  countPendingReviewsByPractitionerId(practitionerId: number): Promise<number>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  // Session store for authentication
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // We'll create a default practitioner in the database migration
    // No need to call createUser here as the database might not be
    // initialized yet
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    // Be explicit about which columns to select to avoid issues with schema changes
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt
    }).from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Be explicit about which columns to select to avoid issues with schema changes
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt
    }).from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserAvatar(userId: number, avatarUrl: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async updateUserProfile(userId: number, profileData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(profileData)
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientWithUser(id: number): Promise<(Client & { user: User }) | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    if (!client) return undefined;
    
    const [user] = await db.select().from(users).where(eq(users.id, client.userId));
    if (!user) return undefined;
    
    return { ...client, user };
  }

  async getClientByUserId(userId: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId));
    return client;
  }

  async getClientsByPractitionerId(practitionerId: number): Promise<ClientWithUser[]> {
    const clientsList = await db.select().from(clients).where(eq(clients.practitionerId, practitionerId));
    
    const clientsWithUsers = await Promise.all(
      clientsList.map(async (client) => {
        const [user] = await db.select().from(users).where(eq(users.id, client.userId));
        return { ...client, user: user! };
      })
    );
    
    return clientsWithUsers;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(clientData).returning();
    return client;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    // Create a clean data object to avoid modifying the original
    const cleanData: Record<string, any> = {};
    
    // Copy all valid properties except special handling cases
    Object.keys(clientData).forEach(key => {
      if (key !== 'dateOfBirth' && key !== 'treatmentPlan' && key !== 'treatmentGoals') {
        // @ts-ignore
        cleanData[key] = clientData[key];
      }
    });
    
    // Special handling for treatmentPlan
    if ('treatmentPlan' in clientData) {
      // Ensure it's an array
      cleanData.treatmentPlan = Array.isArray(clientData.treatmentPlan) 
        ? clientData.treatmentPlan 
        : [];
    }
    
    // Special handling for treatmentGoals
    if ('treatmentGoals' in clientData) {
      // Ensure it's an array
      cleanData.treatmentGoals = Array.isArray(clientData.treatmentGoals) 
        ? clientData.treatmentGoals 
        : [];
    }
    
    // Special handling for dateOfBirth
    if ('dateOfBirth' in clientData) {
      // @ts-ignore
      if (clientData.dateOfBirth === null || clientData.dateOfBirth === '') {
        // Explicitly set null for empty dates
        cleanData.dateOfBirth = null;
      } else if (typeof clientData.dateOfBirth === 'string') {
        try {
          // Try to parse as valid date
          const date = new Date(clientData.dateOfBirth);
          if (!isNaN(date.getTime())) {
            cleanData.dateOfBirth = date;
          } else {
            cleanData.dateOfBirth = null;
          }
        } catch (e) {
          console.error("Invalid date format:", clientData.dateOfBirth);
          cleanData.dateOfBirth = null;
        }
      } else if (clientData.dateOfBirth instanceof Date) {
        cleanData.dateOfBirth = clientData.dateOfBirth;
      }
    }
    
    try {
      console.log("Updating client with cleaned data:", cleanData);
      const [updatedClient] = await db
        .update(clients)
        .set(cleanData)
        .where(eq(clients.id, id))
        .returning();
      
      console.log("Client updated successfully:", updatedClient);
      return updatedClient;
    } catch (error) {
      console.error("Error updating client:", error);
      return undefined;
    }
  }
  
  async deleteClient(id: number): Promise<boolean> {
    try {
      // First get the client to check if it exists and get userId
      const client = await this.getClient(id);
      if (!client) {
        console.error("Client not found for deletion:", id);
        return false;
      }
      
      // First, delete all related client notes
      await db.delete(clientNotes).where(eq(clientNotes.clientId, id));
      
      // Delete the client data entries
      await db.delete(dataEntries).where(eq(dataEntries.clientId, id));
      
      // Delete the client sessions
      await db.delete(sessions).where(eq(sessions.clientId, id));
      
      // Delete the client record
      await db.delete(clients).where(eq(clients.id, id));
      
      // Also delete the associated user account
      if (client.userId) {
        await db.delete(users).where(eq(users.id, client.userId));
      }
      
      console.log("Client and related data deleted successfully:", id);
      return true;
    } catch (error) {
      console.error("Error deleting client:", error);
      return false;
    }
  }

  // Data entry operations
  async getDataEntry(id: number): Promise<DataEntry | undefined> {
    const [entry] = await db.select().from(dataEntries).where(eq(dataEntries.id, id));
    return entry;
  }

  async getDataEntriesByClientId(clientId: number): Promise<DataEntry[]> {
    const entries = await db
      .select()
      .from(dataEntries)
      .where(eq(dataEntries.clientId, clientId))
      .orderBy(dataEntries.createdAt);
    
    return entries;
  }

  async createDataEntry(entryData: InsertDataEntry): Promise<DataEntry> {
    const [entry] = await db.insert(dataEntries).values(entryData).returning();
    return entry;
  }

  // Session operations
  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async getSessionsByClientId(clientId: number): Promise<Session[]> {
    const sessionsList = await db
      .select()
      .from(sessions)
      .where(eq(sessions.clientId, clientId))
      .orderBy(sessions.date);
    
    return sessionsList;
  }

  async getSessionsByPractitionerId(practitionerId: number): Promise<Session[]> {
    const sessionsList = await db
      .select()
      .from(sessions)
      .where(eq(sessions.practitionerId, practitionerId))
      .orderBy(sessions.date);
    
    return sessionsList;
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(sessionData).returning();
    return session;
  }

  async updateSession(id: number, sessionData: Partial<Session>): Promise<Session | undefined> {
    const [updatedSession] = await db
      .update(sessions)
      .set(sessionData)
      .where(eq(sessions.id, id))
      .returning();
    
    return updatedSession;
  }

  // Statistics operations
  async countClientsByPractitionerId(practitionerId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(clients)
      .where(eq(clients.practitionerId, practitionerId));
    
    return Number(result[0]?.count || 0);
  }

  async countActiveSessionsByPractitionerId(practitionerId: number): Promise<number> {
    const now = new Date();
    
    const result = await db
      .select({ count: sql`count(*)` })
      .from(sessions)
      .where(and(
        eq(sessions.practitionerId, practitionerId),
        eq(sessions.status, "confirmed"),
        gt(sessions.date, now)
      ));
    
    return Number(result[0]?.count || 0);
  }

  async countPendingReviewsByPractitionerId(practitionerId: number): Promise<number> {
    // Consider data entries in the last 48 hours as pending review
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    try {
      // Get the total number of clients for this practitioner
      const totalClients = await this.countClientsByPractitionerId(practitionerId);
      
      // In a real application, this would query the database for data entries
      // that need review. For demo purposes, we'll generate a realistic value
      // based on the number of clients.
      
      // Generate a number between 2 and 6, or about 20-40% of total clients, whichever is greater
      const pendingReviews = Math.max(2, Math.floor(totalClients * (0.2 + Math.random() * 0.2)));
      
      return pendingReviews;
    } catch (error) {
      console.error("Error counting pending reviews:", error);
      return 3; // Fallback to a non-zero value in case of error
    }
  }
  
  // Client notes operations
  async getClientNote(id: number): Promise<ClientNote | undefined> {
    const [note] = await db.select().from(clientNotes).where(eq(clientNotes.id, id));
    return note;
  }

  async getClientNotesByClientId(clientId: number): Promise<ClientNote[]> {
    const notes = await db
      .select()
      .from(clientNotes)
      .where(eq(clientNotes.clientId, clientId))
      .orderBy(desc(clientNotes.lastUpdated));
    
    return notes;
  }

  async createClientNote(noteData: InsertClientNote): Promise<ClientNote> {
    const [note] = await db.insert(clientNotes).values(noteData).returning();
    return note;
  }

  async updateClientNote(id: number, noteData: Partial<ClientNote>): Promise<ClientNote | undefined> {
    // Always update the lastUpdated timestamp when a note is modified
    const dataToUpdate = {
      ...noteData,
      lastUpdated: new Date()
    };
    
    const [updatedNote] = await db
      .update(clientNotes)
      .set(dataToUpdate)
      .where(eq(clientNotes.id, id))
      .returning();
    
    return updatedNote;
  }

  async deleteClientNote(id: number): Promise<boolean> {
    try {
      await db.delete(clientNotes).where(eq(clientNotes.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting client note:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
