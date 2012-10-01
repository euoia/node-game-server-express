var mongoose = require('mongoose'),
	Schema	 = mongoose.Schema,
	Account  = require('./models/Account'),
	ChatRoom = require('./models/ChatRoom'),
	ChatRoomEvent = require('./models/ChatRoomEvent'),
	ChatRoomUser = require('./models/ChatRoomUser'),
	step = require('step');


/* A lobby is responsible for multiple chat rooms. */
function Lobby () {
}

Lobby.init = function (settings, cb) {
	var roomIdx; // room iterator.
	
	if (settings.rebuild === true) {
		ChatRoom.collection.drop();
		ChatRoomEvent.collection.drop();
		ChatRoomUser.collection.drop();
        Account.collection.drop();
		
		Account.insertTestRecords();
	}

	// Instantiate a new ChatRoom from the model.
	for (roomIdx in settings.rooms) {
		defaultRoom = new ChatRoom ({
			name: settings.rooms[roomIdx]
		})
		
		console.log(defaultRoom);

		defaultRoom.sendMessage('admin', 'Welcome to node-game-server 20120101!', function(err) {
			if (err) {
				cb (err);
			} else {
				console.log ('Initializied lobby room ' + settings.rooms[roomIdx]);
			}
		});
	};

	console.log('finished initializing lobby');
}

exports.init = Lobby.init;
