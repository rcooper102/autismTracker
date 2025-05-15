const { createHash } = require('crypto');
const fetch = require('node-fetch');

async function hashPassword(password) {
  const salt = createHash('sha256').update(Math.random().toString()).digest('hex').substring(0, 16);
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return `${hash}.${salt}`;
}

async function main() {
  console.log('Creating test user...');
  
  try {
    // Register a practitioner
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'practitioner'
      })
    });
    
    const data = await response.json();
    console.log('Registration response:', data);
    
    if (response.ok) {
      console.log('Test user created successfully!');
    } else {
      console.error('Failed to create test user:', data);
    }
  } catch (error) {
    console.error('Error creating test user:', error.message);
  }
}

main();