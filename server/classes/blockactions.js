// Dependencies

module.exports = function() {

    // Returns a function that acts as a specific action for a block
    this.getAction = function(options) {
        switch (options.block.texture_name) {
            case 'goldblock':
                switch (options.type) {
                    case 'walkover':
                        return (function(options) {
                            options.player.impactHealth(10);
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
                                    var changedRC = {
                                        xChanged: [],
                                        yChanged: []
                                    };

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

                        }.bind(this));
                        break;
                    default:
                }
                break;
            default:

        }
    }

    // The blockList
    this.blockList = undefined;
}
