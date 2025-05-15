import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db, pool } from "../server/db";
import { users, clients, dataEntries, sessions } from "../shared/schema";
import { sql } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Starting database setup...");
  
  // Create tables manually
  try {
    console.log("Creating users table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'client',
        name TEXT NOT NULL,
        email TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("Creating clients table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        practitioner_id INTEGER NOT NULL REFERENCES users(id),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        date_of_birth TIMESTAMP,
        diagnosis TEXT,
        guardian_name TEXT,
        guardian_relation TEXT,
        guardian_phone TEXT,
        guardian_email TEXT,
        treatment_plan TEXT,
        treatment_goals JSON DEFAULT '[]',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("Creating data_entries table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS data_entries (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        mood TEXT NOT NULL,
        anxiety_level INTEGER,
        sleep_quality INTEGER,
        challenges JSON DEFAULT '[]',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("Creating sessions table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        practitioner_id INTEGER NOT NULL REFERENCES users(id),
        date TIMESTAMP NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create default practitioner user
    const existingUser = await db.select().from(users).where(users.username.equals("practitioner"));
    
    if (existingUser.length === 0) {
      console.log("Creating default practitioner user...");
      await db.insert(users).values({
        username: "practitioner",
        password: await hashPassword("password"),
        role: "practitioner",
        name: "Dr. Rebecca Chen",
        email: "rebecca.chen@example.com"
      });
      console.log("Default practitioner user created successfully.");
    } else {
      console.log("Default practitioner user already exists.");
    }
    
    console.log("Database setup completed successfully.");
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);