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
