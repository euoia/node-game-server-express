var mongoose = require('mongoose'),
	Schema	 = mongoose.Schema,
	Step	 = require('step'),
	Lobby    = require('../Lobby'),
	Account  = require('../models/Account'),
	Session  = require('../Session');

exports.index = function(req, res){
	// This is the boring old default index
	res.render('index', { title: 'Express' });
};

exports.goLogin = function(req, res){
	var sessionError;
		
	req.log.info('Rendering login form');
	
	sessionError = Session.check(req); 
	if (sessionError === null) {
		// May already be logged in.
		return res.redirect(req.app.settings.successfulLoginRedirect);
	}
	
	res.render('login_form', {
		title: 'Login',
		action: '/login'
	});
};

// Log the user in.
exports.doLogin = function(req, res) {
	req.log.info('Attempting to login.');
	
	Step (
		function getAccount() {
			Account.getByUsername (req.param('username'), this);
		},
		function loginResponse(err, r) {
			if (err) {
				console.error(err.stack);
				return res.send(500, 'Something broke!');
			}
			  
			if (r.status === 'error') {
				req.flash('error', r.message);
				return res.redirect(req.app.settings.failedLoginRedirect);
			}
			
			req.log.info('Login successful with ' + req.param('username'));
			req.session.username = req.param('username');
			req.session.logged_in = true;
			return res.redirect(req.app.settings.successfulLoginRedirect);
		}
	);
};

// Log the user out.
exports.doLogout = function(req, res) {
	req.session.destroy();
	return res.redirect('/');
};

// TODO, check session using an array of routes.
exports.goLobby = function(req, res) {
	var users,
		sessionError;
		
	req.log.info('Joining lobby.');
	
	sessionError = Session.check(req); 
	if (sessionError) {
		req.log.info('Session error');
		req.flash(sessionError.status, sessionError.message);
		return res.redirect(req.app.settings.failedLoginRedirect);
	}
	
	Step (
		function joinRoom() {
			// Player should have a session now.
			req.log.info('Joining room ' + req.app.settings.defaultRoom);
			Lobby.join(req.app.settings.defaultRoom, req.session.username, this);
		},
		function joinRoomDone(r) {
			if (r.status === 'error') {
				req.flash('error', r.message);
				req.flash('info', r.code);
				return res.redirect(req.app.settings.failedLoginRedirect);
			}

			if (r.code == 'ALREADY_PRESENT') {
				req.log.info('User was already in the room.');
			}
			
			users = r.users;
			Account.getByUsername(req.session.username, this);
		},
		function foundAccount(err, r) {
			if (err) {
				throw (err);
			}
			
			req.log.info('Rendering chat with users', users);
				
			return res.render('chat', {
				// Account
				title: 'Logged in',
				username: r.account.username,
				real_name: r.account.real_name,

				// Chat
				events: JSON.stringify([]),
				room_name: req.app.settings.defaultRoom,
				users: JSON.stringify(users)
			});
		}
	);
};
