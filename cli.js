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
    const command = input[0].toLowerCase();  // Using toLowerCase() to avoid case-sensitivity issues
    const args = input.slice(1);

    switch (command) {
        case '/register':
            handleRegister(args);
            break;
        case '/login':
            handleLogin(args);
            break;
        case '/createchat':
            createChat(args);
            break;
        case '/joinchat':
            joinChat(args);
            break;
        case '/deletechat':
            deleteChat(args);  // Make sure this case exists
            break;
        case '/exit':
            handleExit();
            break;
        default:
            sendMessage(line);  // Ensure this is only called when none of the above commands match
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
        axios.post(`${apiUrl}/login`, { email: args[0], password: args[1] })
            .then(response => {
                userToken = response.data.token; // Save the token
                const userName = response.data.username; // Assuming the server sends back the username

                console.log(`${response.data.message}`); // E.g., "Login successful."
                rl.setPrompt(`\x1b[33m${userName}>\x1b[0m `);

                const chats = response.data.chats;
                if (chats && chats.length > 0) {
                    console.log('Your chats:');
                    chats.forEach(chat => console.log(`- ${chat.name}`));
                } else {
                    console.log('You have no chats.');
                }

                // Display hints for next possible actions
                console.log("You can:");
                console.log('  - Create a new chat with "/createChat <chatName> <username>"');
                console.log('  - Join an existing chat with "/joinChat <chatName>"');
                console.log('  - Delete a chat with "/deleteChat <chatId>"');

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
    if (args.length === 2 && userToken) {
        const chatName = args[0];
        const otherUsername = args[1];
        socket.emit('createChat', { name: chatName, otherUsername, token: userToken });
        rl.prompt();
    } else if (!userToken) {
        console.log('You must be logged in to create a chat.');
        rl.prompt();
    } else {
        console.log('Usage: /CreateChat <chatName> <username>');
        rl.prompt();
    }
}

function deleteChat(args) {
    if (args.length === 1 && userToken) {
        const chatName = args[0];
        socket.emit('deleteChat', { chatName: chatName, token: userToken });
        rl.prompt();
    } else if (!userToken) {
        console.log('You must be logged in to delete a chat.');
        rl.prompt();
    } else {
        console.log('Usage: /deleteChat <chatName>');
        rl.prompt();
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

socket.on('chatDeleted', response => {
    if (currentChat === response.chatId) {
        currentChat = '';  // Clear current chat context
        rl.setPrompt('ChatApp> ');
        console.log('Current chat was deleted.');
    }
    console.log(response.message);
    rl.prompt();
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