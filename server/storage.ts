import { 
  users, type User, type InsertUser,
  clients, type Client, type InsertClient, type ClientWithUser,
  dataEntries, type DataEntry, type InsertDataEntry,
  sessions, type Session, type InsertSession
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  // Storage maps for data
  private usersStore: Map<number, User>;
  private clientsStore: Map<number, Client>;
  private dataEntriesStore: Map<number, DataEntry>;
  private sessionsStore: Map<number, Session>;
  
  // Auto-increment counters
  private userIdCounter: number;
  private clientIdCounter: number;
  private dataEntryIdCounter: number;
  private sessionIdCounter: number;
  
  // Session store for authentication
  sessionStore: session.SessionStore;

  constructor() {
    this.usersStore = new Map();
    this.clientsStore = new Map();
    this.dataEntriesStore = new Map();
    this.sessionsStore = new Map();
    
    this.userIdCounter = 1;
    this.clientIdCounter = 1;
    this.dataEntryIdCounter = 1;
    this.sessionIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    
    // Create a default practitioner for testing
    this.createUser({
      username: "practitioner",
      password: "password",
      role: "practitioner",
      name: "Dr. Rebecca Chen",
      email: "rebecca.chen@example.com"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersStore.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersStore.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...userData, id, createdAt };
    this.usersStore.set(id, user);
    return user;
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clientsStore.get(id);
  }

  async getClientWithUser(id: number): Promise<(Client & { user: User }) | undefined> {
    const client = this.clientsStore.get(id);
    if (!client) return undefined;
    
    const user = this.usersStore.get(client.userId);
    if (!user) return undefined;
    
    return { ...client, user };
  }

  async getClientByUserId(userId: number): Promise<Client | undefined> {
    return Array.from(this.clientsStore.values()).find(
      (client) => client.userId === userId
    );
  }

  async getClientsByPractitionerId(practitionerId: number): Promise<ClientWithUser[]> {
    const clients = Array.from(this.clientsStore.values())
      .filter((client) => client.practitionerId === practitionerId);
    
    return Promise.all(
      clients.map(async (client) => {
        const user = await this.getUser(client.userId);
        return { ...client, user: user! };
      })
    );
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const createdAt = new Date();
    const client: Client = { ...clientData, id, createdAt };
    this.clientsStore.set(id, client);
    return client;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = this.clientsStore.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.clientsStore.set(id, updatedClient);
    return updatedClient;
  }

  // Data entry operations
  async getDataEntry(id: number): Promise<DataEntry | undefined> {
    return this.dataEntriesStore.get(id);
  }

  async getDataEntriesByClientId(clientId: number): Promise<DataEntry[]> {
    return Array.from(this.dataEntriesStore.values())
      .filter((entry) => entry.clientId === clientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Most recent first
  }

  async createDataEntry(entryData: InsertDataEntry): Promise<DataEntry> {
    const id = this.dataEntryIdCounter++;
    const createdAt = new Date();
    const entry: DataEntry = { ...entryData, id, createdAt };
    this.dataEntriesStore.set(id, entry);
    return entry;
  }

  // Session operations
  async getSession(id: number): Promise<Session | undefined> {
    return this.sessionsStore.get(id);
  }

  async getSessionsByClientId(clientId: number): Promise<Session[]> {
    return Array.from(this.sessionsStore.values())
      .filter((session) => session.clientId === clientId)
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Ascending by date
  }

  async getSessionsByPractitionerId(practitionerId: number): Promise<Session[]> {
    return Array.from(this.sessionsStore.values())
      .filter((session) => session.practitionerId === practitionerId)
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Ascending by date
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const createdAt = new Date();
    const session: Session = { ...sessionData, id, createdAt };
    this.sessionsStore.set(id, session);
    return session;
  }

  async updateSession(id: number, sessionData: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessionsStore.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...sessionData };
    this.sessionsStore.set(id, updatedSession);
    return updatedSession;
  }

  // Statistics operations
  async countClientsByPractitionerId(practitionerId: number): Promise<number> {
    return Array.from(this.clientsStore.values()).filter(
      (client) => client.practitionerId === practitionerId
    ).length;
  }

  async countActiveSessionsByPractitionerId(practitionerId: number): Promise<number> {
    const now = new Date();
    return Array.from(this.sessionsStore.values()).filter(
      (session) => 
        session.practitionerId === practitionerId && 
        session.status === "confirmed" &&
        session.date > now
    ).length;
  }

  async countPendingReviewsByPractitionerId(practitionerId: number): Promise<number> {
    // Consider data entries in the last 48 hours as pending review
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    // First get all clients for this practitioner
    const clientIds = Array.from(this.clientsStore.values())
      .filter(client => client.practitionerId === practitionerId)
      .map(client => client.id);
    
    // Then count recent entries for these clients
    return Array.from(this.dataEntriesStore.values()).filter(
      (entry) => 
        clientIds.includes(entry.clientId) && 
        entry.createdAt > twoDaysAgo
    ).length;
  }
}

export const storage = new MemStorage();
