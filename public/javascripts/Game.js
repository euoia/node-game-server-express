function Game() {
	this.players   = [];       // Array of Players
	this.map       = null;     // The Map.
	this.phase     = null;     // Current game phase
}

// Initialize the game.
Game.prototype.init = function (nrows, ncols) {

	this.phase = 'placement';

	/* Phase is always one of:
	 * placement - initial placement phase
	 * order - players are placing orders
	 * battle - orders are being carried out
	 */

	// Create a map.
	this.map = new Map (nrows, ncols);

	// Draw the map.
	this.map.drawHexGrid();
};

