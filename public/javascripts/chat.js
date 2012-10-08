function Chat() {
	this.room_name = null;

	// Focus the chat.
	$('#message-entry').focus();
}

Chat.prototype.formatNumberLength = function(num, length) {
    var r = "" + num;
    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}


Chat.prototype.formatDate = function (dateStr) {
	var d = new Date(dateStr);

	return this.formatNumberLength(d.getHours(), 2) +
		":" + this.formatNumberLength(d.getMinutes(), 2) +
		":" + this.formatNumberLength(d.getSeconds(), 2);
}

Chat.prototype.attach = function(room_name) {
	this.room_name = room_name;

	/* Attach to the submit function */
	var this_chat = this;
	$('#form-' + room_name).submit(function() {
		try {
			this_chat.send();
		} catch (err) {
			console.error(err.message)
		}

		return false;
	});

	this.longPoll();
	this.scrollDown();
}

Chat.prototype.getMessage = function () {
	return $('#form-' + this.room_name + ' :input[name=message]').val();
};

Chat.prototype.clearMessage = function () {
	return $('#form-' + this.room_name + ' :input[name=message]').val('');
};

Chat.prototype.processEvents = function (events) {
	var i,
		message;

	if (events === undefined) {
		console.log('processEvents: 0 events to process.');
		return;
	}
	
	console.log('processEvents: ' + events.length + ' events to process.');

	for (i = 0; i < events.length; i += 1) {
		message = events[i];

		switch (message.type) {
			case 'message':
				this.addMessage(message);
				break;
			case 'join':
				this.addJoin(message);
				break;
			default:
				console.error ('unknown message type: ' + message.type);
				break;
		}
	}
};

Chat.prototype.addError = function (errorMessage) {
	$('#chat-' + this.room_name + ' .chat-box ul').append(
		"<li class='error-message'>" + errorMessage + "</li>");

	this.scrollDown();
};

Chat.prototype.addMessage = function (event) {
	$('#chat-' + this.room_name + ' .chat-box ul').append(
		"<li class='message'>" +
			"<span class='timestamp'>[" + this.formatDate(event.created) + "] </span>" +
			"<span class='username'>" + event.username + ": </span>" +
			"<span class='message'>" + event.message + "</span>" +
		"</li>"); // TODO Use Jade instead of this

	this.scrollDown();
};

Chat.prototype.addJoin = function (event) {
	$('#chat-' + this.room_name + ' .chat-box ul').append(
		"<li class='message'>" +
			"<span class='timestamp'>[" + this.formatDate(event.created) + "] </span>" +
			"<span class='username'>" + event.username + " joined </span>" +
		"</li>"); // TODO Use Jade instead of this

	this.scrollDown();
};

Chat.prototype.send = function() {
	var this_chat = this;

	jQuery.post("/chat/send",
		{
			message: this.getMessage(),
			room_name: this.room_name
		},
		function (data) {
		  if (data.status !== 1) {
			this_chat.addError (data.error);
		  }

		  this_chat.processEvents (data.events);

		},
		"json");

	this.clearMessage();
}

Chat.prototype.longPoll = function (this_chat) {
	console.log ('longPoll...');
	if (this_chat === undefined) {
		var this_chat = this;
	}

	//TODO update the document title to include unread message count if blurred
	$.ajax({
		cache: false,
		type: "POST",
		url: "/chat/getUnreadEvents",
		data: {room_name: this_chat.room_name },
		dataType: "json",
		error: function () {
			this_chat.addError("long poll error. trying again...");
			//don't flood the servers on error, wait 10 seconds before retrying
			setTimeout(this_chat.longPoll, 10*1000);
		},
		success: function (data) {
			console.log('Received data:');
			console.log(data);

			if (data.status === 0) {
				// 0 indicates a fatal (do not reconnect) error.
				if (data.error) {
					this_chat.addError (data.error);
				}

			} else if (data.status == 1) {
				// Upon success we want to long poll again immediately.
				this_chat.longPoll(this_chat);
			}

			if (data.events !== undefined) {
				this_chat.processEvents (data.events);
			}
		}
	});
}

Chat.prototype.scrollDown = function () {
	console.log('scrolldown');
	//used to keep the most recent messages visible
   $('#content-body').animate({scrollTop: 9999}, 400);
}
