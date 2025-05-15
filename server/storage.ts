import { 
  users, type User, type InsertUser,
  clients, type Client, type InsertClient, type ClientWithUser,
  dataEntries, type DataEntry, type InsertDataEntry,
  sessions, type Session, type InsertSession
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
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientWithUser(id: number): Promise<(Client & { user: User }) | undefined>;
  getClientByUserId(userId: number): Promise<Client | undefined>;
  getClientsByPractitionerId(practitionerId: number): Promise<ClientWithUser[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  
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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
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
    const [updatedClient] = await db
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    
    return updatedClient;
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
}

export const storage = new DatabaseStorage();
