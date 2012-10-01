var mongoose = require('mongoose'),
	Step = require('step'),
	ChatRoomEvent = require('./ChatRoomEvent'),
	ChatRoomUser = require('./ChatRoomUser');


var chatRoomSchema = new mongoose.Schema ({
	name: {type: String, index: { unique: true }}
});

// TODO * Username shoud be unique for each chat room - I think I need to
//        brush up on my understanding of mongodb.
//      * Something like this should work - how does one do this in mongoose?
//        chatRoomSchema.ensureIndex({'events.username': 1}, {unique: true});
chatRoomSchema.statics.getUsers = function(room_name, cb) {
	console.log('Called getUsers');

	this.findOne({name: room_name}, function (err, room) {
		if (err) {
			return cb(err);
		}

		return cb(null, room.users);
	});
};

///////////////////////////
// Methods.

// Get all the events from this room.
chatRoomSchema.methods.getEvents = function(cb) {
	console.log('getEvents ' + this.name);
	return Chatroom.getEvents(this.name, cb);
};


// Send a message to this room.
chatRoomSchema.methods.sendMessage = function(username, message, cb) {
	console.log('ChatRoom.sendMessage ' + this.name);
	return this.model('ChatRoom').sendMessage(this.name, username, message, cb);
};

///////////////////////////
// Statics.
chatRoomSchema.statics.getEvents = function(room_name, cb) {
	console.log('getEvents');
	console.log('> room_name=' + room_name);

	return ChatRoomEvent.find(
		{room_name: room_name},
		cb
	);
}; 

// User-oriented functions
chatRoomSchema.statics.getUnreadEvents = function(room_name, username, cb) {
	console.log('getUnreadEvents');
	console.log('> room_name=' + room_name);
	console.log('> username=' + username);

	var thisChatRoomUser = null;

	Step(
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

// Send a message to any room.
chatRoomSchema.statics.sendMessage = function(room_name, username, message, cb) {
	console.log('ChatRoom.sendMessage');
	console.log('> room_name = ' + room_name);
	console.log('> username = ' + username);
	console.log('> message = ' + message);

	this.findOne({name: room_name}, function (err, room) {
		if (err) {
			return cb(err);
		}

		new ChatRoomEvent ({
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

// Returns  to cb one of:
//   {status : 'success'}
//   {status : 'error', code : code}
//   
// Where code is one of:
//   NO_SUCH_ROOM
//   ALREADY_PRESENT
//   DB_ERROR
chatRoomSchema.statics.join = function(room_name, username, cb) {
	console.log(username + ' joining ' + room_name);

	Step (
		function findChatRoom() {
			ChatRoom.findOne({name: room_name}, this);
		},
		function foundChatRoom(err, room) {
			var response;
			
			if (err) {
				console.log('Room ' + room_name + ' does not exist!');
				response = {status : 'error', code: 'NO_SUCH_ROOM'};
				return cb(response);
			}

			ChatRoomUser.findOne({room_name: room_name, username: username}, this);
		},
		function foundChatRoomUser(err, chatRoomUser) {
			if (err) {
				return cb({status : 'error', code : 'DB_ERROR'});
			};

			console.log('found chat room user');

			if (chatRoomUser !== null) {
				// Update chatRoomUser
				console.log('User ' + username + ' was already in chat room \'' + room_name + '\'!');

				return cb({status : 'error', code: 'ALREADY_PRESENT'});
			}

			chatRoomJoinEvent = new ChatRoomEvent({
				room_name: room_name,
				type: 'join',
				username: username
			}).save(this);
		},
		function chatRoomJoinEventSaved (err) {
			if (err) {
				return cb({status : 'error', code : 'DB_ERROR'});
			};
			
			// Insert into chat room
			chatRoomUser = new ChatRoomUser({
				lastUpdated: new Date(),
				room_name: room_name,
				username: username
			}).save(this);
		},
		function chatRoomUserSaved (err) {
			if (err) {
				return cb({status : 'error', code : 'DB_ERROR'});
			};
			
			ChatRoom.getUsers(room_name, this);
		},
		function gotUsers (err, users) {
			if (err) {
				return cb({status : 'error', code : 'DB_ERROR'});
			};
			
			return cb({status: 'success', users: users});
		}
	);
};

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
