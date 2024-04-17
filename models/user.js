import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  hashed_password: { type: String, required: true }
  // Other fields as necessary
});

const User = mongoose.model('User', userSchema);

export default User;