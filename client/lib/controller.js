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
        return 'ws://localhost:6628';
    } else {
        return 'ws://192.168.1.50:6628';
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
