var mongoose = require('mongoose'),
	Step = require('step'),
	ChatRoomEvent = require('./ChatRoomEvent'),
	ChatRoomUser = require('./ChatRoomUser');


var chatRoomSchema = new mongoose.Schema ({
	name: {type: String, index: { unique: true }}
});

///////////////////////////
// Methods.

// Get all the events from this room.
chatRoomSchema.methods.getEvents = function(cb) {
	var lp = '<M:M> ChatRoom::getEvents: ';
	console.log(lp + 'Getting events for ' + this.name);
	return Chatroom.getEvents(this.name, cb);
};


// Send a message to this room.
chatRoomSchema.methods.sendMessage = function(username, message, cb) {
	var lp = '<M:M> ChatRoom::sendMessage: ';
	console.log(lp + 'username=' + username + ' message=' + message);
	return this.model('ChatRoom').sendMessage(this.name, username, message, cb);
};

///////////////////////////
// Statics.

// TODO * Username shoud be unique for each chat room - I think I need to
//        brush up on my understanding of mongodb.
//      * Something like this should work - how does one do this in mongoose?
//        chatRoomSchema.ensureIndex({'events.username': 1}, {unique: true});
chatRoomSchema.statics.getUsers = function(room_name, cb) {
	var lp = '<M:S> ChatRoom::getUsers: '
	console.log(lp + 'Getting users for ' + room_name);

	this.findOne({name: room_name}, function (err, room) {
		if (err) {
			console.log(err.stack);
			return cb({status : 'error', code : 'DB_ERROR'});
		}

		return cb({status: 'success', users: room.users});
	});
};

chatRoomSchema.statics.getEvents = function(room_name, cb) {
	var lp = '<M:S> ChatRoom::getEvents: '
	console.log(lp + 'room_name=' + room_name);

	return ChatRoomEvent.find(
		{room_name: room_name},
		cb
	);
}; 

// User-oriented functions
chatRoomSchema.statics.getUnreadEvents = function(room_name, username, cb) {
	var lp = '<M:S> ChatRoom::getUnreadEvents: ',
		thisChatRoomUser,
		thisEvents;
		
	console.log(lp + 'room_name=' + room_name + ' username=' + username);

	Step(
		// Get the user's last received message in this chat room
		function findChatRoomUser() {
			console.log(lp + 'findChatRoomUser');
			ChatRoomUser.findOne({room_name: room_name, username: username}, this);
		},
		function findRoomUserDone(err, chatRoomUser) {
			if (err) {
				console.log(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			}
			
			if (chatRoomUser === null) {
				return cb({status : 'error', code : 'USER_NOT_IN_ROOM'});
			}
			
			thisChatRoomUser = chatRoomUser;

			ChatRoomEvent.find({
				room_name: room_name,
				created: {$gt: chatRoomUser.lastUpdated}
			}, this);
		},
		function findUnreadChatRoomEventsDone(err, events) {
			if (err) {
				console.log(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			}
			
			thisEvents = events;

			thisChatRoomUser.lastUpdated = Date.now();
			thisChatRoomUser.save(this);
		},
		function saveRoomDone (err) {
			if (err) {
				console.log(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			}

			return cb({status: 'success', events: thisEvents});
		}
	);
}; 

// Send a message to any room.
chatRoomSchema.statics.sendMessage = function(room_name, username, message, cb) {
	var lp = '<M:S> ChatRoom::sendMessage: ',
		event;
		
	console.log(lp + 'room_name=' + room_name + ' username=' + username + ' message=' + message);

	this.findOne({name: room_name}, function (err, room) {
		if (err) {
			console.log (lp + 'Error finding model.');
			console.log(err.stack);
			return cb({status : 'error', message: 'DB_ERROR'});
		}
			
		event = new ChatRoomEvent ({
			room_name: room_name,
			type: 'message',
			username: username,
			message: message
		});
		
		event.save(function(err) {
			if (err) {
				console.log (lp + 'Error saving model.');
				console.log(err.stack);
				return cb({status : 'error', message: 'DB_ERROR'});
			}

			return cb({status : 'success', event : event});
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
	var lp = '<M:S> ChatRoom::join: ',
		thisChatRoom = this;
	console.log(lp + username + ' joining ' + room_name);

	Step (
		function findChatRoom() {
			thisChatRoom.findOne({name: room_name}, this);
		},
		function foundChatRoom(err, room) {
			if (err) {
				console.log(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			}
				
			ChatRoomUser.findOne({room_name: room_name, username: username}, this);
		},
		function foundChatRoomUser(err, chatRoomUser) {
			if (err) {
				console.log(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			};

			if (chatRoomUser !== null) {
				// Update chatRoomUser
				console.log(lp + 'User ' + username + ' was already in chat room \'' + room_name + '\'!');
				return cb({code: 'ALREADY_PRESENT'});
			}

			chatRoomJoinEvent = new ChatRoomEvent({
				room_name: room_name,
				type: 'join',
				username: username
			}).save(this);
		},
		function chatRoomJoinEventSaved (err) {
			if (err) {
				console.log(err.stack);
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
				console.log(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			};
			
			thisChatRoom.getUsers(room_name, this);
		},
		function gotUsers (r) {
			if (r.status === 'error') {
				return cb(r);
			};
			
			return cb({status: 'success', users: r.users});
		}
	);
};

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
