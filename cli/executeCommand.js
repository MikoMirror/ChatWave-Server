import { login, register, createChat, logout } from '../services/apiCalls.js';
import { displayCommands, updatePrompt } from '../utils/uiHelpers.js';
import { displayUserChats } from './displayUserChats.js';

let userToken = ''; // Store user token globally within the session context

const executeCommand = async (command, args, rl) => {
    try {
        switch (command.toLowerCase()) {
            case '/register':
                const userReg = await register(...args);
                userToken = userReg.token; // Store the token returned by the API
                updatePrompt(rl, userReg.username, true);
                displayCommands(true);
                break;
            case '/login':
                const userLog = await login(...args);
                userToken = userLog.token; // Update the global token
                updatePrompt(rl, userLog.username, true);
                displayCommands(true);
                await displayUserChats(rl, userToken); // Now this should work if displayUserChats is imported correctly
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
                    userToken = ''; // Discard the token
                    console.log('You have been logged out successfully.');
                    updatePrompt(rl, '', false);
                    displayCommands(false);
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