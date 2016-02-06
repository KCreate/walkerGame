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
    this.metadata = {};

    /*
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
        event.block = this;
        var action = blockActions.getAction(event);

        // Actions return a changedRC object
        return action(event);
    }

    // Called before the block get's removed
    this.onremove = function(event) {
        event.block = this;
        var action = blockActions.getAction(event);

        // Actions return a changedRC object
        return action(event);
    }

    // Called when a player interacts with the block
    this.onreact = function(event) {
        event.block = this;
        var action = blockActions.getAction(event);

        // Actions return a changedRC object
        return action(event);
    }

    // Called after the block get's pushed is already is at the new position
    this.onpush = function(event) {
        event.block = this;
        var action = blockActions.getAction(event);

        // Actions return a changedRC object
        return action(event);
    }

    // Called after a player gets on top of the block
    this.onwalkover = function(event) {
        event.block = this;
        var action = blockActions.getAction(event);

        // Actions return a changedRC object
        return action(event);
    }

    // Init method
    this.create = function(options) {
        Object.keys(options).forEach(function(item) {
            if (this.hasOwnProperty(item)) {
                this[item] = JSON.parse(JSON.stringify(options[item]));
            }
        }.bind(this));

        return this;
    }

    // Pass the options to the create method
    if (options) {
        return this.create(options);
    }
}
