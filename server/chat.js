var Commands    = require('./classes/commands.js');

module.exports = function() {
    this.write = function(message, author) {

        // Trim off whitespaces
        message = message.trim();

        // Disallow a single person to send a message twice
        if (this.lastMessage) {
            if (this.lastMessage.message === message &&
                this.lastMessage.key === author.key) {

                console.log('Stopped duplicate message');
                return false;
            }
        }

        // If no author is present, return false
        if (!author) {
            return false;
        }

        // Set the last message
        this.lastMessage = {
            message,
            key: author.key
        };

        // Create an object with all the relevant data
        var newMessage = {
            message,
            time: new Date().toLocaleString('en-US', {
                hour12: false
            }).split(' ')[1],
            author
        };

        // Log to the console
        console.log([
            newMessage.time + " - " + (author.nickname || author.key) + " wrote in the chat:",
            "\t" + newMessage.message
        ].join('\n'));

        // Parse the message and check if it's a valid command
        var commandsParsed = this.commands.parseCommand(newMessage.message);
        if (commandsParsed) {
            this.commands.fireCommand(
                commandsParsed.command, commandsParsed.arguments, function(success, message) {

                if (message.message) {
                    this.serverWrite(message.message);
                }

            }.bind(this), author);

            return;
        }

        // Add it to the messages array
        this.messages.push(newMessage);

        // Notify subscribers of the update
        this.fireEvent('update', {
            newMessage,
            messages: this.messages
        });
    }

    this.serverWrite = function(message) {
        this.write(message, this.serverUser);
    };

    this.serverUser = {
        key: 'SERVER',
        nickname: 'SERVER',
        x: undefined,
        y: undefined,
        id: 'SERVER',
        admin: true
    };

    this.clear = function() {
        this.messages = [];

        this.fireEvent('update', {
            messages: this.messages,
        });
    }

    // Event management system
    this.on = function(eventName, callback) {
        if (this.events[eventName]) {
            this.events[eventName].subscribers.push(callback);
        }
    };
    this.events = {
        update: {
            subscribers: []
        },
        clear: {
            subscribers: []
        },
        playerInfoChanged: {
            subscribers: []
        }
    };
    this.fireEvent = function(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].subscribers.forEach(function(callback) {
                callback(data);
            });
        }
    }

    this.lastMessage = undefined;
    this.messages = [];

    this.commands = new Commands();
}
