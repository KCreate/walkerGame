// Dependencies
var blockActions            = new (require('./blockactions.js'))();

module.exports = function(options, blockList) {

    // set the blockList, this is a dirty hack because the requires would get circular
    blockActions.blockList = blockList;

    // default properties of a block
    this.texture_name = 'dirt';
    this.texture_ff_name = 'unnamed_resource';
    this.texture_id = 36;
    this.traversable = false;
    this.pushable = false;
    this.stable = false;
    this.onlyadminbreakable = false;
    this.drops = true;
    this.infinite = false;
    this.item = false;
    this.health_effects = {};
    this.redirectsBullets = false;

    /*
        The 3 methods below are interaction handlers
        They define what happens when you interact with a block
        e.g: onplace, onremove, onreact

        event should look like that:
        {
            x: 0,
            y: 0,
            game,
            player,
            type
        }
    */

    // Called after the block was placed
    this.onplace = function(event) {
        var options = event;
            options.block = this;
        var action = blockActions.getAction(options);
        if (action) {
            return action(options);
        }
    }

    // Called before the block get's removed
    this.onremove = function(event) {
        var options = event;
            options.block = this;
        var action = blockActions.getAction(options);
        if (action) {
            return action(options);
        }
    }

    // Called when a player interacts with the block
    this.onreact = function(event) {
        var options = event;
            options.block = this;
        var action = blockActions.getAction(options);
        if (action) {
            return action(options);
        }
    }

    // Called after the block get's pushed is already is at the new position
    this.onpush = function(event) {
        var options = event;
            options.block = this;
        var action = blockActions.getAction(options);
        if (action) {
            return action(options);
        }
    }

    // Called after a player gets on top of the block
    this.onwalkover = function(event) {
        var options = event;
            options.block = this;
        var action = blockActions.getAction(options);
        if (action) {
            return action(options);
        }
    }

    // Init method
    this.create = function(options) {
        Object.keys(options).forEach(function(item) {
            if (this.hasOwnProperty(item)) {
                this[item] = options[item];
            }
        }.bind(this));

        return this;
    }

    // Pass the options to the create method
    if (options) {
        return this.create(options);
    }
}
