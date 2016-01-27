// Get the last item from an array
Array.prototype.last = function() {
    return this[this.length - 1];
};

// Populate an empty array
Array.prototype.populate = function(value) {
    for (var i=0; i<this.length; i++) {
        this[i] = (value || undefined);
    }
}

// Check if an object contains every of the keys given
Object.prototype.hasKeys = function(keyList) {
    return keyList.map(function(item) {
        return this.hasOwnProperty(item);
    }.bind(this).indexOf(false) > -1);
}

// Coordinates functions
function GCRaiseCoord(point, width) {
    point = parseInt(point);

    return {
        x: (point % width),
        y: Math.floor((point / width))
    };
}
function GCFlattenCoord(x,y,width) {
    return (y*width)+x;
}

// Iterate over an object, like map but cooler
Object.prototype.map = function(callback) {
    Object.keys(this).forEach(function(key, index) {
        if (this.hasOwnProperty(key)) {
            this[key] = callback(this[key], key, this);
        }
    }.bind(this));
}
