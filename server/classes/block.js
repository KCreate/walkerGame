module.exports = function(options) {

    // default properties of a block
    this.texture_name = 'dirt';
    this.texture_ff_name = 'unnamed_resource';
    this.texture_id = 36;
    this.traversable = false;
    this.pushable = false;
    this.placeable = true;
    this.stable = false;
    this.health_effects = {};

    // Called when a block gets placed
    this.onplace = function(event) {
        console.log(event);
    }

    // Called when a block gets removed
    this.onremove = function(event) {
        console.log(event);
    }

    // Called when a player interacts with the block
    this.onreact = function(event) {
        console.log(event);
    }

    // Public callback when the block changes something
    this.didChange = undefined

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
