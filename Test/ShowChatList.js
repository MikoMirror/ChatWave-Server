import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const apiUrl = 'http://localhost:3000';
const loginUrl = `${apiUrl}/user/login`;
const chatUrl = `${apiUrl}/chat`;


const userCredentials = {
  email: 'miko@gmail.com',
  password: '1234'
};

async function loginAndGetToken(credentials) {
  try {
    const response = await axios.post(loginUrl, credentials);
    return response.data.token; 
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    process.exit(1); 
  }
}

async function fetchChats(token) {
  try {
    const response = await axios.get(chatUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data; 
  } catch (error) {
    console.error('Error fetching chats:', error.response?.data || error.message);
    process.exit(1); 
  }
}

async function test() {
  const token = await loginAndGetToken(userCredentials);
  console.log('Token received:', token);

  const chats = await fetchChats(token);
  console.log('Chats:', chats);
}

test();