module.exports = function() {
    // Register new commands via this method
    this.regCommand = function(name, callback) {

        // Validate the command name
        if (typeof name == 'string' && name.length >= 3 && name.length <= 20) {

            // Check if callback is a function
            if (typeof callback == 'function') {

                /*
                    Check if the command isn't already registered,
                    if it is, replace the callback with the new one
                */
                if (!this.availableCommands[name]) {
                    this.availableCommands[name] = {name:undefined, callback:undefined};
                    this.availableCommands[name].name = name;
                    this.availableCommands[name].callback = callback;
                } else {
                    this.availableCommands[name].callback = callback;
                }

            } else {
                callback({
                    err: "regCommand: callback must be a function."
                });
            }
        } else {
            callback({
                err: "regCommand: name must be a string with a length from 3 to (including) 20."
            });
        }
    }

    // Fire a command
    this.fireCommand = function(name, data, callback, author) {
        if (this.availableCommands[name]) {
            var result = this.availableCommands[name].callback({
                command: name,
                arguments: data,
                err: data.err
            }, author);
            return callback(
                result[0],
                result[1]
            );
        }
    }

    // Extract the command name and arguments from a string
    this.parseCommand = function(string) {
        // Check if there is a slash in the beginning
        if (string[0] == '/') {
            var command = string.match(
                /^(\/[\w]{3,20})[\s]*(.*)/
            ); // wtf?

            // Check if there were any results
            if (command) {
                // Remove the lash in the beginning of the command
                if (command[1][0] == '/') {
                    command[1] = command[1].split('/').join('');

                    if (this.availableCommands[command[1]]) {
                        return {
                            full: command.input,
                            command: command[1],
                            arguments: command[2]
                        };
                    }
                }
            }
        }
        return false;
    }

    // List of available commands
    this.availableCommands = {};
}
