textures = {
    "player0": {
        "texture_id": 0,
        "placeable": false
    },
    "player1": {
        "texture_id": 1,
        "placeable": false
    },
    "player2": {
        "texture_id": 2,
        "placeable": false
    },
    "player3": {
        "texture_id": 3,
        "placeable": false
    },
    "player4": {
        "texture_id": 4,
        "placeable": false
    },
    "player5": {
        "texture_id": 5,
        "placeable": false
    },
    "player6": {
        "texture_id": 6,
        "placeable": false
    },
    "player7": {
        "texture_id": 7,
        "placeable": false
    },
    "dirt": {
        "texture_id": 8,
        "texture_ff_name": "Dirt",
        "traversable": true,
        "stable": true
    },
    "stone": {
        "texture_id": 9,
        "texture_ff_name": "Stone",
        "stable": true
    },
    "cobblestone": {
        "texture_id": 10,
        "texture_ff_name": "Cobblestone",
        "stable": false
    },
    "tnt": {
        "texture_id": 11,
        "texture_ff_name": "TNT"
    },
    "wood": {
        "texture_id": 12,
        "texture_ff_name": "Wood",
        "pushable": true
    },
    "bookshelf": {
        "texture_id": 13,
        "texture_ff_name": "Bookshelf",
        "pushable": true
    },
    "brick": {
        "texture_id": 14,
        "texture_ff_name": "Brick",
        "stable": true
    },
    "ironblock": {
        "texture_id": 15,
        "texture_ff_name": "Iron Block",
        "traversable": true,
        "stable": true
    },
    "goldblock": {
        "texture_id": 16,
        "texture_ff_name": "Gold Block",
        "traversable": true,
        "stable": true
    },
    "diamondblock": {
        "texture_id": 17,
        "texture_ff_name": "Diamond Block",
        "traversable": true,
        "stable": true
    },
    "glass": {
        "texture_id": 18,
        "texture_ff_name": "Glass Pane",
        "drops":false
    },
    "ironbar": {
        "texture_id": 19,
        "texture_ff_name": "Iron Bar",
        "stable": true
    },
    "mossycobblestone": {
        "texture_id": 20,
        "texture_ff_name": "Mossy Cobblestone",
        "stable": true
    },
    "sand": {
        "texture_id": 21,
        "texture_ff_name": "Sand",
        "traversable":true
    },
    "gravel": {
        "texture_id": 22,
        "texture_ff_name": "Gravel",
        "pushable": true
    },
    "woodlog": {
        "texture_id": 23,
        "texture_ff_name": "Wood Log"
    },
    "bedrock": {
        "texture_id": 24,
        "texture_ff_name": "Bedrock",
        "stable": true,
        "onlyadminbreakable": true
    },
    "sword": {
        "texture_id": 25,
        "texture_ff_name": "Sword",
        "item": true,
        "drops": false,
        "health_effects": {
            "playerDamage": 12
        }
    },
    "craftingwand": {
        "texture_id": 26,
        "texture_ff_name": "Crafting Wand",
        "item": true,
        "drops": false,
        "infinite": true
    },
    "healingwand": {
        "texture_id": 27,
        "texture_ff_name": "Healing Wand",
        "item": true,
        "drops": false,
        "infinite": true,
        "health_effects": {
            "playerDamage": -5
        }
    },
    "rifle": {
        "texture_id": 28,
        "texture_ff_name": "Rifle",
        "item": true,
        "drops": false,
        "health_effects": {
            "playerDamage": 100
        }
    }
}

// Get the last item from an array
Array.prototype.last = function() {
    return this[this.length - 1];
};

// Populate an empty array
Array.prototype.populate = function(value) {
    for (var i=0; i<this.length; i++) {
        this[i] = (value || undefined);
    }
}

// Check if an object contains every of the keys given
Object.prototype.hasKeys = function(keyList) {
    return keyList.map(function(item) {
        return this.hasOwnProperty(item);
    }.bind(this).indexOf(false) > -1);
}

