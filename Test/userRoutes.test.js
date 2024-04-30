import request from 'supertest';
import { expect } from 'chai'; 
import app from '../server.js';  

describe('POST /users/login', () => {
    it('should login successfully with correct credentials', async () => {
        const response = await request(app)
          .post('/users/login')
          .send({
            email: 'miko@gmail.com',
            password: '1234'
          });
    
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('token');
        expect(response.body.username).to.equal('Miko');  
    });
    it('should return 404 error for user not found', async () => {
        const response = await request(app)
            .post('/users/login')
            .send({
                email: 'nonexistent@gmail.com',
                password: '1234'
            });
    
        expect(response.status).to.equal(404);
        expect(response.body.message).to.equal('User not found.');
    });
    
    it('should return 401 error for incorrect password', async () => {
        const response = await request(app)
            .post('/users/login')
            .send({
                email: 'miko@gmail.com',
                password: 'wrongpassword'
            });
    
        expect(response.status).to.equal(401);
        expect(response.body.message).to.equal('Invalid password.'); 
    });
});