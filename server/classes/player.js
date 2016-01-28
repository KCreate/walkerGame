// Dependencies
var blockList       = require('./blocklist.js');
    blockList       = new blockList();

module.exports = function(key, id) {

    // Key and name
    this.id = id;
    this.key = key;
    this.nickname = undefined;
    this.name = function() {
        return (this.nickname || this.key || this.id);
    }

    // Coordinates on the field
    this.x = 0;
    this.y = 0;

    // Permissions
    this.admin = false;

    // Health
    this.health = 100;
    this.impactHealth = function(amount) {

        // Change the health
        this.health += amount;

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
            block: blockList.getBlock('wood'),
            amount: 200
        },
        {
            block: blockList.getBlock('stone'),
            amount: 200
        },
        {
            block: blockList.getBlock('goldblock'),
            amount: 2
        },
        {
            block: blockList.getBlock('tnt'),
            amount: 5
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

        resource.forEach(function(resource) {
            var blockFound = false;

            // Iterate and edit the inventory items
            this.inventory.map(function(item) {
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

                    blockFound = true;
                }
            }.bind(this));

            if (!blockFound) {
                if (resource.amount > 0) {
                    this.inventory.push(resource);
                }
            }
        }.bind(this));

        if (this.onchange) {
            this.onchange(this);
        }
    }

    // Callback for subscribers
    this.onchange = undefined;
}
