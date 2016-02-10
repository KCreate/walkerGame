var Context = function(name) {
    this.context = undefined;
    this.canvas = undefined;
    this.create = function(name) {
        if (typeof name !== 'string') {
            this.canvas = name;
        } else {
            this.canvas = document.getElementById(name);
        }
        this.context = this.canvas.getContext('2d');
        return this;
    }

    if (name) {
        return this.create(name);
    }
}

// Get the spritesheet
var spritesheet = new Image();
spritesheet.onload = function() {

    // Get the block data
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {

            var blockdata = xhr.responseText;
            blockdata = JSON.parse(blockdata);
            main(spritesheet, blockdata);

        }
    }
    xhr.open('GET', '/internal/res/blocks.json', true);
    xhr.send();
}
spritesheet.src = '/c/res/img/spritesheet.png';

function main(spritesheet, blockdata) {
    // Iterate over the block data
    Object.keys(blockdata).forEach(function(key) {
        var block = blockdata[key];

        // Check if the block has the texture_ff_name property
        if (block.block.texture_ff_name) {
            if (block.crafting) {
                var view = new infoView(blockdata);
                view.preview_id = block.block.texture_id;
                view.title = block.block.texture_ff_name;
                view.spritesheet = spritesheet;

                if (block.crafting) {
                    view.crafting = block.crafting;
                }

                document.getElementById('container').appendChild(
                    view.render()
                );
            }
        }
    });
}

// infoview template
var infoView = function(blockdata) {
    this.blockdata = blockdata;

    this.preview_id = 0;
    this.title = 'Template';
    this.spritesheet = undefined;
    this.crafting = undefined;

    this.render = function() {

        // Setup some containers
        var element = document.createElement('infoview');
        var infocontainer = document.createElement('div');
        infocontainer.className = 'infocontainer';

        // Canvas setup
        var canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        var ctx = new Context(canvas);
        ctx.context.imageSmoothingEnabled = false;

        infocontainer.appendChild(canvas);

        var cords = {
            x: this.preview_id % 8,
            y: Math.floor(this.preview_id / 8)
        }

        // Draw the image
        ctx.context.drawImage(
            spritesheet,
            cords.x * 16,
            cords.y * 16,
            16,
            16,
            0,
            0,
            50,
            50
        );

        // title setup
        var title = document.createElement('h1');
        title.appendChild(document.createTextNode(
            this.title
        ));

        infocontainer.appendChild(title);

        element.appendChild(infocontainer);

        // crafting setup
        var crafting = document.createElement('div');
        crafting.className = 'craftingrecipe';
        element.appendChild(crafting);

        // put the recipe in
        if (this.crafting) {
            var craftingCanvas = document.createElement('canvas');
            var ctx = new Context(craftingCanvas);
            ctx.canvas.width = 200;
            ctx.canvas.height = 200;
            ctx.context.imageSmoothingEnabled = false;

            if (this.crafting.requirements.length == 4) {
                this.crafting.requirements = [
                    this.crafting.requirements[0],
                    this.crafting.requirements[1],
                    '',
                    this.crafting.requirements[2],
                    this.crafting.requirements[3],
                    '',
                    '',
                    '',
                    ''
                ];
            }

            this.crafting.requirements.forEach(function(item, index) {
                if (item == '') {
                    item = 'dirt';
                }

                var block = this.blockdata[item];
                if (block) {
                    var id = block.block.texture_id;

                    var tCord = {
                        x: id % 8,
                        y: Math.floor(id / 8)
                    }
                    var cCord = {
                        x: index % 3,
                        y: Math.floor(index / 3)
                    };

                    if (block.block.transparent) {
                        ctx.context.drawImage(
                            this.spritesheet,
                            0 * 16,
                            1 * 16,
                            16,
                            16,
                            cCord.x * (200/3),
                            cCord.y * (200/3),
                            (200/3),
                            (200/3)
                        );
                    }

                    ctx.context.drawImage(
                        this.spritesheet,
                        tCord.x * 16,
                        tCord.y * 16,
                        16,
                        16,
                        cCord.x * (200/3),
                        cCord.y * (200/3),
                        (200/3),
                        (200/3)
                    );
                }
            }.bind(this));

            crafting.appendChild(craftingCanvas);
        }

        return element;
    };
}
