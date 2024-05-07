import axios from 'axios';
import { apiUrl } from '../config.js';
import { jwtDecode } from 'jwt-decode';
import { extractUserId } from './extractUserId.js';
import Chat from '../models/chat.js';
import User from '../models/user.js';

const getChatId = async (chatName, token) => {
  try {
      const response = await axios.get(`${apiUrl}/chat/exists/${chatName}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.exists) {
          return response.data.chatId;
      }
  } catch (error) {
      console.error('Failed to get chat ID:', error.response ? error.response.data : error);
  }
  return null;
};

export const register = async (username, email, password) => {
  try {
      const response = await axios.post(`${apiUrl}/users/register`, {
          username, email, password
      });
      return response.data;
  } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      return null; // Or handle the error as you see fit
  }
};

export const login = async (email, password) => {
  try {
      const response = await axios.post(`${apiUrl}/users/login`, {
          email, password
      });
      return response.data;
  } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return null;
  }
};

 
  
export const logout = async () => {
  try {
      const response = await axios.post(`${apiUrl}/users/logout`);
      return response.data;
  } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
      return null;
  }
};


export const sendChatMessage = async (chatName, message, token) => {
    const userId = await extractUserId(token);
    if (!userId) {
        return { message: "Invalid token: Unable to extract user ID." };
    }

    try {
        const response = await axios.post(`${apiUrl}/chat/messages`, {
            chatName,
            message,
            senderId: userId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error.response ? JSON.stringify(error.response.data) : error.message);
        return { message: error.response?.data?.message || "Failed to send message." };
    }
};

export const checkChatExists = async (chatName, token) => {
    try {
        const response = await axios.get(`${apiUrl}/chat/exists/${chatName}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking chat existence:', error.response ? JSON.stringify(error.response.data) : error.message);
        return { exists: false, message: error.response?.data?.message || "Failed to check chat existence." };
    }
};

export const createChat = async (chatName, anotherUsername, token) => {
    try {
        // Ensure the variable names match those expected by the server-side endpoint
        // Since you mentioned 'anotherUsername' but used 'participantUsername' in your axios post.
        const response = await axios.post(`${apiUrl}/chat`, { name: chatName, participantsUsernames: [anotherUsername] }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Returning response.data directly assuming it contains the chat data from server response
        return response.data;
    } catch (error) {
        // Improved error logging: Console logs error directly for debugging
        console.error('Error creating chat:', error.response ? JSON.stringify(error.response.data) : error.message);

        // Return a more descriptive error object or null based on your error handling strategy
        return { success: false, message: error.response ? error.response.data.message : error.message };
    }
};