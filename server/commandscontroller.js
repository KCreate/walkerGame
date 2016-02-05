var Sha1            = require('./classes/sha1.js'); // Used for password hashing
var blockList       = new (require('./classes/blocklist.js'))()
var fs              = require('fs');

module.exports = function() {

    /*
        Some commands require access to the game,
        to the chat and to the websocket.
    */
    this.setup = function(game, chat, websocket) {

        // Check if all required properties are set
        if (!(game && chat && websocket)) {
            return false;
        }

        this.game       = game;
        this.chat       = chat;
        this.websocket  = websocket;
    }

    /*
        Tell the CommandsController to start registering commands
    */
    this.startRegistering = function() {

        /*
            This comment has the purpose of documenting,
            how a command should be registered correctly.

            Every command consists of 3 main sections
                - Error checking
                - Data validation
                - Main action

            Error checking is the same everywhere
            If the commands api returns an error, it will always happen
            through the data object. Always check for a 'err' property.
            Just check for it, and log it if it exists.

            Data Validation is custom to every command. If a command doesn't require,
            any arguments, just ignore this.

            Main action is the place where you check for permissions and
            change stuff in the game and chat accordingly.
        */

        /*
            /kick

            Requires admin permissions
            Takes a key of a player
        */
        this.chat.commands.regCommand('kick', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            /*
                Data Validation
                24 is the default length of a websocket connection key
            */
            if (data.arguments == '') {
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'Invalid key'
                    }, player)
                }];
            }

            // Main action
            var playerGotKicked = false;
            if (player.admin) {
                this.websocket.connections.forEach(function(conn) {

                    // Check if the keys are equal
                    console.log(conn.key, data.arguments);
                    if (conn.key === data.arguments) {

                        // Only kick, if the player isn't an admin
                        if (!this.game.playerForKey(data.arguments).admin) {
                            conn.close();
                            playerGotKicked = true;
                        }
                    }
                }.bind(this));
            } else {
                return [false, {
                    message: this.templates('missing_permissions', {
                        command: data.command
                    }, player)
                }];
            }

            if (playerGotKicked) {
                return [true, {
                    message: this.templates('success', {
                        command: data.command,
                        message: player.name() + ' kicked ' + data.arguments
                    }, player)
                }];
            } else {
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'Player not found'
                    }, player)
                }];
            }

        }.bind(this));

        /*
            /clearmap

            Requires admin permissions

            Clears the map and sets all blocks to dirt
        */
        this.chat.commands.regCommand('clearmap', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            // Main action
            if (player.admin) {
                this.game.clearMap();

                return [true, {
                    message: this.templates('success', {
                        command: data.command,
                        message: player.name() + ' cleared the map'
                    }, player)
                }];
            } else {
                return [false, {
                    message: this.templates('missing_permissions', {
                        command: data.command
                    }, player)
                }];
            }
        }.bind(this));

        /*
            /nick

            Name can't be longer than 20 characters, and all whitespaces will be removed

            Gives a player a nickname that will be visible in the chat and the playerlist
        */
        this.chat.commands.regCommand('nick', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            // Remove all whitespace before validation
            data.arguments = data.arguments.split(' ').join('');
            data.arguments = data.arguments.split('\t').join('');
            data.arguments = data.arguments.split('\r').join('');
            data.arguments = data.arguments.split('\n').join('');

            // Data validation
            if (data.arguments === '' || data.arguments.length > 20 || data.arguments == 'SERVER') {
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'Unallowed or misformatted text'
                    }, player)
                }];
            }

            // Main action
            var originalName = player.name();
            player.nickname = data.arguments;

            // Notify all subscribers that a player has changed
            this.chat.fireEvent('playerInfoChanged');

            // Return the success message
            return [true, {
                message: this.templates('success', {
                    command: data.command,
                    message: originalName + ' changed his name to: ' + data.arguments
                }, player)
            }];
        }.bind(this));

        /*
            /admin

            Requires a password

            Toggles a players admin permissions
        */
        this.chat.commands.regCommand('admin', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            // Data validation will be skipped for this command
            var passwordHash = '9aa10edeac871621c02f493b2b0c927b4b10567b';
            var computedHash = Sha1.hash(data.arguments);

            if (computedHash === passwordHash) {
                player.admin = !player.admin; // This toggles the admin state

                this.chat.fireEvent('playerInfoChanged');

                return [true, {
                    message: this.templates('success', {
                        command: data.command,
                        message: player.name() + ' toggled his own admin state'
                    }, player)
                }];
            } else {
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'Incorrect password'
                    }, player)
                }];
            }
        }.bind(this));

        /*
            /give

            Requires admin permissions

            Gives the player a defined ammount of a resource
        */
        this.chat.commands.regCommand('give', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            // Data validation
            if (data.arguments === '') {
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'This command requires two arguments: blockname & amount'
                    }, player)
                }];
            }

            // Main action
            if (player.admin) {

                // Extract the blockname and amount
                var argumentParts = data.arguments.split(' ');
                var block_name = argumentParts[0];
                var amount = argumentParts[1];

                if (blockList.getBlock(block_name)) {
                    // Add the resource to the player
                    player.changeResource({
                        block: blockList.getBlock(block_name),
                        amount
                    });

                    return [true, {
                        message: this.templates('success', {
                            command: data.command,
                            message: player.name() + ' was given ' + amount + ' of ' + block_name
                        }, player)
                    }];
                } else {
                    return [false, {
                        message: this.templates('misc_error', {
                            command: data.command,
                            message: 'No block found with this name'
                        }, player)
                    }];
                }
            } else {
                return [false, {
                    message: this.templates('missing_permissions', {
                        command: data.command
                    }, player)
                }];
            }
        }.bind(this));

        /*
            /giveplayer

            Requires admin permissions

            Same as the give command but to another player
        */
        this.chat.commands.regCommand('giveplayer', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            // Data validation
            if (data.arguments === '') {
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'This command requires three arguments: blockname & amount & playerKey'
                    }, player)
                }];
            }

            // Main action
            if (player.admin) {

                // Extract the blockname and amount
                var argumentParts = data.arguments.split(' ');
                var block_name = argumentParts[0];
                var amount = argumentParts[1];
                var playerKey = argumentParts[2];

                if (blockList.getBlock(block_name)) {

                    // Check if the player exists
                    if (this.game.playerForKey(playerKey)) {
                        // Add the resource to the player
                        this.game.playerForKey(playerKey).changeResource({
                            block: blockList.getBlock(block_name),
                            amount
                        });

                        return [true, {
                            message: this.templates('success', {
                                command: data.command,
                                message: this.game.playerForKey(playerKey).name() + ' was given ' + amount + ' of ' + block_name
                            }, player)
                        }];
                    } else {
                        return [false, {
                            message: this.templates('misc_error', {
                                command: data.command,
                                message: 'No player found with this key'
                            }, player)
                        }];
                    }

                } else {
                    return [false, {
                        message: this.templates('misc_error', {
                            command: data.command,
                            message: 'No block found with this name'
                        }, player)
                    }];
                }
            } else {
                return [false, {
                    message: this.templates('missing_permissions', {
                        command: data.command
                    }, player)
                }];
            }
        }.bind(this));

        /*
            /say

            Requires admin permission

            Writes to the server console using the SERVER player
        */
        this.chat.commands.regCommand('say', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            // Data validation
            if (data.arguments === '') {
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'You need to pass a text'
                    }, player)
                }];
            }

            // Main action
            if (player.admin) {

                // Write as server
                this.chat.serverWrite(JSON.stringify(data.arguments).split('"').join(''));

                return [true, {
                    message: false
                }];

            } else {
                return [false, {
                    message: this.templates('missing_permissions', {
                        command: data.command
                    }, player)
                }];
            }
        }.bind(this));

        /*
            /tpa

            Requires admin permissions

            Teleport to a given position
        */
        this.chat.commands.regCommand('tpa', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            // Data validation
            if (data.arguments === '') {
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'This command requires two arguments: X-Coordinate & Y-Coordinate'
                    }, player)
                }];
            }

            // Main action
            if (player.admin) {

                // Extract the blockname and amount
                var argumentParts = data.arguments.split(' ');
                var xcord = parseInt(argumentParts[0]);
                var ycord = parseInt(argumentParts[1]);

                // Validate numbers
                if (typeof xcord !== 'number' || typeof ycord !== 'number') {
                    return [false, {
                        message: this.templates('misc_error', {
                            command: data.command,
                            message: 'Invalid arguments passed'
                        }, player)
                    }];
                }

                // Check if the block exists
                if (this.game.map.raster[ycord]) {
                    if (this.game.map.raster[ycord][xcord]) {

                        // Check if the block is dirt or traversable
                        if (this.game.map.raster[ycord][xcord].block.texture_name == 'dirt' ||
                            this.game.map.raster[ycord][xcord].block.traversable) {

                            // Keep track of all changed blocks
                            var changedRC = {
                                xChanged: [],
                                yChanged: []
                            };

                            changedRC.xChanged.push(player.x);
                            changedRC.yChanged.push(player.y);
                            changedRC.xChanged.push(xcord);
                            changedRC.yChanged.push(ycord);

                            // Teleport the player
                            player.x = xcord;
                            player.y = ycord;

                            // Call the render method
                            if (this.game.render) {
                                this.game.render(this.game, changedRC);
                            }

                            return [true, {
                                message: this.templates('success', {
                                    command: data.command,
                                    message: player.name() + ' teleported himself'
                                }, player)
                            }];
                        } else {
                            return [false, {
                                message: this.templates('misc_error', {
                                    command: data.command,
                                    message: 'Coordinates are obstructed'
                                }, player)
                            }];
                        }
                    }
                }

                // Response if both block validations fail
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'These coordinates are out of map'
                    }, player)
                }];
            } else {
                return [false, {
                    message: this.templates('missing_permissions', {
                        command: data.command
                    }, player)
                }];
            }
        }.bind(this));

        /*
            /saveworld

            Requires admin permissions

            Saves the current map into the ./server/worlds/ folder
        */
        this.chat.commands.regCommand('saveworld', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            // Data validation
            if (data.arguments === '') {
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'This command requires one argument: savename'
                    }, player)
                }];
            }

            // Main action
            if (player.admin) {

                // Write the file
                var filename = "./server/worlds/" + arguments[0].arguments.split('.').join('') + ".json";
                fs.writeFileSync(filename, JSON.stringify(this.game), 'utf8');

                // Successfully saved the file
                return [true, {
                    message: this.templates('success', {
                        command: data.command,
                        message: player.name() + ' successfully saved the world with name: ' + data.arguments
                    }, player)
                }];

                // Response if the savename already exists
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'A world with this name already exists'
                    }, player)
                }];
            } else {
                return [false, {
                    message: this.templates('missing_permissions', {
                        command: data.command
                    }, player)
                }];
            }
        }.bind(this));

        /*
            /loadworld

            Requires admin permissions

            Overwrites all current progress and loads the savedata from another file into the game
            Players may loose their inventory
        */
        this.chat.commands.regCommand('loadworld', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            // Data validation
            if (data.arguments === '') {
                return [false, {
                    message: this.templates('misc_error', {
                        command: data.command,
                        message: 'This command requires one argument: savename'
                    }, player)
                }];
            }

            // Main action
            if (player.admin) {

                // Load the file
                var filename = "./server/worlds/" + arguments[0].arguments.split('.').join('') + ".json";

                // Load the save
                if (fs.existsSync(filename)) {
                    var file = fs.readFileSync(filename, 'utf8');
                        file = JSON.parse(file);

                    // Load a new map
                    this.game.loadMap(file);
                } else {
                    // Response if the savename already exists
                    return [false, {
                        message: this.templates('misc_error', {
                            command: data.command,
                            message: 'A world with this name was not found'
                        }, player)
                    }];
                }


                // Successfully saved the file
                return [true, {
                    message: this.templates('success', {
                        command: data.command,
                        message: player.name() + ' successfully loaded the world with name: ' + data.arguments
                    }, player)
                }];
            } else {
                return [false, {
                    message: this.templates('missing_permissions', {
                        command: data.command
                    }, player)
                }];
            }
        }.bind(this));

        /*
            /help

            Returns a list of all available commands
        */
        this.chat.commands.regCommand('help', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            // Get a list of all commands
            var list = Object.keys(
                this.chat.commands.availableCommands
            ).join(', ');

            // Main action
            return [true, {
                message: this.templates('success', {
                    command: data.command,
                    message: 'Available commands: \n' + list
                }, player)
            }];
        }.bind(this));

        /*
            /mask

            Toggles the mask property on a player
        */
        this.chat.commands.regCommand('mask', function(data, player) {
            // Error checking
            if (data.err) {
                console.log(data.err);
                return [false, {
                    message: this.templates('server_error', {
                        command: data.command
                    }, player)
                }];
            }

            // Toggle the mask property
            player.mask = !player.mask;

            // Main action
            return [true, {
                message: false
            }];
        }.bind(this));
    }

    // Default response message templates
    this.templates = function(status, data, player) {
        switch (status) {
            case 'server_error':

                return (
                    player.name() + ' caused an internal server error while trying to run command:' + data.command);

                break;
            case 'missing_permissions':

                return (
                    player.name() + ' failed to run command: ' + data.command + '\n' +
                    'Missing permissions');

                break;
            case 'misc_error':

                return (
                    player.name() + ' failed to run command: ' + data.command + '\n' +
                    data.message );

                break;
            case 'success':

                return (data.message);
                break;
            default:

        }
    }

    this.game       = undefined;
    this.chat       = undefined;
    this.websocket   = undefined;
}
