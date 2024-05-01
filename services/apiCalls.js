import axios from 'axios';
import { apiUrl } from '../config.js';

export const register = async (username, email, password) => {
  const response = await axios.post(`${apiUrl}/users/register`, { username, email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await axios.post(`${apiUrl}/users/login`, { email, password });
  return response.data;
};

export const createChat = async (chatName, anotherUsername) => {
  const response = await axios.post(`${apiUrl}/chat/create`, { chatName, anotherUsername });
  return response.data;
};

export const logout = async () => {
  const response = await axios.post(`${apiUrl}/users/logout`);
  return response.data;
};