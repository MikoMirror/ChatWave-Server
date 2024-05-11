import readline from 'readline';
import fetch from 'node-fetch'; 

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => {
    rl.question(question, resolve);
  });

const registerUser = async () => {
  const username = await ask('Enter username: ');
  const email = await ask('Enter email: ');
  const password = await ask('Enter password: ');

  try {
    const response = await fetch('http://localhost:3000/api/user/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

registerUser();