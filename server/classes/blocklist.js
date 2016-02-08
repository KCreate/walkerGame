// Dependencies
var fs      = require('fs');
var Block   = require('./block.js');

module.exports = function() {

    // Load the blocks.json file
    this._rawBlockData = JSON.parse(fs.readFileSync('server/res/blocks.json', 'utf8'));

    // Contains all blocks as objects, with the keys set to the texture_name
    this.blockList = {};

    // Initialize each block and apply the defaults
    if (this._rawBlockData) {
        for (name in this._rawBlockData) {

            // This is a dirty hack to copy the blockdata without reference
            var blockData = this._rawBlockData[name];
            blockData.block.texture_name = name;

            this.blockList[name] = blockData;
            this.blockList[name].block = (new Block(blockData.block, this));
        }
    } else {
        return false;
    }

    /*
        Get a copy of a block from the blocklist

        If you pass a string, it will search for a block with that name,
        when a number is passed, it will search for block with that id
    */
    this.getBlock = function(block_ident) {
        if (typeof block_ident == 'string') {

            return oCopy(this.blockList[block_ident].block);

        } else if (typeof block_ident == 'number') {

            for (var block in this.blockList) {
                if (block.block.texture_id === block_ident) {
                    return oCopy(this.blockList[block_ident].block);
                    break;
                }
            }
            return copy;

        } else {
            return false;
        }
    }

    /*
        Get a list of all recipes
    */
    this.getRecipes = function() {
        return Object.keys(this.blockList).filter(function(key) {
            if (this.blockList[key].crafting) {
                return true;
            }
        }.bind(this)).map(function(key) {
            return {
                result: this.getBlock(this.blockList[key].block.texture_name),
                requirements: this.blockList[key].crafting.requirements,
                amount: this.blockList[key].crafting.amount,
                options: this.blockList[key].crafting.options
            }
        }.bind(this));
    }

    /*
        Recursively copy an object without reference
    */
    var oCopy = function(object) {
        if (typeof object == 'object' && object !== null && object !== undefined) {
            var copy = {};
            Object.keys(object).map(function(key) {
                if (typeof object[key] != 'function') {
                    if (typeof object[key] != 'object') {
                        copy[key] = JSON.parse(JSON.stringify(object[key]));
                    } else {
                        copy[key] = oCopy(object[key]);
                    }
                } else {
                    copy[key] = object[key];
                }
            });
            return copy;
        } else {
            return object;
        }
    }
}
