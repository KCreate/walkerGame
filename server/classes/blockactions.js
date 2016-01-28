module.exports = function() {

    // Returns a function that acts as a specific action for a block
    this.getAction = function(options) {
        switch (options.block.texture_name) {
            case 'wood':
                switch (options.type) {
                    case 'place':
                        return (function(options) {

                        });
                        break;
                    case 'remove':
                        return (function(options) {

                        });
                        break;
                    case 'interact':
                        return (function(options) {

                        });
                        break;
                    case 'push':
                        return (function(options) {

                        });
                        break;
                    case 'walkover':
                        return (function(options) {

                        });
                        break;
                    default:

                }
                break;
            case 'goldblock':
                switch (options.type) {
                    case 'walkover':
                        return (function(options) {
                            options.player.impactHealth(10);
                        });
                        break;
                    default:

                }
                break;
            default:

        }
    }
}
