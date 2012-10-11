var Config = require('../Config'),
	GameServer = require('../GameServer'),
	Step = require('step'),
	winston = require('winston'),
	uuid = require('node-uuid');

var config = null,
	gameServer = null; // The current game server. TODO: Use an array.
	
// Exports
//////////////////////////////////
exports.playGame = function (req, res) {
	var lp; // Log prefix.
	
	req.log.info('playGame');
	
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
	var sessionError;
		
	req.log.info('init');
	
	sessionError = this.checkSessionError(req); 
	if (sessionError) {
		return res.json (sessionError);
	}
	
	return res.json ({
		'status': 'success'
	});
};

exports.getConfig = function (req, res) {
	var sessionError;
		
	req.log.info('getConfig');
	
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
	var sessionError,
		playerNum; // Number of joining player.
		
	req.log.info('Start');
	
	sessionError = this.checkSessionError(req); 
	if (sessionError) {
		req.log.info('Session error');
		return res.json (sessionError);
	}
	
	if (gameServer === null) {
		// This is the first player (they must wait).
		req.log.info('Joined as first player.');
		
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
	req.log.info('Joined as second player.');
	
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
	var sessionError;
		
	req.log.info('doPlacements');
	
	sessionError = this.checkSessionError(req); 
	if (sessionError) {
		return res.json (sessionError);
	}
	
	req.log.info('info', {placements: req.param('placements')});
	
	if (gameServer.waitingToPlace === null) {
		// This is the first player.
		req.log.info('First player placing');
		
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
	req.log.info('Second player placing.');
	
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
	var sessionError;
		
	req.log.info('doOrders');
	
	sessionError = this.checkSessionError(req); 
	if (sessionError) {
		return res.json (sessionError);
	}
	
	req.log.info('info', {orders: req.param('orders')});
	
	if (gameServer.waitingToPlace === null) {
		// This is the first player.
		req.log.info('First player sending orders.');
		
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
	req.log.info('Second player sending orders.');
	
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
