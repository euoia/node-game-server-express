function Game(config) {
	this.players    = [];       // Array of Players
	this.map        = null;     // The Map.
	this.phase      = null;     // Current game phase
	this.player_num = null;     // The player who's perspective this is (1 [left] or 2 [right])
	this.ui         = null;

	this.config     = config;     // Configuration object.

	Event.init(this);
}

// Initialize the game.
Game.prototype.init = function (
	stageElementID,
	playerNum
) {
	var flagIdx,  // Flag iterator index.
		hex,      // Temporary hex object.
		thingIdx; // Thing iterator index.

	this.phase = 'placement';

	this.player_num = playerNum;

	/* Phase is always one of:
	 * placement - initial placement phase
	 * order - players are placing orders
	 * battle - orders are being carried out
	 */

	// Create a map.
	this.map = new Map (stageElementID, this.config.map_rows, this.config.map_cols);

	// Draw the map.
	this.map.drawHexGrid();

	// Create the players.
	this.players.push (new Player(1, this.config.starting_gold));
	this.players.push (new Player(2, this.config.starting_gold));

	// Create the UI
	this.ui = new UI(stageElementID);
	this.ui.changeGold(this.thisPlayer().gold);
	this.ui.changeGamePhase(this.phase);

	// Add the flags
	for (flagIdx in this.config.flags) {
		hex = this.map.getHex(this.config.flags[flagIdx].position);

		this.map.updateHexThing (
			hex, 
			this.config.things['flag'],
			this.config.flags[flagIdx].player_num);
	}

	// Add pickable units
	for (thingIdx in this.config.things ) {
		if (this.config.things[thingIdx].cost === 0) {
			// Cost 0 means do not display.
			continue
		}

		this.ui.pushThingPicker(this.config.things[thingIdx]);
	}
	
	this.ui.redraw();

	/* Event listeners. */

	// Events dispatched by ui.
	this.ui.listen ('thingSelected', this.thingSelected, this);

	// Events dispatched by map.
	this.map.listen ('hexClicked', this.hexClicked, this);
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

// Sugar.
Game.prototype.thisPlayer = function () {
	return this.getPlayer(this.player_num);
};
 
Game.prototype.thingSelected = function ( eventObj ) {
	console.log ('A thing was selected.');
	console.log (eventObj);
	console.log (this);
	this.ui.selectThing(eventObj.thingInPicker);
	this.thisPlayer().selectedThing = eventObj.thingInPicker;
};

Game.prototype.hexClicked = function ( eventObj ) {
	var selectThing; // Thing currently selected by this player.

	selectedThing = this.thisPlayer().selectedThing;

	this.map.placeThing(eventObj.hex, this.player_num, selectedThing.thing);

	// TODO: hook these up using events.
	this.thisPlayer().gold -= selectedThing.thing.cost;
	this.ui.changeGold(this.thisPlayer().gold);
};

