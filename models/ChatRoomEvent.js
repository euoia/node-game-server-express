var mongoose = require('mongoose');


var chatRoomEventSchema = new mongoose.Schema ({
	room_name: String,
	type: String,
	username: String,
	message: String,
	created: {type: Date, default: Date.now}
});

module.exports = mongoose.model('ChatRoomEventSchema', chatRoomEventSchema);

chatRoomEventSchema.virtual('asString').get(function() {
	return this.username + ': ' + this.message;
});
