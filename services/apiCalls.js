import axios from 'axios';
import { apiUrl } from '../config.js';

export const register = async (username, email, password) => {
  const response = await axios.post(`${apiUrl}/user/register`, { username, email, password });
  return response.data; // Assume this includes username and token
};

export const login = async (email, password) => {
  const response = await axios.post(`${apiUrl}/user/login`, { email, password });
  return response.data; // Assume this includes username and token
};

export const createChat = async (chatName, anotherUsername) => {
  const response = await axios.post(`${apiUrl}/chat/create`, { chatName, anotherUsername });
  return response.data; // Assume this includes chat info
};

export const logout = async () => {
  await axios.post(`${apiUrl}/user/logout`); // Clean up local session data here, if necessary
};