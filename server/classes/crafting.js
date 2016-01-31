module.exports = function(blockList) {

    // The blockList
    this.blockList = blockList;

    /*
        A crafting recipe looks like the following:

        - result (a block returned from the blocklist)
        - amount (amount of blocks returned from the crafting)
        - requirements (an array of 9 texture_names)
        - options (options that the craft method can use)

        If the requirements have an empty slot,
        the validator will count a dirt block and an empty string as matching
    */
    this.recipes = [
        {
            result: this.blockList.getBlock('tnt'),
            amount: 4,
            requirements: [
                'gravel', 'sand', 'gravel',
                'sand', 'gravel', 'sand',
                'gravel', 'sand', 'gravel'
            ],
            options: {}
        },
        {
            result: this.blockList.getBlock('sword'),
            amount: 1,
            requirements: [
                '', 'stone', '',
                '', 'stone', '',
                '', 'wood', ''
            ],
            options: {}
        },
        {
            result: this.blockList.getBlock('healingwand'),
            amount: 1,
            requirements: [
                '', '', 'goldblock',
                '', 'wood', '',
                'wood', '', ''
            ],
            options: {}
        }
    ];

    /*
        Crafting method

        Requires 2 arguments
            - resources (requirements from the recipes, can be in any shape)
            - player (the player who wants to craft)

        A dirt block and an empty string, will be counted as an empty position
    */
    this.craft = function(resources, player) {

        // Create a map of all empty positions, 1 for empty
        var emptyMap = resources.map(function(item) {
            return (item == 'dirt' || item == '')*1;
        });

        console.log(emptyMap.join(''));

        // Reduce the 3x3 raster to the right 2x2 raster
        var _resource = ({
            '001001111': [
                resources[0], resources[1],
                resources[3], resources[4]
            ],
            '100100111': [
                resources[1], resources[2],
                resources[4], resources[5]
            ],
            '111001001': [
                resources[3], resources[4],
                resources[6], resources[7]
            ],
            '111100100': [
                resources[4], resources[5],
                resources[7], resources[8]
            ]
        })[emptyMap.join('')];
        if (_resource) {
            resources = _resource;
            _resource = null;
        }

        // Remove dirt blocks
        resources = resources.map(function(item) {
            if (item == 'dirt') {
                return '';
            } else {
                return item;
            }
        });

        // Check if the resources match any recipe
        var matches = this.recipes.filter(function(recipe) {

            // Check if the recipe length matches
            if (resources.length == recipe.requirements.length) {

                // Check if it matches
                var match = resources.map(function(res, index) {
                    return (res == recipe.requirements[index]);
                }).indexOf(false) < 0;

                // Return the recipe if it's a a match, and false if not
                return (match ? recipe : false);
            } else {
                return false;
            }
        });

        // Return the block from the first matched recipe
        if (matches.length > 0) {
            return {
                block: matches[0].result,
                amount: matches[0].amount
            };
        } else {
            return false;
        }
    }
}
