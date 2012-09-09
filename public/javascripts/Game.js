function Game() {
	this.players    = [];       // Array of Players
	this.map        = null;     // The Map.
	this.phase      = null;     // Current game phase
	this.player_num = null;     // The player who's perspective this is (1 [left] or 2 [right])
	this.ui         = null;
}

// Initialize the game.
Game.prototype.init = function (
	stageElementID,
	playerNum,
	startingGold,
	nrows,
	ncols
) {
	this.phase = 'placement';

	this.player_num = playerNum;

	/* Phase is always one of:
	 * placement - initial placement phase
	 * order - players are placing orders
	 * battle - orders are being carried out
	 */

	// Create a map.
	this.map = new Map (stageElementID, nrows, ncols);

	// Draw the map.
	this.map.drawHexGrid();

	// Create the players.
	this.players.push (new Player(1, startingGold));
	this.players.push (new Player(2, startingGold));

	// Create the UI
	this.ui = new UI(stageElementID);
	this.ui.changeGold(this.getPlayer(this.player_num).gold);
	this.ui.changeGamePhase(this.phase);

	this.ui.redraw();
};

// Return the player object given the player number.
Game.prototype.getPlayer = function (
	playerNum
) {
	var playerIdx;

	for (playerIdx in this.players) {
		if (this.players[playerIdx].player_num === playerNum) {
			return this.players[playerIdx];
		}
	}

	console.log ('ERROR: Invalid player number ' + playerNum);
};
