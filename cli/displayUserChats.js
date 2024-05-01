import axios from 'axios';
import { apiUrl } from '../config.js'; 

export const displayUserChats = async (rl, userToken) => {
    try {
        const response = await axios.get(`${apiUrl}/users/chats`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });

        console.log('API Response:', response.data); 
        response.data.forEach(chat => {
            console.log(`- ${chat.name}`);
        });

    } catch (error) {
        console.error('Error fetching chats:', error.message);
    } finally {
        rl.prompt();
    }
};