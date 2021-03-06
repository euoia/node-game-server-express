var mongoose = require('mongoose');

var chatRoomUserSchema = new mongoose.Schema ({
	room_name: {type: String}, 
	username: {type: String},
	lastUpdated: {type: Date, default: Date.now}
});

module.exports = mongoose.model('ChatRoomUser', chatRoomUserSchema);
