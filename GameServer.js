// A single game that has 2 players.
function GameServer() {
	this.gameID = null; // UUID for the game.
	
	this.players = {}; // The players objects, keyed on username.
	
	// Each players key contains an object like:
	// 'username'   : The player's username.
	// 'response'   : Response object if the player is waiting (or undefined).
	// 'playerNum'  : The player number (1 or 2).
	
	this.waitingToStart = null; // The player that is waiting to start.
	this.waitingToPlace = null; // The player that is waiting for placements.

	// waitingTo* is an object like:
	// 'player':   The GameServer.player object.
	// 'response': The request object
	// 'response': The response object

	this.placements = {};  // Placements for the round, keyed on player username.
	this.orders = {};  // Orders for the round, keyed on player username.
	
	// Each placements key contains an object like:
	// 'placements' : Array of placements.
	// 
	// A placement is an object:
	// 'row' : The placed row.
	// 'col' : The placed col.
	// 'thingName' : The placed thing.
}

GameServer.prototype.join = function (
	username,
	playerNum)
{
	this.players[username] = {
		username : username,
		playerNum : playerNum
	};
};
   	
GameServer.prototype.isReady = function (username) {
	return (players.length == 2);
};

GameServer.prototype.getPlayer = function (username) {
	return this.players[username];
};

module.exports = GameServer;
