
export const updatePrompt = (rl, username = '', isLoggedIn = false, currentChat = '') => {
  const promptColor = "\x1b[33m"; // ANSI escape code for yellow
  const resetColor = "\x1b[0m";   // ANSI escape code to reset color
  const chatDisplay = currentChat ? `[${currentChat}] ` : '';
  const prompt = isLoggedIn ? `${chatDisplay}${promptColor}${username}${resetColor}> ` : 'ChatApp> ';
  rl.setPrompt(prompt);
  rl.prompt();
};

export const displayCommands = (isLoggedIn, currentChat = '') => {
  console.log('Available commands:');
  if (!isLoggedIn) {
      console.log('/login <userEmail> <password>');
      console.log('/register <username> <email> <password>');
  } else if (currentChat) {
      console.log('/leaveChat');
      console.log('/sendMessage <message>');
      // Include other chat-specific commands here
  } else {
      console.log('/createChat <chatName> <anotherUsername>');
      console.log('/joinChat <chatName>');
      console.log('/logout');
  }
};