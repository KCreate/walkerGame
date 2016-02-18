// Dependencies
var blockList       = require('./blocklist.js');
    blockList       = new blockList();

module.exports = function(key, id) {

    // Timing
    this.joinedAt = Date.now();

    // Identification
    this.id = id;
    this.key = key;
    this.nickname = undefined;
    this.name = function() {
        return (this.nickname || "Anonymous");
    }

    // Coordinates on the field
    this.x = 0;
    this.y = 0;

    // Permissions
    this.admin = false;

    // Random
    this.mask = false;

    // Health
    this.health = 100;
    this.impactHealth = function(amount) {

        // Change the health
        this.health += amount;

        // Round the health
        this.health = Math.round(this.health * 100)/100;

        // Max and min health
        if (this.health > 100) {
            this.health = 100;
        } else if (this.health < 0) {
            this.health = 0;
        }

        if (this.onchange) {
            this.onchange(this);
        }
    }

    //Inventory
    this.inventory = [
        {
            block: blockList.getBlock('screwdriver'),
            amount: 1
        },
        {
            block: blockList.getBlock('craftingwand'),
            amount: 1
        },
        {
            block: blockList.getBlock('wood'),
            amount: 80
        },
        {
            block: blockList.getBlock('stone'),
            amount: 400
        }
    ];
    this.selectedBlock = 0;
    this.selectBlock = function(name) {
        var blockExists = false;
        this.inventory.forEach(function(item, index) {
            if (item.block.texture_name == name) {
                this.selectedBlock = index;
                blockExists = true;
            }
        }.bind(this));

        if (blockExists) {
            if (this.onchange) {
                this.onchange(this);
            }
        }
    }

    this.changeResource = function(resource) {

        if (!resource) {
            return false;
        }

        if (typeof resource != 'array') {
            resource = [resource];
        }

        var blockFound = undefined;
        resource.forEach(function(resource) {
            if (blockFound == undefined) {

                // Search for an existing entry in the inventory
                this.inventory.map(function(item, index) {
                    item.amount = parseInt(item.amount);
                    resource.amount = parseInt(resource.amount);

                    if (item.block.texture_name == resource.block.texture_name) {
                        if (resource.amount < 0) {
                            if (Math.abs(resource.amount) > item.amount) {
                                item.amount = 0;
                            } else {
                                item.amount += resource.amount;
                            }
                        } else {
                            item.amount += resource.amount;
                        }

                        blockFound = index;
                    }
                }.bind(this));

                // If the block doesn't already exist, just push it
                if (blockFound == undefined) {
                    if (resource.amount > 0) {
                        this.inventory.push(resource);
                    }
                }
            }
        }.bind(this));

        // Check if the amount is zero
        if (blockFound != undefined) {
            if (this.inventory[blockFound].amount == 0) {
                console.log(blockFound);
                this.inventory.splice(blockFound, 1);

                // Correct the selectedBlock index
                if (this.selectedBlock >= blockFound) {
                    this.selectedBlock -= 1;
                }
            }
        }

        if (this.onchange) {
            this.onchange(this);
        }
    }

    // Callbacks when the player leaves the game
    this.onLeaveHandlers = [];

    // Callback for subscribers
    this.onchange = undefined;
}
