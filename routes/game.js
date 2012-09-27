var Config = require('../Config'),
	Users = require('../Users'),
	GameServer = require('../GameServer'),
	Step = require('step'),
	winston = require('winston'),
	Uuid = require('node-uuid');
	

var config = null,
	gameServers = null; // array of current servers.
	
	
renderLoginForm = function (req, res, errorMessage) {
    res.render('login_form', {
		title: 'Game Login',
		action: '/game/doLogin',
		errorMessage: req.session.error
	});
};

checkSessionError = function (req) {
	if (req.session.username === undefined) {
		return ({
			'status': 'error',
			'message': 'Invalid session.'
		});
	}
	
	return null;
};

// Exports
//////////////////////////////////

exports.goLogin = function(req, res){
	this.renderLoginForm(req, res);
	
	if (req.session.error !== undefined) {
		// Only show an error once.
		delete req.session.error;
	}
};

exports.doLogin = function(req, res){
	var thisGameRoute = this;
	
	Step (
		function login() {
			Users.login (req, this);
		},
		function loginResponse(response) {
			if (response.status === 'error') {
				req.session.error = response.message;
				res.redirect('/game/login');
				return;
			}
			
			res.redirect('/hexes.html');
		}
	);
};

exports.playGame = function (req, res) {
	var lp; // Log prefix.
	
	lp = '[' + req.param('username') + '] game:playGame:';
	winston.info (lp, 'called.');
	
	Step (
		function login() {
			Users.login (req, this);
		},
		function loginResponse(response) {
			if (response.status === 'error') {
				req.session.error = response.message;
				res.redirect('/game/login');
				return;
			}
			
			res.render('hexes');
		}
	);
};

exports.init = function (req, res) {
	var lp, // Log prefix.
		sessionError;
		
	lp = '[' + req.session.username + '] game:init:';
	winston.info (lp, 'called.');
	
	sessionError = this.checkSessionError(req); 
	if (sessionError) {
		return res.json (sessionError);
	}
	
	return res.json ({
		'status': 'success'
	});
};

exports.getConfig = function (req, res) {
	var lp, // Log prefix.
		sessionError;
		
	lp = '[' + req.session.username + '] game:getConfig:';
	winston.info (lp, 'called.');
	
	sessionError = this.checkSessionError(req); 
	if (sessionError) {
		return res.json (sessionError);
	}
	
	if (config === null) {
		config = new Config();
	}
	
	return res.json(config);
};

// Attempt to start a game. Will wait until a second player joins.
exports.start = function (req, res) {
	var lp, // log prefix.
		sessionError,
		playerNum; // Number of joining player.
		
	lp = '[' + req.session.username + '] game:start:';
	winston.info (lp, 'called.');
	
	sessionError = this.checkSessionError(req); 
	if (sessionError) {
		winston.info (lp, 'session error.');
		return res.json (sessionError);
	}
	
	if (gameServer === null) {
		// This is the first player (they must wait).
		winston.info (lp, 'Joined as first player.');
		
		playerNum = 1;
		
		gameServer = new GameServer();
		gameServer.join (req.session.username, playerNum);
		gameServer.gameID = uuid.v1();
		req.session.gameID = gameServer.gameID;
		
		gameServer.waitingToStart = {
			player: gameServer.getPlayer(req.session.username),
			request: req,
			response: res
		};
		
		// Do not return a response.
		return null;
	}
	
	// This is the second player (they can join).
	winston.info (lp, 'Joined as second player.');
	
	playerNum = 2;
	
	if (gameServer.waitingToStart === null) {
		// TODO: Handle this better.
		throw 'GameServer was not null, but no-one is waiting.';
	}
	
	gameServer.join (req.session.username, playerNum);
	req.session.gameID = gameServer.gameID;
	
	// Tell the waiting player the game can start.
	gameServer.waitingToStart.response.json ({
		status : 'success',
		playerNum: gameServer.waitingToStart.player.playerNum,
		players: gameServer.players
	});
	
	gameServer.waitingToStart = null;
	
	return res.json({
		status : 'success',
		playerNum : playerNum,
		username : req.session.username,
		players: gameServer.players
	});
};

exports.doPlacements = function (req, res) {
	var lp, // Log prefix.
		sessionError;
		
	lp = '[' + req.session.username + '] game: doPlacements:';
	winston.info (lp, 'called.');
	
	sessionError = this.checkSessionError(req); 
	if (sessionError) {
		return res.json (sessionError);
	}
	
	winston.log ('info', lp, {placements: req.param('placements')});
	
	if (gameServer.waitingToPlace === null) {
		// This is the first player.
		winston.info (lp, 'First player placing.');
		
		gameServer.waitingToPlace = {
			player: gameServer.getPlayer(req.session.username),
			request: req,
			response: res
		};
		
		gameServer.placements[req.session.username] = req.param('placements');

		// Do not return a response.
		return null;
	}

	// This is the second player, we can return results.
	winston.info (lp, 'Second player placing.');
	
	gameServer.placements[req.session.username] = req.param('placements');

	// First respond to the waiting player.
	gameServer.waitingToPlace.response.json ({
	   	status : 'success',
		placements : gameServer.placements
	});
	gameServer.waitingToPlace = null;
	
	// Now response to this request.
	return res.json  ({
	   	status : 'success',
		placements : gameServer.placements
	});
};

exports.doOrders = function (req, res) {
	var lp, // Log prefix.
		sessionError;
		
	lp = '[' + req.session.username + '] game: doOrders:';
	winston.info (lp, 'called.');
	
	sessionError = this.checkSessionError(req); 
	if (sessionError) {
		return res.json (sessionError);
	}
	
	winston.log ('info', lp, {orders: req.param('orders')});
	
	if (gameServer.waitingToPlace === null) {
		// This is the first player.
		winston.info (lp, 'First player sending orders.');
		
		gameServer.waitingToPlace = {
			player: gameServer.getPlayer(req.session.username),
			request: req,
			response: res
		};
		
		gameServer.orders[req.session.username] = req.param('orders');

		// Do not return a response.
		return null;
	}

	// This is the second player, we can return results.
	winston.info (lp, 'Second player sending orders.');
	
	gameServer.orders[req.session.username] = req.param('orders');

	// First respond to the waiting player.
	gameServer.waitingToPlace.response.json ({
	   	status : 'success',
		orders : gameServer.orders
	});
	gameServer.waitingToPlace = null;
	
	// Now response to this request.
	return res.json  ({
	   	status : 'success',
		orders : gameServer.orders
	});
};
