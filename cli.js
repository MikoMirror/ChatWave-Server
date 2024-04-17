import readline from 'readline';
import axios from 'axios';
import chalk from 'chalk';

chalk.level = 3; 
const violet = chalk.hex('#8F00FF')

const apiUrl = 'http://localhost:3000';
let userToken = '';
let currentUser = null;
let currentChat = null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function handleRegister(username, email, password) {
    try {
        const response = await axios.post(`${apiUrl}/register`, { username, email, password });
        console.log(chalk.yellow('Registration successful!'));
        updatePrompt();
    } catch (error) {
        console.error(chalk.yellow(`Registration error: ${error.response ? error.response.data.message : error.message}`));
    }
}

async function handleLogin(email, password) {
    try {
        const response = await axios.post(`${apiUrl}/login`, { email, password });
        if (response.status === 200) {
            console.log('Login successful!');
            currentUser = response.data.username;
            userToken = response.data.token;
            await displayChats();
        } else {
            console.error('Login failed:', response.data.message);
        }
    } catch (error) {
        console.error('An error occurred during login:', error.message);
    }
}

async function displayChats() {
    try {
        const response = await axios.get(`${apiUrl}/user/chats`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        if (response.data.length === 0) {
            console.log(chalk.red('Chats not found, type "createChat" to start a new chat.'));
        } else {
            console.log('Your chats:');
            response.data.forEach(chat => {
                console.log(`- ${chat.name}`);
            });
            // Inform the user about the joinChat command
            console.log(chalk.yellow('You can join an existing chat by typing "joinChat <chatName>".'));
        }
    } catch (error) {
        console.error('An error occurred fetching chats:', error.message);
    }
}

async function createChat(chatName, anotherUser) {
    try {
        const response = await axios.post(`${apiUrl}/createChat`, {
            name: chatName,
            users: [currentUser, anotherUser]
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        console.log(chalk.green(`Chat ${chatName} created successfully!`));
        currentChat = chatName;
        updatePrompt();
    } catch (error) {
        console.error('Failed to create chat:', error.message);
    }
}
async function joinChat(chatName) {
    try {
      const response = await axios.post(`${apiUrl}/joinChat`, {
        name: chatName
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
  
      if (response.data.message === "User already in chat.") {
        console.log(`You are now active in chat: ${chatName}`);
        await displayChatHistory(chatName); // Display chat history after joining
      } else {
        console.log(response.data.message);
      }
      currentChat = chatName;  // Set or switch the current chat context
      updatePrompt();
    } catch (error) {
      console.error('Failed to join chat:', error.response ? error.response.data.message : error.message);
    }
  }


  async function displayChatHistory(chatName) {
    try {
      const chatId = await getChatIdByName(chatName);
      if (!chatId) {
        console.log('Could not find chat to display history.');
        return;
      }
      const response = await axios.get(`${apiUrl}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log(`Chat history for ${chatName}:`);
      response.data.forEach((message) => {
        const timestamp = new Date(message.timestamp).toLocaleString();
        console.log(`[${timestamp}] ${message.sender.username}: ${message.content}`);
      });
    } catch (error) {
      console.error('Failed to get chat history:', error.response ? error.response.data.message : error.message);
    }
  }

async function addMessage(content) {
    const chatId = await getChatIdByName(currentChat); // Get the chat ID from the chat name
    if (chatId) {
        try {
            await axios.post(`${apiUrl}/chats/${chatId}/messages`, {
                content // Content of the message
            }, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            // No logging needed as per your requirement
        } catch (error) {
            console.error('Failed to add message:', error.response ? error.response.data.message : error.message);
        }
    } else {
        console.log('Could not find chat to send the message.');
    }
}

function showCommandsLoggedIn() {
    console.log(chalk.yellow('Available commands for logged in users:'));
    console.log(chalk.yellow('  /createChat <chatName> <anotherUser> - Create a new chat with another user.'));
    if (currentChat) {
        console.log(chalk.yellow('  /exitChat - Leave the current chat.'));
    }
    console.log(chalk.yellow('  /logout - Log out of the chat application.'));
}

function exitChat() {
    if (currentChat) {
        console.log(`You have left the chat: ${currentChat}`);
        currentChat = null; // Reset the currentChat to indicate the user is not in a chat anymore
        updatePrompt();
        showCommandsLoggedIn(); // Show the available commands after exiting a chat
    } else {
        console.log('You are not currently in a chat.');
    }
}

async function getChatIdByName(chatName) {
    try {
        const response = await axios.get(`${apiUrl}/chats/name/${encodeURIComponent(chatName)}`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        return response.data.chatId; // Assuming your server responds with the chatId
    } catch (error) {
        console.error('Failed to get chat ID:', error.response ? error.response.data.message : error.message);
        return null; // Return null if there's an error
    }
}

function updatePrompt() {
    if (currentChat) {
        rl.setPrompt(chalk.green(currentChat) + violet(` (${currentUser}) > `));
    } else if (currentUser) {
        rl.setPrompt(chalk.yellow(`${currentUser} > `));
        // Moved the showCommandsLoggedIn() call here from the handleLogin() function
        showCommandsLoggedIn();
    } else {
        rl.setPrompt(chalk.yellow('Chat App CLI > '));
        showCommandsNotLoggedIn();
    }
    rl.prompt(); // This needs to be called only once at the end of the function
}

function logout() {
    if (userToken) {
        console.log(`Goodbye, ${currentUser}. You have been logged out.`);
        userToken = ''; // Clear the token
        currentUser = null; // Clear the current user
        currentChat = null; // Clear the current chat
        updatePrompt();
    } else {
        console.log('You are not logged in.');
    }
}

function showCommandsNotLoggedIn() {
    console.log(chalk.yellow('Available commands:'));
    console.log(chalk.yellow('  /register <username> <email> <password>'));
    console.log(chalk.yellow('  /login <email> <password>'));
}

rl.on('line', async (line) => {
    const trimmedLine = line.trim();

    // Check if the user is in a chat context and the input is not empty.
    if (currentChat && trimmedLine) {
        await addMessage(trimmedLine);
    } else {
        // If the user is not in a chat or the line is empty, process commands.
        const [command, ...args] = trimmedLine.split(' ');
        
        switch (command) {
            case 'register':
                await handleRegister(...args);
                break;
            case 'login':
                await handleLogin(...args);
                break;
            case 'createChat':
                await createChat(...args);
                break;
            case 'joinChat':
                await joinChat(...args);
                break;
            case 'logout':
                logout();
                break;
            case 'exitchat':
                exitChat();
                    break;
            // ... any other commands
            default:
                if (command) {
                    console.log(chalk.yellow('Unknown command or empty message.'));
                }
        }
    }
    updatePrompt();
});


updatePrompt();  // Set the initial prompt
