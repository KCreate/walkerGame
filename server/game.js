// Dependencies
var fs              = require('fs');
var protoPlayer     = require('./classes/player.js');
var blockList       = new (require('./classes/blocklist.js'))();
var Crafting        = new (require('./classes/crafting.js'))(blockList)

// Exports
module.exports = function() {
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

        if (modifier) {
            if (this.verbose) {
                console.log(player.name() + " started action: " + control + " with modifier: " + modifier);
            }
        } else {
            if (this.verbose) {
                console.log(player.name() + " started action: " + control);
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
                                this.map.raster
                                    [player.y + bDIF.y]
                                    [player.x + bDIF.x].block.onremove({
                                        x: player.x + bDIF.x,
                                        y: player.y + bDIF.y,
                                        game: this,
                                        player: player,
                                        type: 'remove'
                                    });

                                // Place the block
                                this.map.raster
                                    [player.y + bDIF.y]
                                    [player.x + bDIF.x].block = blockList.getBlock('dirt');

                                // If the block drops, give it to the player
                                if (blockList.getBlock(
                                    player.inventory[player.selectedBlock].block.texture_name
                                ).drops) {


                                    player.changeResource({
                                        block: blockList.getBlock(
                                            player.inventory[player.selectedBlock].block.texture_name
                                        ),
                                        amount: 1
                                    });
                                }

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
                                this.map.raster
                                    [player.y + bDIF.y]
                                    [player.x + bDIF.x].block.onremove({
                                        x: player.x + bDIF.x,
                                        y: player.y + bDIF.y,
                                        game: this,
                                        player: player,
                                        type: 'remove'
                                    });

                                // If the block drops, give it to the player
                                if (blockList.getBlock(
                                    this.map.raster[player.y + bDIF.y][player.x + bDIF.x].block.texture_name
                                ).drops) {

                                    // Collect the block and place it in the inventory of the player
                                    player.changeResource({
                                        block: blockList.getBlock(
                                            this.map.raster[player.y + bDIF.y][player.x + bDIF.x].block.texture_name
                                        ),
                                        amount: 1
                                    });
                                }

                                // Overwrite the field with dirt
                                this.map.raster[player.y + bDIF.y][player.x + bDIF.x].block = blockList.getBlock('dirt');

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
                                    [player.x + bDIF.x].block = blockList.getBlock(
                                        player.inventory[player.selectedBlock].block.texture_name
                                    );

                                    // If it's an infinite block, don't remove from the inventory
                                    if (!blockList.getBlock(
                                        player.inventory[player.selectedBlock].block.texture_name
                                    ).infinite) {

                                        // Remove one of the currently selected blocks
                                        player.changeResource({
                                            block: blockList.getBlock(
                                                player.inventory[player.selectedBlock].block.texture_name
                                            ),
                                            amount: -1
                                        });
                                    }

                                    // Call the onplace handler
                                    this.map.raster
                                        [player.y + bDIF.y]
                                        [player.x + bDIF.x].block.onplace({
                                            x: player.x + bDIF.x,
                                            y: player.y + bDIF.y,
                                            game: this,
                                            player: player,
                                            type: 'place'
                                        });

                                    changedRC.xChanged.push(player.x + bDIF.x);
                                    changedRC.yChanged.push(player.y + bDIF.y);
                                }
                            }
                        }
                    } else {
                        // There is a player at this position

                        // Check if the selected resource is an item
                        if (player.inventory[player.selectedBlock].block.item) {

                            // Interact with the player
                            this.action('interact:'+bDIF.direction, player.key);

                            // If the item is not infinite, remove one
                            if (!blockList.getBlock(
                                player.inventory[player.selectedBlock].block.texture_name
                            ).infinite) {

                                // Remove one of the currently selected blocks
                                player.changeResource({
                                    block: blockList.getBlock(
                                        player.inventory[player.selectedBlock].block.texture_name
                                    ),
                                    amount: -1
                                });
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

                            // Check if the player who started the interaction has an item in his hand
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
                            // If the player has a craftingwand in his hand, use it
                            if (player.inventory[player.selectedBlock].block.item &&
                                player.inventory[player.selectedBlock].block.texture_name == 'craftingwand'
                            ) {
                                // Positions of the blocks
                                var positions = ({
                                    up: [
                                        [-3, -1],
                                        [-3,  0],
                                        [-3,  1],
                                        [-2, -1],
                                        [-2,  0],
                                        [-2,  1],
                                        [-1, -1],
                                        [-1,  0],
                                        [-1,  1]
                                    ],
                                    right: [
                                        [-1,  1],
                                        [-1,  2],
                                        [-1,  3],
                                        [0,   1],
                                        [0,   2],
                                        [0,   3],
                                        [1,   1],
                                        [1,   2],
                                        [1,   3]
                                    ],
                                    down: [
                                        [1, -1],
                                        [1,  0],
                                        [1,  1],
                                        [2, -1],
                                        [2,  0],
                                        [2,  1],
                                        [3, -1],
                                        [3,  0],
                                        [3,  1]
                                    ],
                                    left: [
                                        [-1, -3],
                                        [-1, -2],
                                        [-1, -1],
                                        [0,  -3],
                                        [0,  -2],
                                        [0,  -1],
                                        [1,  -3],
                                        [1,  -2],
                                        [1,  -1]
                                    ]
                                })[modifier];

                                // Get all the blocks
                                var blocks = [];
                                try {
                                    positions.forEach(function(item) {
                                        blocks.push(
                                            this.map.raster[player.y + item[0]][player.x + item[1]].block
                                        );
                                    }.bind(this));
                                } catch (e) {
                                    console.log('Invalid crafting ' + e);
                                }

                                // Debugging
                                if (this.verbose) {
                                    console.log([
                                        [blocks[0].texture_name, blocks[1].texture_name, blocks[2].texture_name].join('-'),
                                        [blocks[3].texture_name, blocks[4].texture_name, blocks[5].texture_name].join('-'),
                                        [blocks[6].texture_name, blocks[7].texture_name, blocks[8].texture_name].join('-')
                                    ].join('\n'));
                                }

                                // Pass it to the craft method
                                var craftingResult = Crafting.craft(blocks.map(function(item) {

                                    var name = item.texture_name;

                                    if (name == 'dirt') {
                                        name = '';
                                    }

                                    return name;

                                }), player);

                                if (craftingResult) {

                                    // Reset all blocks in with dirt
                                    positions.forEach(function(item) {
                                        this.map.raster
                                            [player.y + item[0]]
                                            [player.x + item[1]].block = blockList.getBlock('dirt');

                                        changedRC.xChanged.push(player.x + item[1]);
                                        changedRC.yChanged.push(player.y + item[0]);
                                    }.bind(this));

                                    // Add the resource to the players inventory
                                    player.changeResource({
                                        block: craftingResult.block,
                                        amount: craftingResult.amount
                                    });

                                }

                            } else {

                                // Interact with the block
                                this.map.raster[player.y + bDIF.y][player.x + bDIF.x].block.onreact({
                                    x: player.x + bDIF.x,
                                    y: player.y + bDIF.y,
                                    game: this,
                                    player: player,
                                    type: 'interact'
                                });
                            }
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

                            if (blockList.getBlock(
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
                                                this.map.raster
                                                [player.y + (bDIF.y * 2)]
                                                [player.x + (bDIF.x * 2)].block.onpush({
                                                    x: player.x + (bDIF.x * 2),
                                                    y: player.y + (bDIF.y * 2),
                                                    game: this,
                                                    player: player,
                                                    type: 'push'
                                                });

                                                // Reset old position of pushed block
                                                this.map.raster[
                                                    player.y + (bDIF.y * 1)
                                                ][
                                                    player.x + (bDIF.x * 1)
                                                ].block = blockList.getBlock('dirt');

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
                            if (blockList.getBlock(
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
                                    this.map.raster[player.y][player.x].block.onwalkover({
                                        x: player.x,
                                        y: player.y,
                                        game: this,
                                        player: player,
                                        type: 'walkover'
                                    });
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

        // Remove duplicates from the changedRC object
        changedRC.xChanged = changedRC.xChanged.filter(function(item, index, self){
            return self.indexOf(item) === index;
        });
        changedRC.yChanged = changedRC.yChanged.filter(function(item, index, self){
            return self.indexOf(item) === index;
        });

        // Notify the render method
        if (this.render) {
            this.render(this, changedRC);
        }
    };

    // Render method
    this.render = undefined;

    // Clear the map
    this.clearMap = function(width,height,norender) {
        this.map.width = (width || this.map.width || 20);
        this.map.height = (height || this.map.height || 20);
        this.map.raster = new Array(this.map.width);

        for (var i=0; i < this.map.width; i++) {
            this.map.raster[i] = new Array(this.map.height);
            for (var j=0; j < this.map.height; j++) {
                this.map.raster[i][j] = {
                    block: undefined
                };
                this.map.raster[i][j].block = blockList.getBlock('dirt');
            }
        }

        // Notify the render method
        if (this.render && !norender) {
            this.render(this, false);
        }
    };

    // Load in a new map
    this.loadMap = function(newMap) {

        // Reset the map beforehand
        this.clearMap(newMap.map.width, newMap.map.height, true);

        // Overwrite each block
        for (var iy=0; iy < this.map.height; iy++) {
            for (var ix=0; ix < this.map.width; ix++) {
                this.map.raster[iy][ix].block = blockList.getBlock(
                    newMap.map.raster[iy][ix].block.texture_name
                );
            }
        }

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
        raster: []
    };

    // Unused topographies list
    this.topographies = [];

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

        var slotFound = false;
        for (var i=0; (i<this.playerLimit && !slotFound); i++) {
            if (!this.players[i] && !slotFound) {
                this.players[i] = new protoPlayer(name, i);
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

    // Activates and deactivates console output
    this.verbose = false;
}