// Coordinates functions
function GCRaiseCoord(point, width) {
    point = parseInt(point);

    return {
        x: (point % width),
        y: Math.floor((point / width))
    };
}
function GCFlattenCoord(x,y,width) {
    return (y*width)+x;
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
            if (validPlayersY.length > 0) {
                texture = validPlayersY.last().id;
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
                    this.drawTexture(
                        item.id,
                        item.dx,
                        item.dy,
                        item.callback
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

    this.drawTexture = function(id, dx, dy, callback) {
        if (
            this.spritesheet.naturalWidth === 0 ||
            this.spritesheet.naturalHeight === 0) {

            this.drawingQueue.push({
                id: id,
                dx: dx,
                dy: dy,
                callback: callback
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

// Chat Node
function renderChatNode(data) {
    if (data.author && data.message && data.time) {
        var element = document.createElement('div');

        // Span nodes
        var timenode = document.createElement('span');
            timenode.className  = 'chat-date';
            timenode.appendChild(document.createTextNode(data.time));
        var messagenode = document.createElement('pre');
            messagenode.className  = 'chat-message';
            messagenode.appendChild(document.createTextNode(data.message));
        var authornode = document.createElement('span');
            authornode.className  = (data.author.admin ? 'chat-author-admin' : 'chat-author');
            authornode.appendChild(document.createTextNode((data.author.nickname || data.author.key)));

        element.appendChild(timenode);
        element.appendChild(messagenode);
        element.appendChild(authornode);

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
                headDrawHandler.load('./res/img/spritesheet.png', headNodeContext, {
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
                document.createTextNode(data.key)
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
            './res/img/spritesheet.png',
            inventoryViewContext, {
                width: 1,
                height: 1,
                tileDimension: 16
        });

    // Draw the texture
    inventoryViewDrawHandler.drawTexture(data.block.texture_id, 0, 0, function() {
        var fillColor = (data.amount <= 3 ? 'rgba(231, 76, 60, 0.95)': 'rgba(255, 255, 255, 0.95)')

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
            if (event.target.value.length != '') {
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
    // Show the control buttons on mobile
    if (/Mobi/i.test(navigator.userAgent)) {
        document.querySelector('.controlbuttons').style.display = 'block';
    }

    this.buttons = document.querySelectorAll('input[name="controlbuttons"]');

    this.socketKey = undefined;
    this.localMap = undefined;

    this.onmessage = function(event) {
        if (event.game.key && !this.socketKey) {
            this.socketKey = event.game.key;
        }

        console.log(event);

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

    // Listen for clicks on the buttons
    for (var i=0; i<this.buttons.length; i++) {
        this.buttons[i].onclick = function(event) {
            this.action(event.target.id);
        }.bind(this);
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
                event.keyCode == 71 ||
                event.keyCode == 72 ||
                event.keyCode == 74 ||

                // E
                event.keyCode == 69
            ) {
                this.action(({
                    // WASD
                    87: 'up',
                    65: 'left',
                    83: 'down',
                    68: 'right',

                    // ZGHJ
                    90: 'place_block:up',
                    71: 'place_block:left',
                    72: 'place_block:down',
                    74: 'place_block:right',

                    // E
                    69: 'interact'
                })[event.keyCode]);
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
                            var id = event.target.id;

                            // we only want the block name
                            id = id.split('inventoryView-').join('');

                            websocket.send(JSON.stringify({
                                actionName: 'select_block:'+id,
                                key: gameController.socketKey,
                                type: 'action'
                            }));
                        }

                        // Add it to the DOM
                        this.inventoryView.appendChild(
                            inventoryBlockView
                        );
                    });
                }
            }
        });
    }
}

/*
    WebSocket

    Delegates messages from the server to their right controllers.
*/
var url = (function(){
    if (window.location.hash == '#dev') {
        return 'ws://localhost:4000';
    } else {
        return 'ws://192.168.1.42:4000';
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
