// Get the last item from an array
Array.prototype.last = function() {
    return this[this.length - 1];
};

// Raise a one-dimensional coordinate to a two dimensional one
function GCRaiseCoord(point, width) {
    point = parseInt(point);

    return {
        x: (point % width),
        y: Math.floor((point / width))
    };
}

// Iterate over an object, like map but cooler
Object.prototype.map = function(callback) {
    Object.keys(this).forEach(function(key, index) {
        if (this.hasOwnProperty(key)) {
            this[key] = callback(this[key], key, this);
        }
    }.bind(this));
}

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
                continue;
            }

            if (data.map.raster[y][x] === 0) {
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

// Chat Node
function renderChatNode(data) {
    if (data.author && data.message && data.time) {
        var element = document.createElement('div');

        // Meta container
        var metaContainer = document.createElement('div');
            metaContainer.className = 'chat-metacontainer';

        // Span nodes
        var timenode = document.createElement('span');
            timenode.className  = 'chat-date';
            timenode.appendChild(document.createTextNode(data.time));
        var messagenode = document.createElement('pre');
            messagenode.className  = 'chat-message';
            messagenode.appendChild(document.createTextNode(data.message));
        var authornode = document.createElement('span');
            authornode.className  = (data.author.admin ? 'chat-author admin' : 'chat-author');
            authornode.appendChild(document.createTextNode((data.author.nickname || data.author.key)));

        metaContainer.appendChild(timenode);
        metaContainer.appendChild(authornode);

        element.appendChild(metaContainer);
        element.appendChild(messagenode);

        return element;
    }
    return false;
}

function renderPlayerListNode(data) {
    var element = document.createElement('div');

    var playerinfoNode = document.createElement('div');
        var headNode = document.createElement('canvas');
            headNode.id = "player" + data.id;
            headNode.width = 50;
            headNode.height = 50;

            /*
                Player head render code
            */
            var headNodeContext = new protoContext();
                headNodeContext.create(headNode, 50, 50);
            var headDrawHandler = new protoDrawHandler();
                headDrawHandler.load(headNodeContext, {
                    width: 1,
                    height: 1,
                    tileDimension: 16
                });
                headDrawHandler.drawTexture(data.id, 0, 0);

        var nameNode = document.createElement('p');
            nameNode.appendChild(
                document.createTextNode((data.nickname || data.id))
            );
        var keyNode = document.createElement('p');
            keyNode.appendChild(
                document.createTextNode(
                    data.key
                )
            );

            // Golden text for admins
            if (data.admin) {
                nameNode.className = "playerListAdmin";
                keyNode.className = "playerListAdmin";
            }

        playerinfoNode.appendChild(headNode);
        playerinfoNode.appendChild(nameNode);
        playerinfoNode.appendChild(keyNode);
        playerinfoNode.className = "playerinfo";
    var playerstatusNode = document.createElement('div');
        var heartImageNode = document.createElement('img');
            heartImageNode.src = './res/img/pixelheart.png';
        var healthNode = document.createElement('span');
            healthNode.appendChild(
                document.createTextNode(data.health)
            );
        playerstatusNode.appendChild(heartImageNode);
        playerstatusNode.appendChild(healthNode);
        playerstatusNode.className = "playerstatus";

    element.appendChild(playerinfoNode);
    element.appendChild(playerstatusNode);

    return element;
}

/*
    Renders an inventory view block tile with the amount rendererd on top of it

    Inspired by the minecraft inventory
*/

function renderInventoryBlockView(data, inventoryInfo) {
    var canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        canvas.id = "inventoryView-" + data.block.texture_name;
        canvas.title = data.block.texture_ff_name;

        // Set the selected class if the current block is selected
        if (inventoryInfo.index == inventoryInfo.selected) {
            canvas.className = "selected";
        }

    // Add the onclick event handler

    var inventoryViewContext = new protoContext();
        inventoryViewContext.create(canvas, 50, 50);

    var inventoryViewDrawHandler = new protoDrawHandler();
        inventoryViewDrawHandler.load(
            inventoryViewContext, {
                width: 1,
                height: 1,
                tileDimension: 16
        });

    // Draw the texture
    inventoryViewDrawHandler.drawTexture(data.block.texture_id, 0, 0, function() {
        var fillColor = ((data.amount <= 3 && !data.block.item) ? 'rgba(231, 76, 60, 0.95)': 'rgba(255, 255, 255, 0.95)')

        // Draw the text over once the texture has finished
        inventoryViewDrawHandler.fillText(data.amount,
            3, 47, {
            fillStyle: fillColor,
            font: '21px Arial Black'
        });

        // Draw the text over once the texture has finished
        inventoryViewDrawHandler.strokeText(data.amount,
            3, 47, {
            strokeStyle: 'rgba(0, 0, 0, 0.95)',
            font: '21px Arial Black',
            lineWidth: 2
        });
    });

    return canvas;
}

/*
    Chat Controller

    Controls everything that's related to the chat.
*/
var chatController = function(websocket) {
    // UI Elements
    this.chatWindow = document.getElementById('chat');
    this.chatInput = document.querySelector('input[name="chat"]');

    // Internal function for adding chat nodes and automatically scrolling to the bottom
    this.addNode = function(event) {
        if (event) {
            var node = renderChatNode(event);
            if (node) {
                this.chatWindow.appendChild(node);
                this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
            } else {
                console.log('Failed to create chat node');
            }
        }
    }

    // Clear all the messages
    this.clearChat = function() {
        this.chatWindow.innerHTML = "";
    }

    // WebSocket onmessage handler
    this.onmessage = function(event) {
        var messageCount = this.chatWindow.children.length;
        if (event.chat) {
            this.clearChat();
            event.chat.forEach(function(message) {
                this.addNode(message);
            }.bind(this));
        } else {
            if (event.messages.length < messageCount) {
                this.clearChat();
            } else {
                this.addNode(event.newMessage);
            }
        }
    }

    // Chat enter button handler
    this.chatInput.onkeyup = function(event) {
        if (event.keyCode == 13) {
            if (event.target.value != '' && event.target.value.length <= 1000) {
                websocket.send(JSON.stringify({
                    key: gameController.socketKey,
                    message: event.target.value,
                    type: 'chat'
                }));

                event.target.value = "";
            }
        }
    }
}

// Main Game Controller
var gameController = function(websocket) {
    this.socketKey = undefined;
    this.localMap = undefined;

    this.onmessage = function(event) {
        if (event.game.key && !this.socketKey) {
            this.socketKey = event.game.key;
        }

        // Measure render performance
        var start = window.performance.now();

        GCRender(event);

        // Evaluate render performance
        if (!window.times) {
            window.times = {data:[], get: function(){
                var total = 0;
                this.data.map(function(number) {
                    total += number;
                });
                return (total / this.data.length)+"ms";
            }};
        } else {
            window.times.data.push(Math.round((window.performance.now() - start)*100)/100);
        }

        this.localMap = event.map;
    }

    // Listen for WASD keypresses on the whole canvas
    document.onkeydown = function(event) {
        if (!chatController.chatInput.matches(':focus')) {
            if (
                // WASD
                event.keyCode == 87 ||
                event.keyCode == 65 ||
                event.keyCode == 83 ||
                event.keyCode == 68 ||

                // ZGHJ
                event.keyCode == 90 ||
                event.keyCode == 38 ||
                event.keyCode == 71 ||
                event.keyCode == 37 ||
                event.keyCode == 72 ||
                event.keyCode == 40 ||
                event.keyCode == 74 ||
                event.keyCode == 39 ||

                // 1-9
                (event.keyCode >= 49 && event.keyCode <= 57)
            ) {

                if (event.keyCode >= 49 && event.keyCode <= 57) {
                    var block = inventoryViewController.inventoryView.children[
                        (String.fromCharCode(event.keyCode)*1)-1
                    ];

                    if (block) {
                        // we only want the block name
                        var id = block.id.split('inventoryView-').join('');

                        inventoryViewController.select_block(id);
                    }

                } else {
                    // Send the event to the server
                    this.action(({
                        // WASD
                        87: 'up',
                        65: 'left',
                        83: 'down',
                        68: 'right',

                        // ZGHJ
                        90: 'interact:up',
                        38: 'interact:up',
                        71: 'interact:left',
                        37: 'interact:left',
                        72: 'interact:down',
                        40: 'interact:down',
                        74: 'interact:right',
                        39: 'interact:right'
                    })[event.keyCode]);
                }
            }
        }
    }.bind(this)

    // Game action method
    this.action = function(actionName) {
        websocket.send(JSON.stringify({
            actionName,
            key: this.socketKey,
            type: "action"
        }));
    }
}

// Controls the player list
var playerListController = function(websocket) {
    this.listView = document.getElementsByClassName('playerlist')[0];

    this.onmessage = function(event) {
        // We will rerender the playerListView on everyframe, as every frame is a potentional exit point for a player.

        this.listView.innerHTML = "";
        event.forEach(function(player) {
            if (player) {
                var node = renderPlayerListNode(player);
                this.listView.appendChild(node);
            }
        }.bind(this));
    }
}

/*
    Inventory View Controller
*/
var inventoryViewController = function(websocket) {
    this.inventoryView = document.getElementById('inventoryView');

    this.onmessage = function(event) {
        event.forEach(function(player) {
            if (player) {

                // Check if the player is the current player
                if (player.key == gameController.socketKey) {

                    // Clear the inventoryView and draw the blocks
                    this.inventoryView.innerHTML = "";
                    player.inventory.forEach(function(block, index) {
                        var inventoryBlockView = renderInventoryBlockView(block, {
                            index,
                            selected: player.selectedBlock
                        });

                        // Setup onclick event listener
                        inventoryBlockView.onclick = function(event) {
                            console.log(event);

                            var id = event.target.id;

                            // we only want the block name
                            id = id.split('inventoryView-').join('');

                            this.select_block(id);
                        }.bind(this)

                        // Add it to the DOM
                        this.inventoryView.appendChild(
                            inventoryBlockView
                        );
                    }.bind(this));
                }
            }
        }.bind(this));
    }

    // Notify the server of the block change
    this.select_block = function(id) {
        websocket.send(JSON.stringify({
            actionName: 'select_block:'+id,
            key: gameController.socketKey,
            type: 'action'
        }));
    };
}

/*
    WebSocket

    Delegates messages from the server to their right controllers.
*/
var url = (function(){
    if (window.location.hash == '#dev') {
        return 'ws://localhost:7218';
    } else {
        return 'ws://'+window.location.hostname+':7218';
    }
})();

// Setup several controllers
var websocket           = new WebSocket(url);
gameController          = new gameController(websocket);
chatController          = new chatController(websocket);
playerListController    = new playerListController(websocket);
inventoryViewController = new inventoryViewController(websocket);

websocket.onmessage = function(event) {
    var data = JSON.parse(event.data);

    console.log(data);

    // Different paths
    switch (data.type) {
        case 'game':
            gameController.onmessage(data);
            break;
        case 'chat':
            chatController.onmessage(data);
            break;
        case 'player':
            playerListController.onmessage(data.players);
            inventoryViewController.onmessage(data.players);
            break;
        default:
            console.log('This should not happen...');
            break;
    }
}

websocket.onclose = function(event) {
    document.write([
        '<link rel="stylesheet" href="./res/css/master.css">',
        '<div id="closeMessage">',
            '<p>You either got kicked, have no health left or the server crashed.</p>',
        '</div>'
    ].join('\n'));
}

window.onbeforeclose = function() {
    websocket.onclose = function() {}
    websocket.close();
}
