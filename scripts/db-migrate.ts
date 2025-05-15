import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db, pool } from "../server/db";
import { users } from "../shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Starting database migration and seeding...");
  
  // Create default practitioner user
  try {
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
  } catch (error) {
    console.error("Error creating default user:", error);
  }
  
  console.log("Database migration and seeding completed.");
  await pool.end();
}

main().catch(console.error);