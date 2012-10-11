var mongoose = require('mongoose'),
	sanitize = require('validator').sanitize,
	step	 = require('step'),
	Session  = require('../Session'),
	ChatRoom = require('../models/ChatRoom');

var waiting = []; // Client connections waiting. Array of objects containing username and callback.

// This is an AJAX request that is expecting a JSON response.
exports.send = function (req, res) {
	var sessionError;
		
	sessionError = Session.check(req); 
	if (sessionError) {
		req.flash(sessionError.status, sessionError.message);
        return res.send({error: "Invalid session."}, 200);
	}

	step (
		function sendMessage() {
			ChatRoom.sendMessage(req.body.room_name, req.session.username, sanitize(req.body.message).entityEncode(), this);
		},
		function sendMessageDone(r) {
			var waiting_user;
			if (r.status === 'error') {
				return res.send({error: "Error sending event."}, 200);
			}
			
			console.dir(r);
			
			// Send the response to the requestor.
			req.log.info('Sent a message: ' + r.event.message);

			res.send({
				status: 1
			}, 200);
			
			/* Any clients that are waiting on the long poll should get a message. */
			req.log.info('There are ' + waiting.length + ' clients waiting.');
			
			while (waiting.length > 0) {
				waiting_user = waiting.pop();
				req.log.info('Processing waiting user: ' + waiting_user.username);
				
				ChatRoom.getUnreadEvents(waiting_user.room_name, waiting_user.username, waiting_user.callback);
			}
		}
	);
};

// Client uses long polling to wait for new events
//
// To facilitate long-polling this should only return when there is a new message.
exports.getUnreadEvents = function (req, res) {
	var lp = '[' + req.session.username + '] chat::getUnreadEvents: ',
		ChatRoom = mongoose.model('ChatRoom');

	step (
		function getUnreadEvents() {
			req.log.info('Getting unread events');
			ChatRoom.getUnreadEvents(req.body.room_name, req.session.username, this);
		},
		function getUnreadEventsDone(r) {
			req.log.info('ChatRoom.getUnreadEvents returned: ', r);
			
			if (r.status === 'error') {
				return this ({status: 'error', message: 'Error getting unread events'});
			}

			if (r.events.length !== 0) {
				req.log.info('Sending ' + r.events.length + ' unread events.');
				this({status: 'success', events: r.events});
			}
			
			req.log.info('No unread events - pushing this connection onto the waiting queue.');
			waiting.push({
				'username' : req.session.username,
				'room_name' : req.body.room_name,
				'callback' : this
			});
		},
		function sendResponse(r) {
			req.log.info('Sending response to client:', r)
			
			if (r.status === 'error') {
				return res.send({
					status: 0,
					message: r.message
				}, 200);
			}
			
			return res.send({
				status: 1,
				events: r.events
			}, 200);
			
		}
	);
};

// Client uses long polling to wait for new events
exports.pollEvents = function (req, res) {
	req.log.info('Polling...');
};

