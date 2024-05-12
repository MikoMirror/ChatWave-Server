import readline from 'readline';
import fetch from 'node-fetch';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:3000/api'; 

// --- Utility Functions ---

// Create a readline interface for user input.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Asynchronously prompt the user for input.
const ask = (question) => 
  new Promise((resolve) => {
    rl.question(question, resolve);
  });

// --- API Interaction Functions ---

// Register a new user.
const registerUser = async () => {
  const username = await ask('Enter username: ');
  const email = await ask('Enter email: ');
  const password = await ask('Enter password: ');

  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(data.message);
    } else {
      console.error(data.message);
    }
  } catch (error) {
    console.error('Error registering user:', error);
  } finally {
    rl.close(); 
  }
};

// Login an existing user.
const loginUser = async () => {
  const username = await ask('Enter username: ');
  const password = await ask('Enter password: ');

  try {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(data.message); 
    } else {
      console.error(data.message);
    }
  } catch (error) {
    console.error('Error logging in:', error);
  } finally {
    rl.close(); 
  }
};

// --- Main CLI Logic ---

const main = async () => {
  console.log("Welcome to the Chat CLI!");
  const action = await ask("Do you want to (1) register or (2) login? ");

  if (action === "1") {
    await registerUser();
  } else if (action === "2") {
    await loginUser();
  } else {
    console.error("Invalid choice. Please select 1 or 2.");
    rl.close();
  }
};

// Start the CLI
main();