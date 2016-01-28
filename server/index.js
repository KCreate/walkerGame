// Third-Party Dependencies
var WebSocket           = require('nodejs-websocket');
var express             = require('express');
var app                 = express();
var fs                  = require('fs');

// Game dependencies
var Chat                = new (require('./chat.js'))();
var Game                = new (require('./game.js'))();
var CommandsController  = new (require('./commandscontroller.js'))();

// Some constants
var ControlPort         = 6627;
var GamePort            = 6628;
var DefaultMapSize      = 15;

// Chat Controller Setup
Chat.on('update', function(update) {
    GameSocket.connections.forEach(function(conn) {
        try {
            conn.sendText(JSON.stringify({
                newMessage: update.newMessage,
                messages: update.messages,
                type: 'chat'
            }));
        } catch (e) {
            console.log(e);
        }
    });
});
// Notify other sockets that a player changed his info
Chat.on('playerInfoChanged', function() {
    GameSocket.connections.forEach(function(conn) {
        try {
            conn.sendText(
                JSON.stringify({
                    players: Game.players,
                    type: 'player'
                })
            );
        } catch (e) {
            console.log(e);
        }
    });
});

/*
    Game Controller
*/
app.use(express.static('./client'));
app.listen(ControlPort);

var GameSocket = WebSocket.createServer(function (conn) {

    if (!Game.registerPlayer(conn.key)) {
        secureClose(conn);
    }

    // Send down the whole chat
    try {
        conn.sendText(
            JSON.stringify({
                chat: Chat.messages,
                type: 'chat'
            })
        );
    } catch (e) {
        console.log(e);
        secureClose(conn);
    }

    conn.on("text", function (data) {
        try {
            data = JSON.parse(data);
        } catch (e) {
            console.log(e);
            return false;
        }

        switch (data.type) {
            case 'action':
                // Notify the game of the action
                Game.action(
                    data.actionName,
                    conn.key
                );
                break;
            case 'chat':
                // Notify the chat of the new message
                Chat.write(
                    data.message,
                    Game.playerForKey(conn.key)
                );
                break;
            default:

        }
	});

    conn.on("close", function() {
        Game.unregisterPlayer(conn.key);
    });

    conn.on('error', function(err) {
        console.log(conn.key, err);
        secureClose(conn);
    });

}).listen(GamePort);

/*
    Game Interaction and Response
*/
Game.clearMap(DefaultMapSize, DefaultMapSize);
Game.verbose = true;

// Notify sockets that the map changed
Game.render = function(game, changedRC) {
    GameSocket.connections.forEach(function(conn, index) {
        try {
            conn.sendText(
                JSON.stringify({
                    game: {
                        key: conn.key
                    },
                    map: game.map,
                    players: game.players,
                    changedRC,
                    type: 'game'
                })
            );
        } catch (e) {
            console.log(e);
            secureClose(conn);
        }
    });
}

// Notify sockets that something changed reagarding players
Game.playersChanged = function(players) {
    console.log(players);

    // Kick and close all connections of dead players
    players.forEach(function(player) {
        if (player) {
            if (player.health === 0) {
                GameSocket.connections.forEach(function(conn, index) {
                    if (conn.key === player.key) {
                        conn.close();
                    }
                });
            }
        }
    });

    Chat.fireEvent('playerInfoChanged');
}

/*
    Setup the commands controller
*/
CommandsController.setup(Game, Chat, GameSocket);
CommandsController.startRegistering();

/*
    Securely close the websocket connection without crashing
*/
function secureClose(conn) {
    console.log(connreadyState);
    if (conn.readyState === 1 || conn.readyState === 2) {
        try { conn.close(); } catch (e) { console.log(e); }
    }
}
