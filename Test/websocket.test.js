import { expect } from "chai";
import { io as Client } from "socket.io-client";

describe("WebSocket Server", function() {
    let clientSocket;

    before(function(done) {
        this.timeout(10000);
        clientSocket = Client("http://localhost:3000", {
            transports: ['websocket']
        });
        clientSocket.on('connect', done);
        clientSocket.on('connect_error', (error) => {
            console.log('Connection Failed: ', error);
            done(error);
        });
    });

    after(function() {
        // Close the connection after the tests
        clientSocket.close();
    });

    it("should echo messages", function(done) {
        const testMessage = "Hello, server!";
        clientSocket.emit("chat message", testMessage);
        clientSocket.on("chat message", (msg) => {
            expect(msg).to.equal(testMessage);
            done();
        });
    });
});