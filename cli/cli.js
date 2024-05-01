import readline from 'readline';
import { handleCommand } from '../handlers/handleCommand.js';
import { displayCommands, updatePrompt } from '../utils/uiHelpers.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'ChatApp> '
});

console.log('Welcome to ChatWave! Please log in or register to continue.');
displayCommands(false, '');
updatePrompt(rl, '', false);

rl.prompt();

rl.on('line', (line) => {
    handleCommand(line, rl);
});