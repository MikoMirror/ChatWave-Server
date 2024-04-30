import readline from 'readline';
import { handleCommand } from './commandHandlers.js';
import { displayCommands, updatePrompt } from '../utils/uiHelpers.js';
import { apiUrl } from '../config.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let isLoggedIn = false;
let username = '';
let currentChat = '';

console.log('Welcome to ChatWave! Please log in or register to continue.');
displayCommands(isLoggedIn, currentChat);
updatePrompt(rl, username, isLoggedIn);

rl.prompt();

rl.on('line', (line) => {
  handleCommand(line, rl, {
    onLoginSuccess: (user) => {
      console.log(`Logged in as ${user.username}.`);
      updatePrompt(rl, user.username, true);
      displayCommands(true);
      rl.prompt();
    },
    onError: (error) => {
      console.error(error);
      rl.prompt();
    },
    onRegisterSuccess: (user) => {
      username = user.username; // Assuming the register response has a username
      isLoggedIn = true;
      console.log(`Registered and logged in as ${username}.`);
      updatePrompt(rl, username, isLoggedIn);
      displayCommands(isLoggedIn, currentChat);
    },
    onLogout: () => {
      username = '';
      isLoggedIn = false;
      currentChat = '';
      console.log('Logged out successfully.');
      updatePrompt(rl, username, isLoggedIn);
      displayCommands(isLoggedIn, currentChat);
    },
    onCreateChat: (chat) => {
      console.log(`Chat ${chat.name} created successfully.`);
      currentChat = chat.name; // Store or handle new chat details as needed
      displayCommands(isLoggedIn, currentChat);
    },
    onError: (error) => {
      console.error(error);
      rl.prompt();
    }
  });
  rl.prompt();
});
