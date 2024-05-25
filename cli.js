import readline from 'readline';
import fetch from 'node-fetch';
import io from 'socket.io-client';
import jwt from 'jsonwebtoken';


const API_BASE_URL = 'http://localhost:3000/api';
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
    } 
  };


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
      const socket = io('http://localhost:3000');
      socket.emit('authenticate', data.token);
      const userId = getUserIdFromToken(data.token);
      fetchAndDisplayChats(userId, socket, username); 
      return true;
    } else {
      console.error(data.message);
      return false; 
    }
  } catch (error) {
    console.error('Error logging in:', error);
  }
};

const fetchAndDisplayChats = async (userId, socket, username) => {
  try {
    const chatsResponse = await fetch(`${API_BASE_URL}/chat/user/${userId}`);
    if (chatsResponse.ok) {
      const { chats } = await chatsResponse.json();
      if (chats.length > 0) {
        console.log(`You have ${chats.length} Chats.`);
        const action = await ask("Do you want to (1) join a chat or (2) create a new chat? ");
        if (action === "1") {
          console.log("Your Chats:");
          chats.forEach((chat, index) => {
            console.log(
              `${index + 1}. ${chat.name} (Participants: ${chat.participants
                .map((p) => p.username)
                .join(', ')})`
            );
          });
          const chatChoice = await ask('Select chat number: ');
          const chosenChat = chats[parseInt(chatChoice) - 1];
          startChatRoom(chosenChat, socket, username); 
        } else if (action === "2") {
          createNewChat(userId, socket, username); 
        } else {
          console.error("Invalid choice. Please select 1 or 2.");
        }
      } else {
        console.log("You have 0 chats. Please create a new chat.");
        createNewChat(userId, socket, username); 
      }
    } else {
      console.error('Error fetching chats');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const createNewChat = async (userId, socket, username) => {
  const chatName = await ask('Enter chat name: ');
  const participantUsername = await ask('Enter the username of the person you want to chat with: ');
  try {
    const response = await fetch(`${API_BASE_URL}/user/findByUsername`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: participantUsername }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error finding user:', errorData.message);
      fetchAndDisplayChats(userId, socket, username); 
      return; 
    }
    const { user: participant } = await response.json();
    const participantId = participant._id;

    const createChatResponse = await fetch(`${API_BASE_URL}/chat/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: chatName,
        participantIds: [userId, participantId],
      }),
    });
    if (createChatResponse.ok) {
      const data = await createChatResponse.json();
      console.log(data.message);
      startChatRoom(data.chat, socket, username); 
    } else {
      const errorData = await createChatResponse.json();
      console.error('Error creating chat:', errorData.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const startChatRoom = (chat, socket, username) => {
  console.log(`\n----- Chat: ${chat.name} -----`);
  socket.emit('join-chat', chat._id); 

  socket.on('chat-history', (chatHistory) => {
    chatHistory.forEach(message => {
      const match = message.match(/\[.*\]<(.*)> (.*)/);
      const formattedMessage = match ? 
        `${message.replace(match[1], `\x1b[34m${match[1]}\x1b[0m`)}` : 
        message;
      console.log(formattedMessage);
    });
    rl.prompt();
  });

  const sendMessage = () => {
    rl.question('> ', (message) => {
      socket.emit('chat-message', {
        chatId: chat._id,
        message: message,
        sender: username
      });
      sendMessage();
    });
  };

  socket.on('chat-message', ({ sender, message }) => {
    const senderColor = '\x1b[32m'; 
    const resetColor = '\x1b[0m';

    if (sender !== username) {
      console.log(`${senderColor}${sender}${resetColor}: ${message}`);
      rl.prompt(); 
    } else {
      rl.prompt(); 
    }
  });

  sendMessage();
  rl.prompt(); 
};

const getUserIdFromToken = (token) => {
  try {
    const decoded = jwt.verify(token, 'your-secret-key'); 
    return decoded.userId;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};

const main = async () => {
  console.log("Welcome to the Chat CLI!");
  let loggedIn = false;

  while (!loggedIn) { 
    const action = await ask("Do you want to (1) register or (2) login? ");
    if (action === "1") {
      await registerUser();
    } else if (action === "2") {
      loggedIn = await loginUser(); 
    } else {
      console.error("Invalid choice. Please select 1 or 2.");
    }
  } 
};
main();