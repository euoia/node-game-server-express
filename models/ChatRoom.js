var mongoose = require('mongoose'),
	Step = require('step'),
	ChatRoomEvent = require('./ChatRoomEvent'),
	ChatRoomUser = require('./ChatRoomUser'),
	log = require('../Log');


var chatRoomSchema = new mongoose.Schema ({
	name: {type: String, index: { unique: true }}
});

///////////////////////////
// Methods.

// Get all the events from this room.
chatRoomSchema.methods.getEvents = function(cb) {
	log.info('Getting events for ' + this.name);
	return Chatroom.getEvents(this.name, cb);
};


// Send a message to this room.
chatRoomSchema.methods.sendMessage = function(username, message, cb) {
	log.info('sendMessage username=%s message=%s', username, message);
	return this.model('ChatRoom').sendMessage(this.name, username, message, cb);
};

///////////////////////////
// Statics.

// TODO * Username shoud be unique for each chat room - I think I need to
//        brush up on my understanding of mongodb.
//      * Something like this should work - how does one do this in mongoose?
//        chatRoomSchema.ensureIndex({'events.username': 1}, {unique: true});
chatRoomSchema.statics.getUsers = function(room_name, cb) {
	var usernames = [];
		
	log.info('getUsers', {'room_name': room_name})

	ChatRoomUser.find({room_name: room_name}, function (err, users) {
		if (err) {
			log.info(err.stack);
			return cb({status : 'error', code : 'DB_ERROR'});
		}
		
		users.forEach (function(u) {
			usernames.push(u.username);
		});
		
		return cb({status: 'success', users: usernames});
	});
};

chatRoomSchema.statics.getEvents = function(room_name, cb) {
	log.info('getEvents', {'room_name': room_name});

	return ChatRoomEvent.find(
		{room_name: room_name},
		cb
	);
}; 

// User-oriented functions
chatRoomSchema.statics.getUnreadEvents = function(room_name, username, cb) {
	var thisChatRoomUser,
		thisEvents;
		
	log.info('getUnreadEvents', {'room_name': room_name, 'username': username});

	Step(
		// Get the user's last received message in this chat room
		function findChatRoomUser() {
			log.info('findChatRoomUser');
			ChatRoomUser.findOne({room_name: room_name, username: username}, this);
		},
		function findRoomUserDone(err, chatRoomUser) {
			if (err) {
				log.info(err.stack);
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
				log.info(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			}
			
			thisEvents = events;

			thisChatRoomUser.lastUpdated = Date.now();
			thisChatRoomUser.save(this);
		},
		function saveRoomDone (err) {
			if (err) {
				log.info(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			}

			return cb({status: 'success', events: thisEvents});
		}
	);
}; 

// Send a message to any room.
chatRoomSchema.statics.sendMessage = function(room_name, username, message, cb) {
	var event,
		thisChatRoom = this;
		
	log.info('sendMessage room_name=%s username=%s message=%s', room_name, username, message);

	Step(
		function findChatRoomUser() {
			log.info('findChatRoomUser');
			
			// Allow messages from admin to any room without being in user list.
			// TODO : Put this in config.
			if (username !== 'admin') {
				ChatRoomUser.findOne({room_name: room_name, username: username}, this);
			} else {
				return {};
			}
		},
		function findRoomUserDone(err, chatRoomUser) {
			log.info('foundRoomUser');
			if (err) {
				log.info(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			}
			
			if (chatRoomUser === null) {
				log.info('User not in room');
				return cb({status : 'error', code : 'USER_NOT_IN_ROOM'});
			}
			
			thisChatRoom.findOne({name: room_name}, this);
		},
		function foundRoom (err, room) {
			log.info('foundRoom');
			if (err) {
				log.error('Error finding model.');
				log.error(err.stack);
				return cb({status : 'error', message: 'DB_ERROR'});
			}
				
			event = new ChatRoomEvent ({
				room_name: room_name,
				type: 'message',
				username: username,
				message: message
			});
		
			event.save(this);
		}, 
		function savedRoom (err) {
			log.info('savedRoom');
			if (err) {
				log.error('Error saving model.');
				log.error(err.stack);
				return cb({status : 'error', message: 'DB_ERROR'});
			}
			
			return cb({status : 'success', event : event});
		}
	);
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
	var thisChatRoom = this;
	log.info(username + ' joining ' + room_name);

	Step (
		function findChatRoom() {
			thisChatRoom.findOne({name: room_name}, this);
		},
		function foundChatRoom(err, room) {
			if (err) {
				log.info(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			}
				
			ChatRoomUser.findOne({room_name: room_name, username: username}, this);
		},
		function foundChatRoomUser(err, chatRoomUser) {
			if (err) {
				log.info(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			};

			if (chatRoomUser !== null) {
				// Update chatRoomUser
				log.info('User ' + username + ' was already in chat room \'' + room_name + '\'!');
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
				log.info(err.stack);
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
				log.info(err.stack);
				return cb({status : 'error', code : 'DB_ERROR'});
			};
			
			return cb({status: 'success'});
		}
	);
};

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
