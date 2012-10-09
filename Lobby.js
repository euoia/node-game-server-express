var mongoose = require('mongoose'),
	Schema	 = mongoose.Schema,
	Account  = require('./models/Account'),
	ChatRoom = require('./models/ChatRoom'),
	ChatRoomEvent = require('./models/ChatRoomEvent'),
	ChatRoomUser = require('./models/ChatRoomUser'),
	Step = require('step');


/* A lobby is responsible for multiple chat rooms. */
this.rooms = {};

// settings:
// rebuild => true | false
// rooms => array of room names to create.
exports.init = function (settings, cb) {
	var thisLobby = this,
		room, // Temp room object.
		roomIdx, // room iterator.
		lp = 'Lobby::init: ';
	
	if (settings.rebuild === true) {
		ChatRoom.collection.drop();
		ChatRoomEvent.collection.drop();
		ChatRoomUser.collection.drop();
        Account.collection.drop();
		
		Account.insertTestRecords();
	}

	// Instantiate a new ChatRoom from the model.
	for (roomIdx in settings.rooms) {
		Step (
			function createRoom () {
				room = new ChatRoom ({
					name: settings.rooms[roomIdx]
				});
				
				room.save(this);
			},
			function roomSaved(err) {
				if (err) {
					console.error(lp + 'Error saving room.');
					console.error(err.stack);
					return cb (err);
				}
				
				room.sendMessage('admin', 'Welcome to node-game-server 20120101!', this);
			},
			function messageSent(r) {
				if (r.status === 'error') {
					return cb (r);
				}
				
				console.log (lp + 'Initialized lobby room ' + room.name);
				thisLobby.rooms[room.name] = room;
			}
		);
	}

	console.log(lp + 'Finished initializing lobby');
};

exports.join = function (room_name, username, cb) {
				
	if (this.rooms[room_name] === 'undefined') {
		return cb ({
			'status' : 'error',
			'message' : 'room does not exist'
		});
	}
	
	Step (
		function joinRoom() {
			ChatRoom.join(room_name, username, this);
		},
		function joinRoomDone(r) {
			if (r.status === 'error') {
				r.message = 'unhandled error';
				return cb(r);
			}
			
			ChatRoom.getUsers(room_name, this);
		},
		function gotUsers (r) {
			if (r.status === 'error') {
				r.message = 'unhandled error';
				return cb(r);
			};
			
			console.log('users:');
			console.log(r.users);
			
			return cb({status: 'success', users: r.users});
		}
	);
}
