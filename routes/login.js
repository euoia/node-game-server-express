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
	var lp = '[' + req.session.username + '] login::goLogin: ',
		sessionError;
		
	console.log(lp + 'Rendering login form.');
	
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
	var lp = '[' + req.session.username + '] login::doLogin: ';
	console.log (lp + 'Attempting to login.');
	
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
			
			console.log (lp + 'Login successful with ' + req.param('username'));
			req.session.username = req.param('username');
			req.session.logged_in = true;
			return res.redirect(req.app.settings.successfulLoginRedirect);
		}
	);
};

// Log the user out.
exports.doLogout = function(req, res) {
	var lp = '[' + req.session.username + '] login::doLogout: ';
	req.session.destroy();
	return res.redirect('/');
};

// TODO, check session using an array of routes.
exports.goLobby = function(req, res) {
	var users,
	    lp, // Log prefix.
		sessionError;
		
	lp = '[' + req.session.username + '] login::goLobby: ';
	console.log (lp + 'Joining lobby.');
	
	sessionError = Session.check(req); 
	if (sessionError) {
		console.log(lp + 'Session error');
		req.flash(sessionError.status, sessionError.message);
		return res.redirect(req.app.settings.failedLoginRedirect);
	}
	
	Step (
		function joinRoom() {
			// Player should have a session now.
			console.log(lp + 'Joining room ' + req.app.settings.defaultRoom);
			Lobby.join(req.app.settings.defaultRoom, req.session.username, this);
		},
		function joinRoomDone(r) {
			if (r.status === 'error') {
				req.flash('error', r.message);
				req.flash('info', r.code);
				return res.redirect(req.app.settings.failedLoginRedirect);
			}
				

			if (r.code == 'ALREADY_PRESENT') {
				console.log (lp + 'User was already in the room.');
			}
			
			users = r.users;
			Account.getByUsername(req.session.username, this);
		},
		function foundAccount(err, r) {
			if (err) {
				throw (err);
			}
			
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

