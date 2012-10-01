var mongoose = require('mongoose'),
	sanitize = require('validator').sanitize,
	step	 = require('step');

var waiting = []; // Client connections waiting. Array of objects containing username and callback.

// This is an ajax request that is expecting a JSON response.
exports.chat_send = function (req, res) {
	console.log('Message from ' + req.session.username);

	if (req.session.username === undefined) {
		console.log('chat_send called without a valid session!');
		res.send({error: "Invalid session."}, 200);
		return;
	}

	var ChatRoom = mongoose.model('ChatRoom'),
		thisEvents = [],
		thisUsers = [];

	step (
		function sendMessage() {
			ChatRoom.sendMessage(req.body.room_name, req.session.username, sanitize(req.body.message).entityEncode(), this);
		},
		function sendMessageDone(err) {
			if (err) { throw (err); }

			console.log('message sent, I suppose');
			this();
		},
		function getUnreadEvents() {
			console.log('getting unread events');
			ChatRoom.getUnreadEvents(req.body.room_name, req.session.username, this);
		},
		function getUnreadEventsDone(err, events) {
			if (err) { throw (err); }

			console.log('Unread events:');
			console.log(events);

			thisEvents = events;
			this();
		},
		function sendToWaitingClients() {
			/* Any clients that are waiting on the long poll should receive the message. */
			var waiting_user;

			console.log('There are ' + waiting.length + ' clients waiting.');

			while (waiting.length > 0) {
				waiting_user = waiting.pop();

				console.log ('Sending to waiting user ' + waiting_user['username']);
				waiting_user['callback']();
			}

			this();
		},
		function sendResponse() {
			return res.send({
				status: 1,
				events: thisEvents
			}, 200);
		}
	);
};

// Client uses long polling to wait for new events
//
// To facilitate long-polling this should only return when there is a new message.
exports.chat_get_unread_events = function (req, res) {
	var ChatRoom = mongoose.model('ChatRoom'),
		thisEvents = [];

	step (
		function getUnreadEvents() {
			console.log('getting unread events');
			ChatRoom.getUnreadEvents(req.body.room_name, req.session.username, this);
		},
		function getUnreadEventsDone(err, events) {
			if (err) {
				throw (err);
			}

			console.log('Unread events: - ');
			console.log(events);

			if (events.length == 0) {
				console.log ('No unread events - pushing this connection onto the waiting queue.');

				var waiting_user = {
					'username' : req.session.username,
					'callback' : this
				};

				waiting.push(waiting_user);
			} else {
				console.log ('Sending unread event.');
				thisEvents = events;
				this();
			}
		},
		function sendResponse(err) {
			if (err) {
				req.session.destroy();

				return res.send({
					status: 0,
					error: err.message
				}, 200);
			}

			return res.send({
				status: 1,
				events: thisEvents
			}, 200);
		}
	);
};

// Client uses long polling to wait for new events
exports.chat_poll_events = function (req, res) {
	console.log('chat_poll_events from ' + req.session.username);
	/*
	var ChatRoomEvent = mongoose.model('ChatRoomEvent'); // TODO abstract this out

	ChatRoomEvent.pre('save', function () {
		return res.send({
			status: 1,
			events: this
		}, 200);
	});
   */
};

