var prompt = require('prompt');
var WebSocket = require('nodejs-websocket');

var connection = WebSocket.connect('ws://localhost:7219');
connection.on('text', function(data) {
    console.log('Connected with random hash: ' + data);
    connection.authKey = data;

    input();
});

var input = function() {
    prompt.start();
    prompt.get(['command'], function(err, result) {
        if (err) {
            console.log(err);
            return false;
        }

        var command = result.command;
        connection.sendText(JSON.stringify({
            key: connection.authKey,
            command: command
        }));

        input();
    });
}
