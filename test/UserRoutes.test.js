import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import app from '../server.js';
import User from '../models/User.js';
import connectDB from '../config/dbConnection.js';

describe('User Registration and Deletion', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  let userId;

  it('should register a new user', async () => {
    const res = await request(app).post('/api/user/register').send({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
    });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('message', 'User registered successfully!');

    const user = await User.findOne({ username: 'testuser' });
    expect(user).to.not.be.null;
    userId = user._id.toString();
  });

  it('should delete the user', async () => {
    const res = await request(app).delete(`/api/user/${userId}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', 'User deleted successfully');

    const userCheck = await User.findById(userId);
    expect(userCheck).to.be.null;
  });
});