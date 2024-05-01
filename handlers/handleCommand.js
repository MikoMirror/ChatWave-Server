import executeCommand from '../cli/executeCommand.js';

export const handleCommand = async (line, rl) => {
    const [command, ...args] = line.trim().split(' ');
    
    executeCommand(command, args, rl);
};