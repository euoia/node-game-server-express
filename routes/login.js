var mongoose = require('mongoose'),
	Schema	 = mongoose.Schema,
	Step	 = require('step'),
	Lobby    = require('../Lobby'),
	Account  = require('../models/Account');

exports.index = function(req, res){
	// This is the boring old default index
  res.render('index', { title: 'Express' });
};

exports.goLogin = function(req, res){
	res.render('login_form', {
		title: 'Login',
		action: '/login'
	});
};

// Log the user in.
exports.doLogin = function(req, res) {
	console.log ('Attempting to login with username ' + req.param('username'));
	
	Step (
		function getAccount() {
			Account.getByUsername (req.param('username'), this);
		},
		function loginResponse(err, r) {
			if (err) {
				console.error(err.stack);
				return res.send(500, 'Something broke!');
			}
			  
			console.dir(r);
			if (r.status === 'error') {
				req.flash('error', r.message);
				return res.redirect(req.app.settings.failedLoginRedirect);
			}
			
			req.session.username = req.param('username');
			return res.redirect(req.app.settings.successfulLoginRedirect);
		}
	);
};

// TODO, check session. Do it using an array of routes.
exports.goLobby = function(req, res){
	var users;
	
	Step (
		function joinRoom() {
			// Player should have a session now.
			console.log('Player ' + req.session.username + ' is joining room ' + req.app.settings.defaultRoom + '.');
			Lobby.join(req.app.settings.defaultRoom, req.session.username, this);
		},
		function joinRoomDone(r) {
			var account;
			
			console.log(r);

			if (r.status == 'ALREADY_PRESENT') {
				console.log ('User was apparently already in the room - '
					+ 'searching whether the user was waiting and deleting the connection.');
				/* Remove user from waiting list. */
				/* Could use array filter but I want to log it. */
				for (i=0; i < waiting.length; i += 1) {
					if (waiting[i].username == this_account.username) {
						console.log ('User ' + waiting[i].username + ' was already in room - removing');
						waiting[i].callback({'message': 'You have connected from elsewhere.'});
						waiting.splice(i, 1);
						i -= 1;
					}
				}
			}
			
			users = r.users;
			Account.getByUsername(req.session.username, this);
		},
		function foundAccount(err, r) {
			return res.render('chat', {
				// Account
				title: 'Logged in',
				username: r.account.username,
				real_name: r.account.real_name,

				// Chat
				events: JSON.stringify([]),
				room_name: req.app.settings.defaultRoom,
				users: users
			});
		}
	);
};

