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
                    default:

                }

                break;
            default:

        }
    }
}
