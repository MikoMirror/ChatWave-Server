import readline from 'readline';
import { io } from 'socket.io-client';
import axios from 'axios';

const apiUrl = 'http://localhost:3000';
const socket = io(apiUrl);
let userToken = '';
let currentChat = '';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'ChatApp> '
});

console.log('Connected to chat server.');
console.log('Type "/register <username> <email> <password>" to register.');
console.log('Type "/login <email> <password>" to log in.');

rl.prompt();

rl.on('line', (line) => {
    const input = line.trim().split(' ');
    const command = input[0];
    const args = input.slice(1);

    switch (command) {
        case '/register':
            handleRegister(args);
            break;
        case '/login':
            handleLogin(args);
            break;
        case '/createChat':
            createChat(args);
            break;
        case '/joinChat':
            joinChat(args);
            break;
        case '/exit':
            handleExit();
            break;
        default:
            sendMessage(line);
            break;
    }
    rl.prompt();
});

function handleRegister(args) {
    if (args.length === 3) {
        axios.post(`${apiUrl}/register`, {
            username: args[0],
            email: args[1],
            password: args[2]
        })
        .then(response => {
            console.log(response.data.message); // Registration successful.
            rl.prompt();
        })
        .catch(error => {
            console.log(error.response ? error.response.data : 'An error occurred during registration');
            rl.prompt();
        });
    } else {
        console.log('Usage: /register <username> <email> <password>');
        rl.prompt();
    }
}

function handleLogin(args) {
    if (args.length === 2) {
        axios.post(`${apiUrl}/login`, {
            email: args[0],
            password: args[1]
        })
        .then(response => {
            userToken = response.data.token; // Save the token
            console.log(response.data.message); // Login successful.
            // You may want to store user data or handle chat UI here.
            rl.prompt();
        })
        .catch(error => {
            console.log(error.response ? error.response.data : 'An error occurred during login');
            rl.prompt();
        });
    } else {
        console.log('Usage: /login <email> <password>');
        rl.prompt();
    }
}

function createChat(args) {
    if (args.length === 1 && userToken) {
        socket.emit('createChat', { name: args[0], token: userToken });
    } else {
        console.log('Usage: /createChat <chatName>');
    }
}

function joinChat(args) {
    if (args.length === 1 && userToken) {
        socket.emit('joinChat', { chatName: args[0], token: userToken });
        currentChat = args[0];
        rl.setPrompt(`${currentChat} > `);
    } else {
        console.log('Usage: /joinChat <chatName>');
    }
}

function handleExit() {
    console.log('Exiting the chat application...');
    socket.disconnect();
    rl.close();
}

function sendMessage(message) {
    if (!userToken) {
        console.log('You must be logged in to send messages.');
        return;
    }
    if (!currentChat) {
        console.log('You must join a chat to send messages.');
        return;
    }
    if (message.trim().length === 0) {
        console.log('Message cannot be empty.');
        return;
    }
    socket.emit('sendMessage', { message: message, token: userToken, chatName: currentChat });
}

socket.on('registered', response => {
    console.log(response.message);  // Logging the success message to the console
});

socket.on('logged_in', response => {
  if (response) {
      userToken = response.token;
      console.log('Logged in successfully. Your chats will appear here.');
      if (response.chats && response.chats.length > 0) {
          response.chats.forEach(chat => console.log(`- ${chat.name}`));
      } else {
          console.log('You have no chats. You can create a chat using "/createChat <chatName>"');
      }
  } else {
      console.log("Error: No response from server or login failed.");
  }
  rl.prompt();
});

socket.on('chatCreated', response => {
    console.log(`Chat created: ${response.chat.name}`);
    currentChat = response.chat.name;
    rl.setPrompt(`${currentChat} > `);
});

socket.on('chatJoined', response => {
    console.log(`Joined chat: ${response.chat.name}`);
    currentChat = response.chat.name;
    rl.setPrompt(`${currentChat} > `);
});

socket.on('message', data => {
    console.log(`[${data.sender}]: ${data.message}`);
});

socket.on('error', errorMessage => {
    console.log('Error:', errorMessage);
});