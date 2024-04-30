export const updatePrompt = (rl, username = '', isLoggedIn = false) => {
    const prompt = isLoggedIn ? `\x1b[33m${username}\x1b[0m> ` : 'ChatApp> ';
    rl.setPrompt(prompt);
    rl.prompt();
  };
  
  export const displayCommands = (isLoggedIn, currentChat) => {
    console.log('Available commands:');
    if (!isLoggedIn) {
      console.log('/login <userEmail> <password>');
      console.log('/register <username> <email> <password>');
    } else {
      console.log('/createChat <chatName> <anotherUsername>');
      console.log('/logout');
      if (currentChat) {
        console.log('/joinChat <chatName>');
        console.log('/removeChat <chatName>');
      }
    }
  };