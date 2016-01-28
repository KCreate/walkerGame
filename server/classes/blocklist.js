// Dependencies
var fs      = require('fs');
var Block   = require('./block.js');

module.exports = function() {

    // Load the textures.json file
    this.textures = JSON.parse(
        fs.readFileSync('./client/res/textures.json', 'utf8')
        .split('textures = ')[1]
    );

    // Contains all blocks as objects, with the keys set to the texture_name
    this.blockList = {};

    // Initialize each block and apply the defaults
    if (this.textures) {
        for (texture in this.textures) {
            var blockData = this.textures[texture];
                blockData.texture_name = texture;

            var block = new Block(blockData, this);
            this.blockList[texture] = block;
        }
    }

    /*
        Get a copy of a block from the blocklist

        If you pass a string, it will search for a block with that name,
        when a number is passed, it will search for block with that id
    */
    this.getBlock = function(block_ident) {
        if (typeof block_ident == 'string') {

            var copy = {};
            for (var prop in this.blockList[block_ident]) {
                copy[prop] = this.blockList[block_ident][prop];
            }
            return copy;

        } else if (typeof block_ident == 'number') {

            var copy = {};
            for (var block in this.blockList) {
                if (block.texture_id === block_ident) {
                    for (var prop in this.blockList[block]) {
                        copy[prop] = this.blockList[block][prop];
                    }

                    break;
                }
            }
            return copy;

        } else {
            return false;
        }
    }
}
