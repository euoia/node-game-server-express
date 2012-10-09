function ChatController () {
	this.chat = null; // The chat communications.
	this.userList = null; // The user list.
	
	// Event listener.
	Event.init(this);
}

ChatController.prototype.init = function () {
	this.chat = new Chat();
	this.userList = new UserList();
	
	// Events dispatched by chat.
	this.chat.listen ('userJoined', this.addUser, this);
	this.chat.listen ('userLeft', this.removeUser, this);
};

// Update the user list based on the event.
ChatController.prototype.addUser = function (ev) {
	this.userList.addUser(ev.username);
};

// Update the user list based on the event.
ChatController.prototype.removeUser = function (ev) {
	this.userList.removeUser(ev.username);
};
