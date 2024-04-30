import { login, register, createChat, logout } from '../services/apiCalls.js';
import { displayCommands, updatePrompt } from '../utils/uiHelpers.js';

const executeCommand = async (command, args, rl) => {
    try {
        switch (command.toLowerCase()) {
            case '/register':
                const userReg = await register(...args);
                updatePrompt(rl, userReg.username, true);
                displayCommands(true);
                break;
            case '/login':
                const userLog = await login(...args);
                updatePrompt(rl, userLog.username, true);
                displayCommands(true);
                displayUserChats(rl, userToken)
                break;
            case '/createchat':
                const chat = await createChat(...args);
                console.log(`Chat created: ${chat.name}`);
                break;
            case '/logout':
                await logout();
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

const displayUserChats = async (rl, userToken) => {
    try {
        const response = await axios.get('http://localhost:3000/user/chats', {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });

        console.log(response.data.message); 
        response.data.chats.forEach(chatName => {
            console.log(`-${chatName}`);
        });
    } catch (error) {
        console.error('Error fetching chats:', error.response?.data || error.message);
    } finally {
        rl.prompt();
    }
};


export const handleCommand = (line, rl) => {
    const [command, ...args] = line.trim().split(' ');
    executeCommand(command, args, rl);
};