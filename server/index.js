// Third-Party Dependencies
var WebSocket           = require('nodejs-websocket');
var express             = require('express');
var app                 = express();
var fs                  = require('fs');
var Cookies             = require('cookies');
var Sha1                = require('./classes/sha1.js');

// Game dependencies
var Chat                = new (require('./chat.js'))();
var Game                = new (require('./game.js'))();
var CommandsController  = new (require('./commandscontroller.js'))();

// Some constants
var ControlPort         = 7217;
var GamePort            = 7218;
var DefaultMapSize      = 15;

// Delete all player files
var rmDir = function(dirPath, removeSelf) {
    if (removeSelf === undefined) {
		removeSelf = true;
	}
    try {
        var files = fs.readdirSync(dirPath);
    } catch (e) {
        return;
    }
    if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + '/' + files[i];
            if (fs.statSync(filePath).isFile()) {
				fs.unlinkSync(filePath);
			} else {
				rmDir(filePath);
			}
        }
    if (removeSelf) {
		fs.rmdirSync(dirPath);
	}
};
rmDir('./server/players/', false);

// Create the players directory if it doesn't exist yet
if (!fs.existsSync('./server/players/')) {
    fs.mkdirSync('./server/players/');
}

// Create the world directory if it doesn't exist yet
if (!fs.existsSync('./server/worlds/')) {
    fs.mkdirSync('./server/worlds/');
}

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

// hashed ip adress used to identify players over different websocket connections
app.use(function(req, res, next) {
	// Get the remote address
	var hashedKey = Sha1.hash((
		req.headers["X-Forwarded-For"] ||
		req.headers["x-forwarded-for"] ||
		req.client.remoteAddress
	));
    hashedKey = hashedKey.split('').slice(0, Math.floor(hashedKey.length / 2)).join('');

	// Response
	res.cookie('sessionID', hashedKey);

	// Call the next middleware
	next();
});

app.use(express.static('./client'));

app.listen(ControlPort, function() {
    console.log('Control server ready at port ' + ControlPort);
});


var GameSocket = WebSocket.createServer(function (conn) {
    // Extract a permaKey if it's set
    var cookies = conn.headers.cookie;
	var permaKey = undefined;
	if (cookies) {
		permaKey = cookies.split('sessionID=')[1];
	}

    if (!Game.registerPlayer((permaKey || conn.key))) {
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
                    (permaKey || conn.key)
                );
                break;
            case 'chat':
                // Notify the chat of the new message
                Chat.write(
                    data.message,
                    Game.playerForKey((permaKey || conn.key))
                );
                break;
            default:

        }
	});

    conn.on("close", function() {
        Game.unregisterPlayer((permaKey || conn.key));
    });

    conn.on('error', function(err) {
        console.log("line 108" + err);
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
        // Extract a permaKey if it's set
        var cookies = conn.headers.cookie;
		if (cookies) {
			var permaKey = cookies.split('sessionID=')[1];
		}

        try {
            conn.sendText(
                JSON.stringify({
                    game: {
                        key: (permaKey || conn.key)
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

    var changedRC = {
        xChanged: [],
        yChanged: []
    };

    // Kick and close all connections of dead players
    players.forEach(function(player) {
        if (player) {

            // Update changedRC
            changedRC.xChanged.push(player.x);
            changedRC.yChanged.push(player.y);

			// Kick players with 0 health
            if (player.health === 0) {

				// Notify other sockets
                GameSocket.connections.forEach(function(conn, index) {
                    // Extract a permaKey if it's set
                    var cookies = conn.headers.cookie;
					var permaKey = undefined;
					if (cookies) {
						permaKey = cookies.split('sessionID=')[1];
					}

					// Check if the player has a permaKey
					if (
						permaKey == player.permaKey ||
						conn.key == player.key ||
						permaKey == player.key ||
						conn.key == player.permaKey
					) {
						conn.close();
					}
                });

				// Delete the playerSaveFile
				Game.deletePlayerSave((player.permaKey || player.key));
            }
        }
    });

    Game.render(Game, changedRC);
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
    if (conn.readyState === 1 || conn.readyState === 2) {
        try { conn.close(); } catch (e) { console.log(e); }
    }
}
