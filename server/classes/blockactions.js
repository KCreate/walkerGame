// Dependencies

module.exports = function() {

    // Returns a function that acts as a specific action for a block
    this.getAction = function(options) {
        // changedRC
        var changedRC = {
            xChanged: [],
            yChanged: []
        };

        switch (options.block.texture_name) {
            case 'door':
                switch (options.type) {
                    case 'react':
                        return (function(options) {

                            if (options.block.metadata) {
                                // Toggle the open and traversable variable
                                options.block.metadata.open = !options.block.metadata.open;

                                // Toggle the texture_id
                                if (options.block.metadata.open) {
                                    options.block.texture_id = options.block.metadata.opentexture;
                                    options.block.traversable = true;
                                } else {
                                    options.block.texture_id = options.block.metadata.closetexture;
                                    options.block.traversable = false;
                                }
                            }

                            // Update changedRC
                            changedRC.xChanged.push(options.x);
                            changedRC.yChanged.push(options.y);

                            return changedRC;
                        });
                        break;
                    case 'place':
                        return (function(options) {

                            options.block.metadata.open = false;

                            return changedRC;
                        });
                        break;
                    default:

                }
                break;
            case 'goldblock':
                switch (options.type) {
                    case 'walkover':
                        return (function(options) {
                            options.player.impactHealth(10);

                            return changedRC;
                        });
                        break;
                    default:

                }
                break;
            case 'tnt':
                switch (options.type) {
                    case 'place':
                        return (function(options) {

                            /*
                                Destroy all blocks in this pattern
                                X X X
                                X T X
                                X X X
                            */

                            var bombDelay = 2000;
                            setTimeout(function() {
                                if (options.game.map.raster[options.y][options.x].block.texture_name == 'tnt') {
                                    // Get all valid blocks
                                    for (var i=0; i<8; i++) {

                                        // Get the block difference here
                                        var bDIF = ([
                                            {
                                                x: -1,
                                                y: -1
                                            },
                                            {
                                                x: 0,
                                                y: -1
                                            },
                                            {
                                                x: 1,
                                                y: -1
                                            },
                                            {
                                                x: -1,
                                                y: 0
                                            },
                                            {
                                                x: 1,
                                                y: 0
                                            },
                                            {
                                                x: -1,
                                                y: 1
                                            },
                                            {
                                                x: 0,
                                                y: 1
                                            },
                                            {
                                                x: 1,
                                                y: 1
                                            }
                                        ])[i];

                                        // Check if the position is inside the map
                                        if (options.game.map.raster[options.y + bDIF.y]) {
                                            if (options.game.map.raster[options.y + bDIF.y][options.x + bDIF.x]) {

                                                // Check if there is a player on this position
                                                var playersHere = options.game.players.filter(function(item) {
                                                    if (item) {
                                                        if (
                                                            item.x == options.x + bDIF.x &&
                                                            item.y == options.y + bDIF.y) {
                                                            return true;
                                                        }
                                                    }
                                                });

                                                // Hit the player
                                                playersHere.forEach(function(item) {
                                                    if (item) {
                                                        item.impactHealth(-50);
                                                    }
                                                });

                                                // Check if the block is non-stable
                                                if (!options.game.map.raster[options.y + bDIF.y][options.x + bDIF.x].block.stable) {

                                                    // Notify the block of it's removal
                                                    options.game.map.raster[options.y + bDIF.y][options.x + bDIF.x].block.onremove({
                                                        x: options.x + bDIF.x,
                                                        y: options.y + bDIF.y,
                                                        game: options.game,
                                                        player: options.player,
                                                        type: 'interact'
                                                    });

                                                    // Replace the block with dirt
                                                    options.game.map.raster[options.y + bDIF.y][options.x + bDIF.x].block = this.blockList.getBlock('dirt');

                                                    // Update the changedRC
                                                    changedRC.xChanged.push(options.x + bDIF.x);
                                                    changedRC.yChanged.push(options.y + bDIF.y);
                                                }

                                                // Remove the tnt
                                                options.game.map.raster[options.y][options.x].block = this.blockList.getBlock('dirt');

                                                // Update the changedRC
                                                changedRC.xChanged.push(options.x);
                                                changedRC.yChanged.push(options.y);
                                            }
                                        }
                                    }

                                    // Notify the game of the change
                                    if (options.game.render) {
                                        options.game.render(options.game, changedRC);
                                    }
                                }
                            }.bind(this), bombDelay);

                            return changedRC;

                        }.bind(this));
                        break;
                    default:
                }
                break;
            case 'rifle':
                switch (options.type) {
                    case 'react':

                        return (function(options) {

                            // Check if the player has ammo
                            var ammo = options.player.inventory.filter(function(item) {
                                if (item.block.texture_name == 'ammo') {
                                    return true;
                                }
                            });
                            if (ammo[0].amount > 0) {
                                var bDIF = ({
                                    up: {x:0,y:-1},
                                    right: {x:1,y:0},
                                    down: {x:0,y:1},
                                    left: {x:-1,y:0}
                                })[options.direction];

                                var bulletInfo = {
                                    x: options.player.x,
                                    y: options.player.y,
                                    damageMultiplier: 1,
                                    block: options.game.blockList.getBlock('ammo')
                                };

                                var shooting = function() {

                                    // Check if the block is not out of map
                                    if (options.game.map.raster
                                            [bulletInfo.y + bDIF.y] &&
                                        options.game.map.raster
                                            [bulletInfo.y + bDIF.y]
                                            [bulletInfo.x + bDIF.x])
                                    {
                                        // Check if there is a player
                                        var playersAtThisPos = options.game.players.filter(function(player) {
                                            if (player) {
                                                if (player.x == bulletInfo.x + bDIF.x &&
                                                    player.y == bulletInfo.y + bDIF.y) {
                                                    return true;
                                                }
                                            }
                                        });

                                        // Check if there is a player
                                        if (playersAtThisPos.length > 0) {

                                            // Damage the player
                                            playersAtThisPos.forEach(function(item) {
                                                console.log(item);
                                                var health_effects = bulletInfo.block.health_effects;
                                                if (health_effects) {
                                                    item.impactHealth(
                                                        -((health_effects.playerDamage || 10) * bulletInfo.damageMultiplier)
                                                    );
                                                }
                                            });

                                            // Reset the field
                                            options.game.map.topographies
                                                    [bulletInfo.y]
                                                    [bulletInfo.x].block = undefined;

                                            // Stop the loop
                                            console.log('removing the bullet');
                                            clearInterval(shootingInterval);

                                        } else {

                                            // Check if the block is traversable
                                            if (!options.game.map.raster
                                                    [bulletInfo.y + bDIF.y]
                                                    [bulletInfo.x + bDIF.x].block.traversable)
                                            {
                                                // Check if the block reflects
                                                if (options.game.map.raster
                                                        [bulletInfo.y + bDIF.y]
                                                        [bulletInfo.x + bDIF.x].block.redirectsBullets) {

                                                    bDIF.x = -bDIF.x;
                                                    bDIF.y = -bDIF.y;

                                                } else {

                                                    // Reset the field
                                                    options.game.map.topographies
                                                            [bulletInfo.y]
                                                            [bulletInfo.x].block = undefined;

                                                    // Stop the loop
                                                    console.log('removing the bullet');
                                                    clearInterval(shootingInterval);
                                                }
                                            }
                                        }

                                    } else {
                                        // Reset the field
                                        options.game.map.topographies
                                                [bulletInfo.y]
                                                [bulletInfo.x].block = undefined;

                                        // Stop the loop
                                        console.log('removing the bullet');
                                        clearInterval(shootingInterval);
                                    }

                                    // Reset the field
                                    options.game.map.topographies
                                            [bulletInfo.y]
                                            [bulletInfo.x].block = undefined;

                                    // If the timer wasn't cancelled, move the bullet
                                    if (shootingInterval['0'] === undefined) {
                                        // Update the new field
                                        options.game.map.topographies
                                            [bulletInfo.y + bDIF.y]
                                            [bulletInfo.x + bDIF.x].block = options.game.blockList.getBlock('ammo');

                                        // Increase the damage by 20% per block traveled
                                        bulletInfo.damageMultiplier *= 1.1;

                                        // Update the position
                                        bulletInfo.x += bDIF.x;
                                        bulletInfo.y += bDIF.y;
                                    }

                                    // Call the render method of the game
                                    if (options.game.render) {
                                        options.game.render(options.game, {
                                            xChanged: [bulletInfo.x - bDIF.x, bulletInfo.x],
                                            yChanged: [bulletInfo.y - bDIF.y, bulletInfo.y]
                                        });
                                    }
                                }
                                var shootingInterval = setInterval(shooting, 80);


                                // Remove on shell from the inventory
                                options.player.changeResource({
                                    block: options.game.blockList.getBlock(ammo[0].block.texture_name),
                                    amount: -1
                                });
                            }

                            return changedRC;
                        });

                        break;
                    default:

                }
                break;
            case 'craftingwand':
                switch (options.type) {
                    case 'react':

                        return (function(options) {
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
                            })[options.direction];

                            // Get all the blocks
                            var blocks = [];
                            try {
                                positions.forEach(function(item) {
                                    blocks.push(
                                        options.game.map.raster[options.player.y + item[0]][options.player.x + item[1]].block
                                    );
                                });
                            } catch (e) {
                                console.log('Invalid crafting ' + e);
                                return false;
                            }

                            // Debugging
                            if (options.game.verbose) {
                                console.log([
                                    [blocks[0].texture_name, blocks[1].texture_name, blocks[2].texture_name].join('-'),
                                    [blocks[3].texture_name, blocks[4].texture_name, blocks[5].texture_name].join('-'),
                                    [blocks[6].texture_name, blocks[7].texture_name, blocks[8].texture_name].join('-')
                                ].join('\n'));
                            }

                            // Pass it to the craft method
                            var craftingResult = options.game.Crafting.craft(blocks.map(function(item) {

                                var name = item.texture_name;

                                if (name == 'dirt') {
                                    name = '';
                                }

                                return name;

                            }), options.player);

                            if (craftingResult) {

                                // Reset all blocks in with dirt
                                positions.forEach(function(item) {

                                    // replace with dirt
                                    options.game.map.raster
                                        [options.player.y + item[0]]
                                        [options.player.x + item[1]].block = options.game.blockList.getBlock('dirt');

                                    // onplace handler
                                    options.game.map.raster
                                        [options.player.y + item[0]]
                                        [options.player.x + item[1]].block.onplace({
                                            x: options.player.x,
                                            y: options.player.y,
                                            game: options.game,
                                            player: options.player,
                                            type: 'place'
                                        });

                                    // update the changedRC object
                                    changedRC.xChanged.push(options.player.x + item[1]);
                                    changedRC.yChanged.push(options.player.y + item[0]);
                                }.bind(this));

                                // Add the resource to the players inventory
                                options.player.changeResource({
                                    block: craftingResult.block,
                                    amount: craftingResult.amount
                                });
                            }

                            return changedRC;
                        });

                        break;
                    default:
                }
                break;
            default:

        }

        // If no action was triggered, return the empty changedRC object
        return (function() {
            return changedRC;
        });
    }

    // The blockList
    this.blockList = undefined;
}
