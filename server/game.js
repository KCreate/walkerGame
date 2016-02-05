// Dependencies
var fs              = require('fs');
var protoPlayer     = require('./classes/player.js');
var blockList       = new (require('./classes/blocklist.js'))();
var Crafting        = new (require('./classes/crafting.js'))(blockList)

// Exports
module.exports = function() {
    this.Crafting = Crafting;
    this.blockList = blockList;

    this.action = function(control, playerName) {

        var modifier = control.split(':')[1];
        control = control.split(':')[0];

        if (!(control == 'up' ||
            control == 'down' ||
            control == 'left' ||
            control == 'right' ||
            control == 'interact' ||
            control == 'select_block')
        ) {
            return false;
        }

        // get the player object
        var player = this.players.filter(function(item) {
            if (item != undefined) {
                if (item.key == playerName) {
                    return item;
                }
            }
        })[0];

        /*
            If the player starts an interact action, redirect
        */
        if (control == 'interact') {
            if (player.inventory[player.selectedBlock].block.item) {
                control = 'use_item';
            } else {
                control = 'place_block';
            }
        }

        if (!player) {
            return false;
        }

        if (this.verbose) {
            if (modifier) {
                console.log(player.name() + " started action: <" + control + "> with modifier: <" + modifier + ">");
            } else {
                console.log(player.name() + " started action: <" + control + ">");
            }
        }

        // This allows the client renderer to only render the rows and columns that have changed.
        // Not setting this correctly will cause ghost tiles
        var changedRC = {
            xChanged: [],
            yChanged:[]
        };

        // Get the block difference here
        var bDIF = ({
            up: {
                x: 0,
                y: -1,
                direction: 'up'
            },
            right: {
                x: 1,
                y: 0,
                direction: 'right'
            },
            down: {
                x: 0,
                y: 1,
                direction: 'down'
            },
            left: {
                x: -1,
                y: 0,
                direction: 'left'
            }
        })[modifier];

        switch (control) {
            case 'place_block':

                // Check variable
                var insideMap = false;

                // Check if the position is still inside the map
                if (this.map.raster[player.y + bDIF.y]) {
                    if (this.map.raster[player.y + bDIF.y][player.x + bDIF.x]) {
                        insideMap = true;
                    }
                }

                if (insideMap) {

                    // Check if the spot is truly empty, also no player
                    var playersHere = this.players.filter(function(item) {
                        if (item) {
                            if (
                                item.x == player.x + (bDIF.x) &&
                                item.y == player.y + (bDIF.y)) {
                                return true;
                            }
                        }
                    });

                    if (playersHere.length == 0) {

                        if (this.map.raster[player.y + bDIF.y][player.x + bDIF.x].block.texture_name
                            ==
                            player.inventory[player.selectedBlock].block.texture_name) {
                            // This assumes the field is the one currently selected

                            // Check if the block is only breakable by an admin
                            var allowsBreaking = true;
                            if (this.map.raster
                                [player.y + bDIF.y]
                                [player.x + bDIF.x].block.onlyadminbreakable) {
                                if (!player.admin) {
                                    allowsBreaking = false;
                                }
                            }

                            if (allowsBreaking) {
                                // Call the onremove handler
                                var tmpChangedRC = this.map.raster
                                    [player.y + bDIF.y]
                                    [player.x + bDIF.x].block.onremove({
                                        x: player.x + bDIF.x,
                                        y: player.y + bDIF.y,
                                        game: this,
                                        player: player,
                                        type: 'remove'
                                    });

                                changedRC.xChanged.push(tmpChangedRC.xChanged);
                                changedRC.yChanged.push(tmpChangedRC.yChanged);

                                // Place the a dirt block
                                this.map.raster
                                    [player.y + bDIF.y]
                                    [player.x + bDIF.x].block = this.blockList.getBlock('dirt');

                                // Call the onplace handler of the dirt block
                                var tmpChangedRC = this.map.raster
                                    [player.y + bDIF.y]
                                    [player.x + bDIF.x].block.onplace({
                                        x: player.x,
                                        y: player.y,
                                        game: this,
                                        player: player,
                                        type: 'place'
                                    });

                                changedRC.xChanged.push(tmpChangedRC.xChanged);
                                changedRC.yChanged.push(tmpChangedRC.yChanged);

                                // If the block drops, give it to the player
                                if (this.blockList.getBlock(
                                    player.inventory[player.selectedBlock].block.texture_name
                                ).drops) {

                                    // Place it in the players inventory
                                    player.changeResource({
                                        block: this.blockList.getBlock(
                                            player.inventory[player.selectedBlock].block.texture_name
                                        ),
                                        amount: 1
                                    });
                                }

                                // Update the changedRC object
                                changedRC.xChanged.push(player.x + bDIF.x);
                                changedRC.yChanged.push(player.y + bDIF.y);
                            }

                        } else if (this.map.raster[player.y + bDIF.y][player.x + bDIF.x].block.texture_name !== 'dirt') {
                            /*
                                This assumes the field is not a dirt block,
                                but also not the currently selected one
                            */

                            // Check if the block is only breakable by an admin
                            var allowsBreaking = true;
                            if (this.map.raster
                                [player.y + bDIF.y]
                                [player.x + bDIF.x].block.onlyadminbreakable) {
                                if (!player.admin) {
                                    allowsBreaking = false;
                                }
                            }

                            if (allowsBreaking) {
                                // Call the onremove handler
                                var tmpChangedRC = this.map.raster
                                    [player.y + bDIF.y]
                                    [player.x + bDIF.x].block.onremove({
                                        x: player.x + bDIF.x,
                                        y: player.y + bDIF.y,
                                        game: this,
                                        player: player,
                                        type: 'remove'
                                    });

                                changedRC.xChanged.push(tmpChangedRC.xChanged);
                                changedRC.yChanged.push(tmpChangedRC.yChanged);

                                // If the block drops, give it to the player
                                if (this.blockList.getBlock(
                                    this.map.raster[player.y + bDIF.y][player.x + bDIF.x].block.texture_name
                                ).drops) {

                                    // Collect the block and place it in the inventory of the player
                                    player.changeResource({
                                        block: this.blockList.getBlock(
                                            this.map.raster[player.y + bDIF.y][player.x + bDIF.x].block.texture_name
                                        ),
                                        amount: 1
                                    });
                                }

                                // Overwrite the field with dirt
                                this.map.raster
                                    [player.y + bDIF.y]
                                    [player.x + bDIF.x].block = this.blockList.getBlock('dirt');

                                // onplace handler of the block
                                var tmpChangedRC = this.map.raster
                                    [player.y + bDIF.y]
                                    [player.x + bDIF.x].block.onplace({
                                        x: player.x,
                                        y: player.y,
                                        game: this,
                                        player: player,
                                        type: 'place'
                                    });

                                changedRC.xChanged.push(tmpChangedRC.xChanged);
                                changedRC.yChanged.push(tmpChangedRC.yChanged);

                                // update the changedRC object
                                changedRC.xChanged.push(player.x + bDIF.x);
                                changedRC.yChanged.push(player.y + bDIF.y);
                            }

                        } else {
                            // This assumes the field in question is a dirt block

                            // Check if the player has enough of the required resource
                            if (player.inventory[player.selectedBlock].amount > 0) {

                                // Check if the resource is not an item
                                if (!player.inventory[player.selectedBlock].block.item) {
                                    // Place the currently selected block

                                    this.map.raster
                                    [player.y + bDIF.y]
                                    [player.x + bDIF.x].block = this.blockList.getBlock(
                                        player.inventory[player.selectedBlock].block.texture_name
                                    );

                                    // If it's an infinite block, don't remove from the inventory
                                    if (!this.blockList.getBlock(
                                        player.inventory[player.selectedBlock].block.texture_name
                                    ).infinite) {

                                        // Remove one of the currently selected blocks
                                        player.changeResource({
                                            block: this.blockList.getBlock(
                                                player.inventory[player.selectedBlock].block.texture_name
                                            ),
                                            amount: -1
                                        });
                                    }

                                    // Call the onplace handler
                                    var tmpChangedRC = this.map.raster
                                        [player.y + bDIF.y]
                                        [player.x + bDIF.x].block.onplace({
                                            x: player.x + bDIF.x,
                                            y: player.y + bDIF.y,
                                            game: this,
                                            player: player,
                                            type: 'place'
                                        });

                                    changedRC.xChanged.push(tmpChangedRC.xChanged);
                                    changedRC.yChanged.push(tmpChangedRC.yChanged);

                                    changedRC.xChanged.push(player.x + bDIF.x);
                                    changedRC.yChanged.push(player.y + bDIF.y);
                                }
                            }
                        }
                    }
                }

                break;
            case 'select_block':
                player.selectBlock(modifier);
                break;
            case 'use_item':

                // Check if the position is inside the map
                if (this.map.raster[player.y + bDIF.y]) {
                    if (this.map.raster[player.y + bDIF.y][player.x + bDIF.x]) {

                        // Check if there is a player on this position
                        var playersHere = this.players.filter(function(item) {
                            if (item) {
                                if (
                                    item.x == player.x + bDIF.x &&
                                    item.y == player.y + bDIF.y) {
                                    return true;
                                }
                            }
                        });

                        /*
                            If a player stands on top of a block with an interaction,
                            he will block other players from interacting with that block
                        */
                        if (playersHere.length > 0) {

                            var damageDealt = 0;

                            // Get the damage the item deals
                            if (player.inventory[player.selectedBlock].block.item) {
                                if (player.inventory[player.selectedBlock].block.health_effects) {
                                    if (player.inventory[player.selectedBlock].block.health_effects.playerDamage) {
                                        damageDealt = player.inventory[player.selectedBlock].block.health_effects.playerDamage;
                                    }
                                }
                            }

                            // Cooldown logic
                            if ((Date.now() - player.joinedAt) >= this.damageCooldown) {

                                // Hit the player
                                playersHere.forEach(function(item) {
                                    if (item) {
                                        item.impactHealth(-damageDealt);
                                    }
                                });

                            } else {
                                player.impactHealth(-0.5);
                            }
                        } else {
                            /*
                                If the player has an item in his hand, call the onreact handler
                                Pass it an extra argument called 'direction' that indicates in which direction the action,
                                is pointing

                                The direction value could just be calculated by the onreact function,
                                but since we have that value already, we'll just pass it here for simplicity reasons
                            */

                            if (player.inventory[player.selectedBlock].block.item) {
                                var tmpChangedRC = player.inventory[player.selectedBlock].block.onreact({
                                    x: player.x + bDIF.x,
                                    y: player.y + bDIF.y,
                                    direction: modifier,
                                    game: this,
                                    player: player,
                                    type: 'react'
                                });
                            } else {

                                // Interact with the block
                                var tmpChangedRC = this.map.raster[player.y + bDIF.y][player.x + bDIF.x].block.onreact({
                                    x: player.x + bDIF.x,
                                    y: player.y + bDIF.y,
                                    game: this,
                                    player: player,
                                    type: 'interact'
                                });
                            }

                            changedRC.xChanged.push(tmpChangedRC.xChanged);
                            changedRC.yChanged.push(tmpChangedRC.yChanged);
                        }
                    }
                }

                break;
            default:

                // Get the block difference here
                var bDIF = ({
                    up: {
                        x: 0,
                        y: -1
                    },
                    right: {
                        x: 1,
                        y: 0
                    },
                    down: {
                        x: 0,
                        y: 1
                    },
                    left: {
                        x: -1,
                        y: 0
                    }
                })[control];


                // Check for a valid bDIF object
                if (bDIF) {
                    // Check for width map edge collisions
                    if (!(player.y + bDIF.y < 0 || player.y + bDIF.y == this.map.height)) {

                        // Check for height map edge collisions
                        if (!(player.x + bDIF.x < 0 || player.x + bDIF.x == this.map.width)) {

                            // Push detection on radius 1

                            if (this.blockList.getBlock(
                                this.map.raster[
                                    player.y + bDIF.y
                                ][
                                    player.x + bDIF.x
                                ].block.texture_name
                            ).pushable) {

                                // Check if radius 2 on y axis is not out of map
                                if (this.map.raster[player.y + (bDIF.y * 2)]) {

                                    // Check if radius 2 on x axis is not out of map
                                    if (this.map.raster[player.y + (bDIF.y *2)][player.x + (bDIF.x *2)]) {
                                        // Push detection on radius 2
                                        if (this.map.raster[player.y + (bDIF.y * 2)][player.x + (bDIF.x * 2)].block.texture_name == 'dirt') {

                                            // Check if the spot is truly empty, also no player
                                            var playersHere = this.players.filter(function(item) {
                                                if (item) {
                                                    if (
                                                        item.x == player.x + (bDIF.x * 2) &&
                                                        item.y == player.y + (bDIF.y * 2)) {
                                                        return true;
                                                    }
                                                }
                                            });

                                            // Only push the block if no player is obsutructing the path
                                            if (playersHere.length == 0) {
                                                // Block push logic
                                                this.map.raster
                                                [player.y + (bDIF.y * 2)]
                                                [player.x + (bDIF.x * 2)].block =
                                                this.map.raster
                                                [player.y + (bDIF.y * 1)]
                                                [player.x + (bDIF.x * 1)].block

                                                // Call onpush method
                                                var tmpChangedRC = this.map.raster
                                                [player.y + (bDIF.y * 2)]
                                                [player.x + (bDIF.x * 2)].block.onpush({
                                                    x: player.x + (bDIF.x * 2),
                                                    y: player.y + (bDIF.y * 2),
                                                    game: this,
                                                    player: player,
                                                    type: 'push'
                                                });

                                                changedRC.xChanged.push(tmpChangedRC.xChanged);
                                                changedRC.yChanged.push(tmpChangedRC.yChanged);

                                                // Reset old position of pushed block
                                                this.map.raster
                                                [player.y + (bDIF.y * 1)]
                                                [player.x + (bDIF.x * 1)].block = this.blockList.getBlock('dirt');

                                                // Update the changed rows and columns object
                                                if (!!(bDIF.y)) {
                                                    changedRC.yChanged.push(player.y + (bDIF.y * 2));
                                                }

                                                if (!!(bDIF.x)) {
                                                    changedRC.xChanged.push(player.x + (bDIF.x * 2));
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            // Traversable block detection
                            if (this.blockList.getBlock(
                                this.map.raster[
                                    player.y + (bDIF.y * 1)
                                ][
                                    player.x + (bDIF.x * 1)
                                ].block.texture_name
                            ).traversable) {
                                // Move the player in the desired direction
                                if (!!(bDIF.y)) {
                                    player.y = player.y + (bDIF.y);
                                }

                                if (!!(bDIF.x)) {
                                    player.x = player.x + (bDIF.x);
                                }

                                if (this.map.raster[player.y][player.x].block.texture_name !== 'dirt') {
                                    var tmpChangedRC = this.map.raster[player.y][player.x].block.onwalkover({
                                        x: player.x,
                                        y: player.y,
                                        game: this,
                                        player: player,
                                        type: 'walkover'
                                    });

                                    changedRC.xChanged.push(tmpChangedRC.xChanged);
                                    changedRC.yChanged.push(tmpChangedRC.yChanged);
                                }

                                // Update the changed rows and columns object
                                if (!!(bDIF.y)) {
                                    changedRC.yChanged.push(player.y - (bDIF.y * 1));
                                    changedRC.yChanged.push(player.y);
                                    changedRC.xChanged.push(player.x);
                                }

                                if (!!(bDIF.x)) {
                                    changedRC.xChanged.push(player.x - (bDIF.x * 1));
                                    changedRC.xChanged.push(player.x);
                                    changedRC.yChanged.push(player.y);
                                }
                            }
                        }
                    }
                }
                break;
        }

        // Flatten the array as far as possible
        changedRC.xChanged = [].concat.apply([], changedRC.xChanged);
        changedRC.yChanged = [].concat.apply([], changedRC.yChanged);

        // Remove duplicates from the changedRC object
        changedRC.xChanged = changedRC.xChanged.filter(function(item, index, self) {
            return self.indexOf(item) === index;
        });
        changedRC.yChanged = changedRC.yChanged.filter(function(item, index, self) {
            return self.indexOf(item) === index;
        });

        // Notify the render method
        if (changedRC.xChanged.length > 0 || changedRC.yChanged.length) {
            if (this.render) {
                this.render(this, changedRC);
            }
        }
    };

    // Render method
    this.render = undefined;

    // Clear the map
    this.clearMap = function(width,height,norender) {
        this.map.width          = (width || this.map.width || 20);
        this.map.height         = (height || this.map.height || 20);
        this.map.raster         = new Array(this.map.width);
        this.map.topographies   = new Array(this.map.width);

        for (var i=0; i < this.map.width; i++) {
            this.map.raster[i]          = new Array(this.map.height);
            this.map.topographies[i]    = new Array(this.map.height);
            for (var j=0; j < this.map.height; j++) {

                // Init the map
                this.map.raster[i][j] = {
                    block: this.blockList.getBlock('dirt')
                };

                // Init topographies
                this.map.topographies[i][j] = {
                    block: undefined
                }
            }
        }

        // Notify the render method
        if (this.render && !norender) {
            this.render(this, false);
        }
    };

    // Load in a new map
    this.loadMap = function(gameSave) {

        // Reset the map beforehand
        this.clearMap(gameSave.map.width, gameSave.map.height, true);

        // Overwrite each block
        for (var iy=0; iy < this.map.height; iy++) {
            for (var ix=0; ix < this.map.width; ix++) {
                this.map.raster[iy][ix].block = this.blockList.getBlock(
                    gameSave.map.raster[iy][ix].block.texture_name
                );
            }
        }

        // Iterate over the saved players
        gameSave.players.forEach(function(savedPlayer) {

            // Check if the savedplayer is in the current game
            var player = this.playerForKey(savedPlayer.key);
            if (player) {
                // Swap the player states
                player = this.swapPlayerSave(savedPlayer, player);

                // Update the save file
                this.savePlayerState(player);

                // Call the onchange handler
                player.onchange(player);
            }
        }.bind(this));

        // Render
        if (this.render) {
            this.render(this, false);
        }
    }

    // Stores the map
    this.map = {
        width: 0,
        height: 0,
        tileDimension: 16,
        raster: [],
        topographies: []
    };

    // The damage cooldown before a player can be hit
    this.damageCooldown = 4000;

    // Some stuff related to players
    this.players = [];
    this.playerLimit = 8;
    this.playersChanged = undefined;

    // Return the player from a given key
    this.playerForKey = function(key) {
        return this.players.filter(function(player) {
            if (player) {
                if (player.key == key) {
                    return player;
                }
            }
        })[0];
    }

    // Register a player to the game
    this.registerPlayer = function(name) {

        // Check if no player with the same name already exists
        var alreadyRegistered = this.players.map(function(player) {
            if (player) {
                return (player.permaKey == name ||
                        player.key == name);
            } else {
                return false;
            }

        }).indexOf(true) != -1;

        if (alreadyRegistered) {
            return false;
        }

        var slotFound = false;
        for (var i=0; (i<this.playerLimit && !slotFound); i++) {
            if (!this.players[i] && !slotFound) {
                this.players[i] = new protoPlayer(name, i);

                // Check if there is a save file, swap if it exists
                var saveFile = this.retrievePlayerState(name);
                if (saveFile) {
                    this.players[i] = this.swapPlayerSave(saveFile, this.players[i]);
                }

                console.log(this.players[i]);

                this.players[i].onchange = function(player) {
                    if (this.playersChanged) {
                        this.playersChanged(this.players);
                    }
                }.bind(this);

                slotFound = true;

                if (this.verbose) {
                    console.log('User connected to game controller with id '+name);
                }
            }
        }
        if (slotFound) {
            if (this.render) {
                this.render(this, false);
            }

            if (this.playersChanged) {
                this.playersChanged(this.players);
            }

            return true;
        } else {
            return false;
        }
    }

    // Unregister a player from the game
    this.unregisterPlayer = function(name) {

        var playerRemoved = false;
        for (var i=0; (i<this.playerLimit && !playerRemoved); i++) {
            if (this.players[i] != undefined) {
                if (this.players[i].key == name && !playerRemoved) {

                    // Save the state of the player as a file
                    this.savePlayerState(this.players[i]);

                    // Remove it from memory
                    this.players[i] = undefined;
                    playerRemoved = true;

                    if (this.verbose) {
                        console.log('User disconnected to game controller with id '+name);
                    }
                }
            }
        }

        if (playerRemoved) {
            if (this.render) {
                this.render(this, false);
            }

            if (this.playersChanged) {
                this.playersChanged(this.players);
            }
        }
    }

    // Save the state of the player to the players directory
    this.savePlayerState = function(player) {
        if (player) {
            fs.writeFileSync(
                './server/players/'+player.key+'.json',
                JSON.stringify(player),
                'utf8'
            );
        }
    }

    // Load the state of a player, returns undefined if not found
    this.retrievePlayerState = function(key) {
        // Check if there is a json file for the current player
        var possibleSaveFileLocation = './server/players/'+key+'.json';
        if (fs.existsSync(
            possibleSaveFileLocation
        )) {

            // A save file exists for the player, try to restore
            var saveFile = fs.readFileSync(
                possibleSaveFileLocation,
                'utf8'
            );
            saveFile = JSON.parse(saveFile);

            return saveFile;
        } else {
            return undefined;
        }
    }

    // Swap the contents of a player save with the one currently in memory
    this.swapPlayerSave = function(playerSave, player) {

        if (player) {
            // Simply copy
            player.x = playerSave.x;
            player.y = playerSave.y;
            player.nickname = playerSave.nickname;
            player.admin = playerSave.admin;
            player.health = playerSave.health;
            player.selectedBlock = playerSave.selectedBlock;
            player.masked = playerSave.masked;

            // We need to carry the inventory over differently, because of the blockactions
            player.inventory = [];
            playerSave.inventory.forEach(function(item) {
                player.inventory.push({
                    block: this.blockList.getBlock(
                        item.block.texture_name
                    ),
                    amount: item.amount
                });
            }.bind(this));
        }

        return player;
    }

    // Delete the save file of a specific player
    this.deletePlayerSave = function(key) {
        var location = "./server/players/";
        var ending = "json";
        var path = location + key + "." + ending;

        if (
            fs.existsSync(path)
        ) {
            if (this.verbose) {
                console.log('deleting player save file: ' + key);
            }
            fs.unlinkSync(path);
            return true;
        } else {
            return false;
        }
    }

    // Activates and deactivates console output
    this.verbose = false;
}
