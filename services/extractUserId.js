import { jwtDecode } from "jwt-decode";
import User from '../models/user.js'; 

export const extractUserId = (token) => {
    try {
        const decoded = jwtDecode(token);
        return decoded.userId; // Ensure your token structure actually includes 'userId'
    } catch (error) {
        console.error('Failed to decode token:', error.message);
        return null;
    }
};


export const getUserIdByUsername = async (username) => {
    try {
        const user = await User.findOne({ username });
        return user?._id;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
};