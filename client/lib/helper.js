// Get the last item from an array
Array.prototype.last = function() {
    return this[this.length - 1];
};

// Raise a one-dimensional coordinate to a two dimensional one
function GCRaiseCoord(point, width) {
    point = parseInt(point);

    return {
        x: (point % width),
        y: Math.floor((point / width))
    };
}

// Iterate over an object, like map but cooler
Object.prototype.map = function(callback) {
    Object.keys(this).forEach(function(key, index) {
        if (this.hasOwnProperty(key)) {
            this[key] = callback(this[key], key, this);
        }
    }.bind(this));
}
