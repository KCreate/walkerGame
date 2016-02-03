function protoContext() {
    this.canvas = undefined;
    this.context = undefined;

    // default canvas width
    var defaultWidth = 430;
    var defaultHeight = 430;

    this.create = function(id, width, height) {
        if (typeof id != 'string') {
            this.canvas = id;
        } else {
            this.canvas = document.getElementById(id);
        }
        this.canvas.width = (width || defaultWidth);
        this.canvas.height = (height || defaultHeight);

        this.context = this.canvas.getContext('2d');
        this.context.mozImageSmoothingEnabled = false;
        this.context.webkitImageSmoothingEnabled = false;
        this.context.msImageSmoothingEnabled = false;
        this.context.imageSmoothingEnabled = false;
        return this.context;
    }
}

/*
    Canvas rendering code
*/
function GCRender(data) {
    var texture = undefined;
    var validPlayers = [];

    // Iterate over the map
    for (var x=0;x<data.map.width;x++) {

        if (data.changedRC) {
            if (!(
                data.changedRC.xChanged.indexOf(x) != -1)) {
                continue;
            }
        }

        validPlayers = data.players.filter(function(player) {
            if (player) {
                if (player.x == x) {
                    return player;
                }
            }
        });

        for (var y=0;y<data.map.height;y++) {

            if (data.changedRC) {
                if (!(
                    data.changedRC.yChanged.indexOf(y) != -1)) {
                    continue;
                }
            }

            // Check if a player is at this position
            var validPlayersY = validPlayers.filter(function(player) {
                if (player) {
                    if (player.y == y) {
                        return player;
                    }
                }
            });

            /*
                If there are any players, draw their texture
                If not, check the map what the ground texture should be
            */
            var playerAtThisPos = undefined;
            if (validPlayersY.length > 0) {
                playerAtThisPos = validPlayersY.last();
                texture = playerAtThisPos.id;
            } else {
                texture = data.map.raster[y][x].block.texture_id;
            }

            // Pass the data to the drawTexture function
            if (texture !== undefined) {
                // Pass the mapData if it hasn't been passed before
                if (!drawHandler.mapData) {
                    drawHandler.setMapData(data.map);
                }

                drawHandler.drawTexture(
                    texture,
                    x,
                    y
                );

                // Several drawing related to the player
                if (playerAtThisPos) {

                    // Draw the item in a players hand
                    if (playerAtThisPos.inventory[playerAtThisPos.selectedBlock].amount > 0) {
                        drawHandler.drawItem(
                            playerAtThisPos.inventory[playerAtThisPos.selectedBlock].block.texture_id,
                            x,
                            y
                        );
                    }
                }
            }

            texture = undefined;
        }
    }
}

/*
    Texture management
*/

var protoDrawHandler = function() {
    this.spritesheet = undefined;
    this.Context = undefined;
    this.load = function(spritesheet_name, Context, mapData) {
        this.spritesheet = new Image();
        this.spritesheet.onload = function() {
            if (this.drawingQueue.length > 0) {
                this.drawingQueue.forEach(function(item, index) {
                    this[item.type](
                        item.id,
                        item.dx,
                        item.dy,
                        item.callback,
                        item.type
                    );
                }.bind(this));
                this.drawingQueue = [];
            }
        }.bind(this)
        this.spritesheet.src = spritesheet_name;
        this.Context = Context;

        if (mapData) {
            this.setMapData(mapData);
        }
    }

    this.drawingQueue = [];
    this.mapData = undefined;
    this.setMapData = function(mapData) {
        this.mapData = {
            pTileWidth: this.Context.canvas.width / mapData.width,
            pTileHeight: this.Context.canvas.height / mapData.height,
            tileDimension: mapData.tileDimension
        }
    }

    this.drawItem = function(id, dx, dy, w, h, callback) {
        if (
            this.spritesheet.naturalWidth === 0 ||
            this.spritesheet.naturalHeight === 0) {

            this.drawingQueue.push({
                id: id,
                dx: dx,
                dy: dy,
                w: w,
                h: h,
                callback: callback,
                type: 'drawItem'
            });

            return false;
        }

        if (id === undefined) {
            id = 36;
        }

        if (typeof id === 'object') {
            id = id.texture_id;
        }

        // Raise the coordinates
        var CORD = GCRaiseCoord(
            id,
            (this.spritesheet.width / this.mapData.tileDimension)
        );

        // Draw to the canvas
        this.Context.context.save();
        this.Context.context.globalAlpha = 1;
        this.Context.context.drawImage(
            this.spritesheet,
            CORD.x * this.mapData.tileDimension,
            CORD.y * this.mapData.tileDimension,
            this.mapData.tileDimension,
            this.mapData.tileDimension,
            dx*this.mapData.pTileWidth + this.mapData.pTileWidth * 0.3,
            dy*this.mapData.pTileHeight + this.mapData.pTileHeight * 0.3,
            this.mapData.pTileWidth * 0.7,
            this.mapData.pTileHeight * 0.7
        );
        this.Context.context.restore();

        // Notify the callback if it was passed
        if (callback) {
            callback(this.Context.context);
        }
    }

    this.drawTexture = function(id, dx, dy, callback) {
        if (
            this.spritesheet.naturalWidth === 0 ||
            this.spritesheet.naturalHeight === 0) {

            this.drawingQueue.push({
                id: id,
                dx: dx,
                dy: dy,
                callback: callback,
                type: 'drawTexture'
            });

            return false;
        }

        if (id === undefined) {
            id = 36;
        }

        if (typeof id === 'object') {
            id = id.texture_id;
        }

        // Raise the coordinates
        var CORD = GCRaiseCoord(
            id,
            (this.spritesheet.width / this.mapData.tileDimension)
        );

        // Draw to the canvas
        this.Context.context.drawImage(
            this.spritesheet,
            CORD.x * this.mapData.tileDimension,
            CORD.y * this.mapData.tileDimension,
            this.mapData.tileDimension,
            this.mapData.tileDimension,
            dx*this.mapData.pTileWidth,
            dy*this.mapData.pTileHeight,
            this.mapData.pTileWidth,
            this.mapData.pTileHeight
        );

        // Notify the callback if it was passed
        if (callback) {
            callback(this.Context.context);
        }
    }

    this.fillText = function(string, x, y, options) {
        options.map(function(value, key) {
            this.Context.context[key] = value;
        }.bind(this));

        this.Context.context.fillText(string, x, y);
    }

    this.strokeText = function(string, x, y, options) {
        options.map(function(value, key) {
            this.Context.context[key] = value;
        }.bind(this));

        this.Context.context.strokeText(string, x, y);
    }
}

// Initialize context and the drawHandler
Context = new protoContext();
Context.create('canvas');

drawHandler = new protoDrawHandler();
drawHandler.load('./res/img/spritesheet.png', Context);
