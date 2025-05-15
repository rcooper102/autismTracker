import { db } from "../server/db";
import { users, clients, type User, type Client } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../server/auth";

// List of first names and last names to randomly choose from
const firstNames = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Jackson", 
  "Isabella", "Aiden", "Mia", "Lucas", "Charlotte", "Mason", "Amelia", 
  "Logan", "Harper", "Alexander", "Evelyn", "James"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", 
  "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", 
  "Martin", "Thompson", "Garcia", "Martinez", "Robinson"
];

// Helper function to generate a random name
function getRandomName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { firstName, lastName };
}

// Helper function to generate a random date of birth (between 5 and 18 years ago)
function getRandomDOB() {
  const today = new Date();
  const years = Math.floor(Math.random() * 13) + 5; // 5-18 years old
  const months = Math.floor(Math.random() * 12);
  const days = Math.floor(Math.random() * 28);
  
  const dob = new Date(today);
  dob.setFullYear(today.getFullYear() - years);
  dob.setMonth(today.getMonth() - months);
  dob.setDate(today.getDate() - days);
  
  return dob;
}

// List of possible diagnoses
const diagnoses = [
  "Autism Spectrum Disorder - Level 1", 
  "Autism Spectrum Disorder - Level 2",
  "Autism Spectrum Disorder - Level 3",
  "Asperger's Syndrome",
  "PDD-NOS (Pervasive Developmental Disorder Not Otherwise Specified)",
  "High-functioning autism"
];

// Helper function to get a random diagnosis
function getRandomDiagnosis() {
  return diagnoses[Math.floor(Math.random() * diagnoses.length)];
}

// List of possible treatment plans
const treatmentPlans = [
  "Applied Behavior Analysis (ABA)",
  "Speech Therapy",
  "Occupational Therapy",
  "Physical Therapy",
  "Social Skills Training",
  "Cognitive Behavioral Therapy (CBT)",
  "Sensory Integration Therapy",
  "Play Therapy",
  "Floortime Therapy"
];

// Helper function to get random treatment plans (1-4 plans)
function getRandomTreatmentPlans() {
  const numPlans = Math.floor(Math.random() * 4) + 1; // 1-4 plans
  const shuffled = [...treatmentPlans].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numPlans);
}

// List of possible treatment goals
const treatmentGoals = [
  "Improve verbal communication skills",
  "Develop social interaction skills",
  "Reduce repetitive behaviors",
  "Enhance fine motor skills",
  "Improve sensory processing",
  "Develop self-care routines",
  "Enhance emotional regulation",
  "Improve attention and focus",
  "Develop independent living skills",
  "Improve academic performance"
];

// Helper function to get random treatment goals (2-5 goals)
function getRandomTreatmentGoals() {
  const numGoals = Math.floor(Math.random() * 4) + 2; // 2-5 goals
  const shuffled = [...treatmentGoals].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numGoals);
}

// List of guardian relations
const guardianRelations = ["Mother", "Father", "Grandmother", "Grandfather", "Aunt", "Uncle", "Legal Guardian"];

// Helper function to get random guardian relation
function getRandomGuardianRelation() {
  return guardianRelations[Math.floor(Math.random() * guardianRelations.length)];
}

// Helper function to generate random phone number
function getRandomPhone() {
  return `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
}

// Helper function to generate random email for guardian
function getRandomEmail(firstName: string, lastName: string) {
  const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

// Helper function to create a random client
async function createRandomClient(practitionerId: number): Promise<void> {
  try {
    // Generate random data
    const { firstName, lastName } = getRandomName();
    const guardianFirst = getRandomName().firstName;
    const guardianLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Create a user account for this client
    const hashedPassword = await hashPassword("password123"); // Simple password for test accounts
    
    const [user] = await db.insert(users).values({
      username: `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
      email: getRandomEmail(firstName, lastName),
      role: "client"
    }).returning();
    
    // Create client profile
    await db.insert(clients).values({
      userId: user.id,
      practitionerId: practitionerId,
      firstName: firstName,
      lastName: lastName,
      dateOfBirth: getRandomDOB(),
      diagnosis: getRandomDiagnosis(),
      guardianName: `${guardianFirst} ${guardianLast}`,
      guardianRelation: getRandomGuardianRelation(),
      guardianPhone: getRandomPhone(),
      guardianEmail: getRandomEmail(guardianFirst, guardianLast),
      treatmentPlan: getRandomTreatmentPlans(),
      treatmentGoals: getRandomTreatmentGoals(),
      notes: `Initial consultation completed. ${firstName} shows ${Math.random() > 0.5 ? "good" : "moderate"} response to ${treatmentPlans[Math.floor(Math.random() * treatmentPlans.length)]}.`
    });
    
    console.log(`Created client: ${firstName} ${lastName}`);
  } catch (error) {
    console.error("Error creating client:", error);
  }
}

// Main function
async function main() {
  try {
    // Get practitioner ID (assuming username is "practitioner")
    const [practitioner] = await db.select().from(users).where(eq(users.username, "practitioner"));
    
    if (!practitioner) {
      console.error("Practitioner account not found!");
      process.exit(1);
    }
    
    console.log("Adding test clients for practitioner:", practitioner.name);
    
    // Create 8 random clients
    const numClients = 8;
    for (let i = 0; i < numClients; i++) {
      await createRandomClient(practitioner.id);
    }
    
    console.log(`Successfully added ${numClients} test clients.`);
    process.exit(0);
  } catch (error) {
    console.error("Error in main function:", error);
    process.exit(1);
  }
}

// Run the script
main();