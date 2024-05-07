import { login, register, createChat, logout, sendChatMessage, checkChatExists } from '../services/apiCalls.js';
import { displayCommands, updatePrompt } from '../utils/uiHelpers.js';
import User from '../models/user.js';
import { extractUserId } from '../services/extractUserId.js';

let userToken = '';
let isLoggedIn = false;
let username = '';
let currentChat = '';

async function executeCommand(command, args, rl) {
    try {
        switch (command.toLowerCase()) {
            case '/register':
                await handleRegister(args, rl);
                break;
            case '/login':
                await handleLogin(args, rl);
                break;
            case '/createchat':
                await handleCreateChat(args, rl);
                break;
            case '/logout':
                await handleLogout(rl);
                break;
            case '/sendmessage':
                await handleSendMessage(args, rl);
                break;
            case '/joinchat':
                await handleJoinChat(args, rl);
                break;
            default:
                console.log('Unknown command:', command);
        }
    } catch (err) {
        console.error(`${command.slice(1)} error:`, err.message);
    } finally {
        rl.prompt();
    }
}

async function handleRegister(args, rl) {
    const userReg = await register(...args);
    console.log(userReg.message);
}

async function handleLogin(args, rl) {
    const userLog = await login(...args);
    if (userLog.token) {
        userToken = userLog.token;
        username = userLog.username;
        isLoggedIn = true;
        currentChat = '';
        updateUIAfterLogin(userLog, rl);
    } else {
        console.log("Login failed.");
        displayCommands(isLoggedIn, currentChat);
    }
}


function updateUIAfterLogin(userLog, rl) {
    updatePrompt(rl, username, isLoggedIn, currentChat);
    console.log("Your chats:");
    if (userLog.chats && userLog.chats.length > 0) {
        userLog.chats.forEach(chat => console.log(`- ${chat.name} with ${chat.participants.join(', ')}`));
    } else {
        console.log("No chats available.");
    }
    displayCommands(isLoggedIn, currentChat);
}

async function handleCreateChat(args, rl) {
    if (!userToken) {
        console.log("You need to be logged in to create a chat.");
        return;
    }
    const chat = await createChat(...args, userToken);
    console.log(`Chat created: ${chat.name}`);
}

async function handleLogout(rl) {
    await logout(userToken);
    userToken = '';
    username = '';
    isLoggedIn = false;
    currentChat = '';
    updatePrompt(rl, '', isLoggedIn);
    displayCommands(isLoggedIn, currentChat);
}

async function handleSendMessage(args, rl) {
    if (!currentChat) {
        console.log("You are not in any chat.");
        return;
    }
    if (!userToken) {
        console.log("You are not logged in or your session has expired.");
        return;
    }
    const message = args.join(' ');
    if (!message) {
        console.log("Usage: /sendMessage <message>");
        return;
    }
    const response = await sendChatMessage(currentChat, message, userToken);
    console.log(response.message);
}

async function handleJoinChat(args, rl) {
    const chatName = args.join(' ');
    if (!chatName) {
        console.log("Usage: /joinChat <chatName>");
        return;
    }
    const chatCheck = await checkChatExists(chatName, userToken);
    if (chatCheck && chatCheck.exists) {
        currentChat = chatName;
        console.log(`Entering chat room: ${chatName}`);
        updatePrompt(rl, username, isLoggedIn, currentChat);
    } else {
        console.log("Chat does not exist. Please try another chat name.");
    }
}

export default executeCommand;