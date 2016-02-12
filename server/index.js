// Third-Party Dependencies
var WebSocket           = require('nodejs-websocket');
var express             = require('express');
var app                 = express();
var fs                  = require('fs');
var Sha1                = require('./classes/sha1.js');

// Game dependencies
var Chat                = new (require('./chat.js'))();
var Game                = new (require('./game.js'))();
var CommandsController  = new (require('./commandscontroller.js'))();

// Some constants
var ControlPort         = 7217;
var GamePort            = 7218;
var ConsolePort         = 7219;
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
            secureClose(conn);
        }
    });
});
// Notify other sockets that a player changed his info
Chat.on('playerInfoChanged', function() {
    
    // De-reference the players
    var players = JSON.parse(JSON.stringify(Game.players));

    // Remove unneccessary stuff
    players = players.map(function(player) {
        if (player) {
            console.log(player);
        }
        return player;
    });
    
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
            secureClose(conn);
        }
    });
});

/*
    Game Controller
*/

// hashed ip adress used to identify players over different websocket connections
app.use(function(req, res, next) {
    // Check if the sessionID cookie is already set   
    try {
        if (!req.headers.cookie) { 
            // Get the remote address
            var hashedKey = Sha1.hash((
                req.headers["X-Forwarded-For"] ||
                req.headers["x-forwarded-for"] ||
                req.client.remoteAddress
            ) + Math.random());
           
            hashedKey = hashedKey.split('').slice(0, Math.floor(hashedKey.length / 2)).join('');

            // Response
            res.cookie('sessionID', hashedKey);
        } else {
            console.log(req.headers.cookie);
        }
    } catch(e) {console.log(e);}
    
    // Call the next middlware
    next();
});
app.use('/c', express.static('./client'));
app.use('/', function(req, res, next) {
    console.log(req.originalUrl);
    if (req.originalUrl == '/') {
        res.redirect('/c');
    } else {
        next();
    }
});
app.get('/api/:data', function(req, res, next) {
    switch(req.params.data) {
        case 'blockdata':
            res.send(JSON.stringify(
                Game.blockList.blockList
            ));
            break;
        default:
    }
    next();
});

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
        return false;
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
        return false;
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
        console.log("line 173: " + err);
        secureClose(conn);
        return false;
    });

}).listen(GamePort);

/*
    Securely close the websocket connection without crashing
*/
function secureClose(conn) {
    if (conn.readyState === 1 || conn.readyState === 2) {
        conn.close();
    }
}

/*
    Game Interaction and Response
*/
Game.clearMap(DefaultMapSize, DefaultMapSize);
Game.verbose = false;

// Notify sockets that the map changed
Game.render = function(game, changedRC) {
    game = JSON.parse(JSON.stringify(game)); // Remove all references

    /*
        If changedRC is set,

        Set all fields that are not mentioned in the changedRC to null
    */
    if (changedRC) {
        // Reduce the topographies size
        var compressed = [
            game.map.raster,
            game.map.topographies
        ].map(function(item) {
            return item.map(function(yrow, iy) {
                yrow = yrow.map(function(xfield, ix) {
                    if (changedRC.xChanged.indexOf(ix) > -1 &&
                        changedRC.yChanged.indexOf(iy) > -1) {
                        return xfield;
                    } else {
                        return 0;
                    }
                });

                var totalzero = yrow.map(function(xfield, ix) {
                    return (xfield === 0);
                }).indexOf(false);

                if (totalzero == -1) {
                    return 0;
                } else {
                    return yrow;
                }
            });
        });

        game.map.raster = compressed[0];
        game.map.topographies = compressed[1];
    }

    GameSocket.connections.forEach(function(conn, index) {
        // Extract a permaKey if it's set
        var cookies = conn.headers.cookie;
		if (cookies) {
			var permaKey = cookies.split('sessionID=')[1];
		}

        // De-reference the game.players array
        var players = JSON.parse(JSON.stringify(game.players));

        // Remove the inventory variable from other players
        players = players.map(function(player) {
            // Check if the item is a player
            if (player) {
                // Check if it's not the current player
                if (player.key != (permaKey || conn.key)) {
                    player.inventory = player.inventory.filter(function(item, index) {
                        return (index == player.selectedBlock);
                    });
                }
            }
            return player;
        });

        try {
            conn.sendText(
                JSON.stringify({
                    game: {
                        key: (permaKey || conn.key)
                    },
                    map: game.map,
                    players: players,
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

    Chat.fireEvent('playerInfoChanged');
}

/*
    Setup the commands controller
*/
CommandsController.setup(Game, Chat, GameSocket);
CommandsController.startRegistering();

/*
    Admin Console
*/
var consoleKey = undefined;
WebSocket.createServer(function(conn) {
    if (!consoleKey) {
        consoleKey = Sha1.hash(
            (Array.apply(null, (new Array(8))).map(function() {
                return Math.random()*64;
            })).join('')
        )
        conn.sendText(consoleKey);
        conn.on('text', function(data) {
            data = JSON.parse(data);
            if (data.key == consoleKey) {

                Chat.write(
                    data.command,
                    Chat.serverUser
                );

            }
        });
        conn.on('close', function() {
            consoleKey = undefined;
        });
    }
}).listen(ConsolePort);
