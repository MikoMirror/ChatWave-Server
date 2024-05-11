import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const testMongoDBConnection = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Successfully connected to MongoDB Atlas!');
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB Atlas.');
    } catch (error) {
        console.error('Failed to connect to MongoDB Atlas:', error.message);
    }
};

testMongoDBConnection();