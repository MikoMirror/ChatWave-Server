const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server'); // Adjust the path as necessary to import your Express app
const should = chai.should();

chai.use(chaiHttp);

describe('Messaging in Chat', () => {
    // Assuming you have a user and chat setup that can be used for tests
    const testUserToken = 'yourTestUserToken'; // This should be an actual JWT token if your route requires authentication
    const chatId = 'yourChatId'; // Ensure this is a valid chat ID from your database
    const message = "Hello, this is a test message!";

    it('should send a message to a specified chat', (done) => {
        chai.request(app)
            .post('/chat/messages') // Adjust if your route differs
            .set('Authorization', `Bearer ${testUserToken}`)
            .send({
                chatId: chatId,
                message: message
            })
            .end((err, res) => {
                res.should.have.status(201);
                res.body.should.be.a('object');
                res.body.should.have.property('message').eql('Message sent successfully');
                done();
            });
    });
});