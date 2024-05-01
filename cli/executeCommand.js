import { login, register, createChat, logout } from '../services/apiCalls.js';
import { displayCommands, updatePrompt } from '../utils/uiHelpers.js';


let userToken = ''; 
let isLoggedIn = false;
let username = '';
let currentChat = '';

const executeCommand = async (command, args, rl) => {
    try {
        switch (command.toLowerCase()) {
            case '/register':
            const userReg = await register(...args);
            console.log(userReg.message); 
            rl.prompt();  
            break;
            case '/login':
                const userLog = await login(...args);
                if (userLog.token) {
                    userToken = userLog.token; 
                    username = userLog.username; 
                    isLoggedIn = true; 
                    updatePrompt(rl, username, isLoggedIn);

                    console.log("Your chats:");
                    if (userLog.chats.length > 0) {
                        userLog.chats.forEach(chat => {
                            console.log(`- ${chat.name} with ${chat.participants.join(', ')}`);
                            if (!currentChat) currentChat = chat.name;
                        });
                    } else {
                        console.log("No chats available.");
                    }
                    displayCommands(isLoggedIn, currentChat);
                } else {
                    console.log("Login failed.");
                    displayCommands(isLoggedIn, currentChat);
                }
                break;
            case '/createchat':
                if (!userToken) {
                    console.log("You need to be logged in to create a chat.");
                    break;
                }
                const chat = await createChat(...args, userToken);
                console.log(`Chat created: ${chat.name}`);
                break;
                case '/logout':
                    await logout(userToken);
                    userToken = '';
                    username = '';
                    isLoggedIn = false;
                    currentChat = '';
                    updatePrompt(rl, '', isLoggedIn);
                    displayCommands(isLoggedIn, currentChat);
                break;
            default:
                console.log('Unknown command:', command);
        }
    } catch (err) {
        console.error(`${command.replace('/', '').charAt(0).toUpperCase() + command.slice(2)} error:`, err.message);
    } finally {
        rl.prompt();
    }
};

export default executeCommand;