var mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    step = require('step');


exports.init = function (args) {
    // TODO: Find a library that cleanly allows default args

    // ChatRoomUser: Schema
    var ChatRoomUserSchema = new Schema ({
        room_name: {type: String}, 
        username: {type: String},
        lastMessage: {type: Date, default: Date.now}
    });

    // ChatRoomUser: Init
    var ChatRoomUser = mongoose.model('ChatRoomUser', ChatRoomUserSchema);

    if (args.rebuild === true) {
        ChatRoomUser.collection.drop();
    }


    // Messages: Schema
    var ChatRoomMessageSchema = new Schema ({
        room_name: String, // TODO: Could this be embedded in the ChatRoom schema?
        from: String, // TODO make this a reference to an account
        message: String,
        created: {type: Date, default: Date.now}
    });

    ChatRoomMessageSchema.virtual('asString').get(function() {
        return this.from + ': ' + this.message;
    });


    // Messages: Init
    var Message = mongoose.model('ChatRoomMessage', ChatRoomMessageSchema);

    if (args.rebuild === true) {
        Message.collection.drop();
    }

    // ChatRoom: Schema
    var ChatRoomSchema = new Schema ({
        name: {type: String, index: { unique: true }},
    });

    // TODO : Username shoud be unique for each chat room - I think I need
    // to brush up on my understanding of mongodb.
    // TODO: Something like this should work - how does one do this in mongoose?
    //ChatRoomSchema.ensureIndex({'messages.username': 1}, {unique: true});
    ChatRoomSchema.statics.join = function(room_name, username, cb) {
        console.log(username + ' joining ' + room_name);

        var ChatRoomUser = mongoose.model('ChatRoomUser');
        var ChatRoom = mongoose.model('ChatRoom');

        step (
            function findChatRoom() {
                ChatRoom.findOne({name: room_name}, this);
            },
            function findChatRoomDone(err, room) {
                if (err) {
                    console.log('room ' + room_name + ' does not exist!');
                    return cb(err);
                }

                this();
            },
            function findChatRoomUser() {
                ChatRoomUser.findOne({room_name: room_name, username: username}, this);
            },
            function findChatRoomUserDone(err, chatRoomUser) {
                if (err) { return cb(err); }

                console.log('found chat room user');

                if (chatRoomUser === null) {
                    // Insert into chat room
                    chatRoomUser = new ChatRoomUser({
                        room_name: room_name,
                        username: username
                    });
                } else {
                    // Update chatRoomUser
                    chatRoomUser.lastMessage = new Date();
                    console.log('User ' + username + ' was already in chat room \'' + room_name + '\'!');
                }

                chatRoomUser.save(function (err) {
                    if (err) { return cb(err) }

                    console.log('saved chatRoomUserSchema');
                    return cb(null);
                });
            }
        );
    }

    ChatRoomSchema.statics.getUsers = function(room_name, cb) { // Example
        console.log('Called getUsers');

        this.findOne({name: room_name}, function (err, room) {
            if (err) {
                return cb(err);
            }

            return cb(null, room.users);
        });
    }; 

    ChatRoomSchema.methods.getMessages = function(cb) { // Example
        console.log('getMessages ' + this.name);
        return mongoose.model('ChatRoomMessage').find({name: this.name}, cb);
    }; 

    ChatRoomSchema.statics.getMessages = function(room_name, cb) { // Example
        console.log('getMessages');
        console.log('> room_name=' + room_name);

        return mongoose.model('ChatRoomMessage').find({room_name: room_name}, cb);
    }; 

    // User-oriented functions
    ChatRoomSchema.statics.getUnreadMessages = function(room_name, username, cb) { // Example
        console.log('getUnreadMessages');
        console.log('> room_name=' + room_name);
        console.log('> username=' + username);

        var ChatRoom = mongoose.model('ChatRoom');
        var ChatRoomUser = mongoose.model('ChatRoomUser');
        var ChatRoomMessage = mongoose.model('ChatRoomMessage');

        var thisChatRoomUser = null;

        step(
            // Get the user's last received message in this chat room
            function findChatRoomUser() {
                ChatRoomUser.findOne({room_name: room_name, username: username}, this);
            },
            function findRoomUserDone(err, chatRoomUser) {
                if (err) { return cb(err) }

                this(chatRoomUser);
            },
            // Get the unread messages
            function findUnreadChatRoomMessages(chatRoomUser) {
                console.log ('looking for messages created after :' + chatRoomUser.lastMessage);

                thisChatRoomUser = chatRoomUser;

                ChatRoomMessage.find({
                    room_name: room_name,
                    created: {$gt: chatRoomUser.lastMessage}
                }, this);
            },
            function findUnreadChatRoomMessagesDone(err, messages) {
                if (err) { return cb (err) }

                thisChatRoomUser.lastMessage = Date.now();
                thisChatRoomUser.save(function (err) {
                    if (err) { return cb (err) }

                    return cb(null, messages);
                });
            }
        );
    }; 

    ChatRoomSchema.methods.sendMessage = function(from, message, cb) {
        console.log('ChatRoom.sendMessage ' + this.name);
        return mongoose.model('ChatRoom').sendMessage(this.name, from, message, cb);
    };

    ChatRoomSchema.statics.sendMessage = function(room_name, from, message, cb) {
        console.log('ChatRoom.sendMessage');
        console.log('> room_name = ' + room_name);
        console.log('> from = ' + from);
        console.log('> message = ' + message);

        var ChatRoomMessage = mongoose.model('ChatRoomMessage');

        this.findOne({name: room_name}, function (err, room) {
            if (err) {
                return cb(err);
            }

            new ChatRoomMessage({
                room_name: room_name,
                from: from,
                message: message
            }).save(function(err) {
                if (err) {
                    return cb(err);
                }

                return cb(null);
            });
        });
    }; 

    // ChatRoom: Init
    var ChatRoom = mongoose.model('ChatRoom', ChatRoomSchema);

    if (args.rebuild === true) {
        ChatRoom.collection.drop();
    }

    // ChatRoom data
    var globalRoom = new ChatRoom({
        name: 'global', // The global room
    })

    globalRoom.sendMessage('jpickard', 'Welcome to node-game-server 20120101!', function(err) {
        if (err) { throw (err) }

        globalRoom.save(function(err) {
            if (err) { throw (err); }


            // Example
            globalRoom.getMessages(function(err, messages) {
                console.log('messages:');
                console.log(messages);
                messages.forEach (function(message) {
                    console.log(message.asString());
                });
            });
        });
    });

    console.log('finished initializing chatRoom');
}
