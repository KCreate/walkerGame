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
            if (!(data.changedRC.xChanged.indexOf(x) != -1)) {
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
            
            if (data.map.raster[y] === 0) {
                console.log('skipping1 at: ' + y + '|' + x);
                continue;
            }

            if (data.map.raster[y][x] === 0) {
                console.log('skipping2 at: ' + y + '|' + x);
                continue;
            }

            if (data.changedRC) {
                if (!(data.changedRC.yChanged.indexOf(y) != -1)) {
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
            var masked = false;
            if (validPlayersY.length > 0) {
                playerAtThisPos = validPlayersY.last();
                texture = playerAtThisPos.id;
                if (playerAtThisPos.mask) {
                    texture = playerAtThisPos.inventory[0].block.texture_id;
                    masked = true;
                }
            } else {
                texture = data.map.raster[y][x].block.texture_id;
            }

            // Pass the data to the drawTexture function
            if (texture !== undefined) {
                // Pass the mapData if it hasn't been passed before
                if (!drawHandler.mapData) {
                    drawHandler.setMapData(data.map);
                }

                // If the block is transparent draw the dirt texture first
                console.log(data.map.raster[y][x].block);
                if (data.map.raster[y][x].block.transparent) {
                    drawHandler.drawTexture(
                        8,
                        x,
                        y
                    );
                }

                // Draw the ground texture
                drawHandler.drawTexture(
                    texture,
                    x,
                    y
                );

                // Check if there are any topographies
                if (data.map.topographies[y][x].block) {
                    drawHandler.drawTexture(
                        data.map.topographies[y][x].block.texture_id,
                        x,
                        y
                    );
                }

                // Several drawing related to the player
                if (playerAtThisPos && !masked) {

                    // Draw the item in a players hand
                    if (playerAtThisPos.inventory[0].amount > 0) {
                        drawHandler.drawItem(
                            playerAtThisPos.inventory[0].block.texture_id,
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
var protoSpritesheet = function() {
    this.spritesheet = undefined;
    this.load = function(spritesheet_name) {
        this.spritesheet = new Image();
        this.spritesheet.src = spritesheet_name;
        this.spritesheet.onload = function() {
            console.dir(this.spritesheet);
            console.log('image did load: ' + this.readySubscribers.length);
            this.readySubscribers.forEach(function(queueItem) {
                queueItem.caller[queueItem.type](
                    queueItem.id,
                    queueItem.dx,
                    queueItem.dy,
                    queueItem.w,
                    queueItem.h,
                    queueItem.callback,
                    queueItem.type
                );
            });
        }.bind(this)
    }
    this.readySubscribers = [];
}
var protoSpritesheet = new protoSpritesheet();
protoSpritesheet.load('./res/img/spritesheet.png');

var protoDrawHandler = function() {
    this.Context = undefined;
    this.load = function(Context, mapData) {
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
            protoSpritesheet.spritesheet.naturalWidth === 0 ||
            protoSpritesheet.spritesheet.naturalHeight === 0 ||
            !protoSpritesheet.spritesheet.complete) {

            protoSpritesheet.readySubscribers.push({
                id: id,
                dx: dx,
                dy: dy,
                w: w,
                h: h,
                callback: callback,
                type: 'drawItem',
                caller: this
            });

            return false;
        }

        console.log([
            'Rendering',
            '(w:'+protoSpritesheet.spritesheet.naturalWidth+' h:'+protoSpritesheet.spritesheet.naturalHeight+')',
            '(c:'+protoSpritesheet.spritesheet.complete+')'
        ].join('\n'));

        if (id === undefined) {
            id = 36;
        }

        if (typeof id === 'object') {
            id = id.texture_id;
        }

        // Raise the coordinates
        var CORD = GCRaiseCoord(
            id,
            (protoSpritesheet.spritesheet.width / this.mapData.tileDimension)
        );

        // Draw to the canvas
        this.Context.context.save();
        this.Context.context.globalAlpha = 1;
        this.Context.context.drawImage(
            protoSpritesheet.spritesheet,
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
            protoSpritesheet.spritesheet.naturalWidth === 0 ||
            protoSpritesheet.spritesheet.naturalHeight === 0 ||
            !protoSpritesheet.spritesheet.complete) {

            protoSpritesheet.readySubscribers.push({
                id: id,
                dx: dx,
                dy: dy,
                callback: callback,
                type: 'drawTexture',
                caller: this
            });

            return false;
        }

        console.log([
            'Rendering',
            '(w:'+protoSpritesheet.spritesheet.naturalWidth+' h:'+protoSpritesheet.spritesheet.naturalHeight+')',
            '(c:'+protoSpritesheet.spritesheet.complete+')'
        ].join('\n'));

        if (id === undefined) {
            id = 36;
        }

        if (typeof id === 'object') {
            id = id.texture_id;
        }

        // Raise the coordinates
        var CORD = GCRaiseCoord(
            id,
            (protoSpritesheet.spritesheet.width / this.mapData.tileDimension)
        );

        // Draw to the canvas
        this.Context.context.drawImage(
            protoSpritesheet.spritesheet,
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
drawHandler.load(Context);
