var mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    step = require('step');


exports.init = function (args) {
    // TODO: Find a library that cleanly allows default args

    // ChatRoomUser: Schema
    var ChatRoomUserSchema = new Schema ({
        room_name: {type: String}, 
        username: {type: String},
        lastUpdated: {type: Date, default: Date.now}
    });

    // ChatRoomUser: Init
    var ChatRoomUser = mongoose.model('ChatRoomUser', ChatRoomUserSchema);

    if (args.rebuild === true) {
        ChatRoomUser.collection.drop();
    }


    // Events: Schema
    var ChatRoomEventSchema = new Schema ({
        room_name: String,
        type: String,
        username: String,
        message: String,
        created: {type: Date, default: Date.now}
    });

    ChatRoomEventSchema.virtual('asString').get(function() {
        return this.username + ': ' + this.message;
    });


    // Events: Init
    var Message = mongoose.model('ChatRoomEvent', ChatRoomEventSchema);

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
    //ChatRoomSchema.ensureIndex({'events.username': 1}, {unique: true});
    ChatRoomSchema.statics.join = function(room_name, username, cb) {
        console.log(username + ' joining ' + room_name);

        var ChatRoomEvent = mongoose.model('ChatRoomEvent');
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
                var join_response; /* Return whether user was already in room. */

                if (err) { return cb(err); }

                console.log('found chat room user');

                if (chatRoomUser === null) {
                    // Insert into chat room
                    chatRoomUser = new ChatRoomUser({
                        room_name: room_name,
                        username: username
                    });

                    chatRoomJoinEvent = new ChatRoomEvent({
                        room_name: room_name,
                        type: 'join',
                        username: username
                    }).save(function (err) {
                        if (err) {
                            console.log ('Error inserting Event event!');
                        }
                    })

                    join_response = {'status' : 'OK'};

                } else {
                    // Update chatRoomUser
                    chatRoomUser.lastUpdated = new Date();
                    console.log('User ' + username + ' was already in chat room \'' + room_name + '\'!');

                    join_response = {'status' : 'ALREADY_PRESENT'};
                }

                chatRoomUser.save(function (err) {
                    if (err) { return cb(err) }

                    console.log('saved chatRoomUserSchema');
                    return cb(null, join_response);
                });
            }
        );
    };

    ChatRoomSchema.statics.getUsers = function(room_name, cb) { // Example
        console.log('Called getUsers');

        this.findOne({name: room_name}, function (err, room) {
            if (err) {
                return cb(err);
            }

            return cb(null, room.users);
        });
    };

    ChatRoomSchema.methods.getEvents = function(cb) {
        console.log('getEvents ' + this.name);
        return mongoose.model('ChatRoom').getEvents(this.name, cb);
    };

    ChatRoomSchema.statics.getEvents = function(room_name, cb) {
        console.log('getEvents');
        console.log('> room_name=' + room_name);

        return mongoose.model('ChatRoomEvent').find(
            {room_name: room_name},
            cb
        );
    }; 

    // User-oriented functions
    ChatRoomSchema.statics.getUnreadEvents = function(room_name, username, cb) { // Example
        console.log('getUnreadEvents');
        console.log('> room_name=' + room_name);
        console.log('> username=' + username);

        var ChatRoom = mongoose.model('ChatRoom');
        var ChatRoomUser = mongoose.model('ChatRoomUser');
        var ChatRoomEvent = mongoose.model('ChatRoomEvent');

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
            // Get the unread events
            function findUnreadChatRoomEvents(chatRoomUser) {
                console.log ('looking for events created after :' + chatRoomUser.lastUpdated);

                thisChatRoomUser = chatRoomUser;

                ChatRoomEvent.find({
                    room_name: room_name,
                    created: {$gt: chatRoomUser.lastUpdated}
                }, this);
            },
            function findUnreadChatRoomEventsDone(err, events) {
                if (err) { return cb (err) }

                thisChatRoomUser.lastUpdated = Date.now();
                thisChatRoomUser.save(function (err) {
                    if (err) { return cb (err) }

                    return cb(null, events);
                });
            }
        );
    }; 

    ChatRoomSchema.methods.sendMessage = function(username, message, cb) {
        console.log('ChatRoom.sendMessage ' + this.name);
        return mongoose.model('ChatRoom').sendMessage(this.name, username, message, cb);
    };

    ChatRoomSchema.statics.sendMessage = function(room_name, username, message, cb) {
        console.log('ChatRoom.sendMessage');
        console.log('> room_name = ' + room_name);
        console.log('> username = ' + username);
        console.log('> message = ' + message);

        var ChatRoomEvent = mongoose.model('ChatRoomEvent');

        this.findOne({name: room_name}, function (err, room) {
            if (err) {
                return cb(err);
            }

            new ChatRoomEvent({
                room_name: room_name,
                type: 'message',
                username: username,
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

    globalRoom.sendMessage('admin', 'Welcome to node-game-server 20120101!', function(err) {
        if (err) { throw (err) }

        globalRoom.save(function(err) {
            if (err) { throw (err); }


            // Example
            globalRoom.getEvents(function(err, events) {
                events.forEach (function(message) {
                    console.log(message.asString);
                });
            });
        });
    });

    console.log('finished initializing chatRoom');
}
