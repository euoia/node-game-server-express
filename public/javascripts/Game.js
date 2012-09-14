function Game(config) {
	this.players	 = [];		 // Array of Players
	this.map		 = null;	 // The Map.
	this.phase		 = null;	 // Current game phase
	this.player_nums = [];		 // Array of player numbers.
	this.player_num  = null;	 // The player who's perspective this is (1 [left] or 2 [right])
	this.ui			 = null;	 // The instance of UI.

	this.config		= config;	  // Configuration object.

	Event.init(this);
}

// Initialize the game.
Game.prototype.init = function (
	stageElementID,
	playerNum
) {
	var flagIdx,	   // Flag iterator index.
		hex,		   // Temporary hex object.
		thingIdx,	   // Thing iterator index.
		player,		   // Player instance.
		playerIdx;	   // Player iterator.

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
	for (playerIdx in this.config.players) {
		player = new Player(this.config.players[playerIdx]);
		player.gold = this.config.starting_gold;
		this.players.push(player);
	}

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
		if (this.config.things[thingIdx].cost === undefined) {
			// Cost 0 means do not display.
			continue;
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


/* Highlight placement areas. */
Game.prototype.highlightPlacementAreas = function (playerNum) {
	var areaIdx; // Iterator.


	for (areaIdx in this.thisPlayer().placement_areas) {
		this.map.highlightArea(
			this.thisPlayer().placement_areas[areaIdx],
			'placementArea',
			function (hex) {
				return (hex.thing === null);
			});
	}
};

 
Game.prototype.thingSelected = function ( eventObj ) {
	console.log ('A thing was selected.');
	console.log (eventObj);
	console.log (this.thisPlayer());

	if (this.thisPlayer().selected_thing === null) {
		// First selected thing.
		console.log('Nothing was selected, highlighting placement areas.');
		this.highlightPlacementAreas (this.player_num);
	}

	this.ui.selectThing(eventObj.thingInPicker);
	this.thisPlayer().selectedThing = eventObj.thingInPicker;
};

Game.prototype.hexClicked = function ( eventObj ) {
	var selectThing,		   // Thing currently selected by this player.
		playerPlacementAreas;  // The player's placement area.

	selectedThing = this.thisPlayer().selectedThing;

	if (selectedThing === undefined) {
		console.log('Nothing selected.');
		return;
	}

	if (eventObj.hex.thing !== null) {
		console.log('Already something there.');
		return;
	}

	if (this.thisPlayer().gold < selectedThing.thing.cost) {
		console.log('Not enough gold.');
		return;
	}

	// Check area is in placement area.
	playerPlacementAreas = this.map.getAreasHexes(
		this.thisPlayer().placement_areas);

	console.log('playerPlacementAreas:');
	console.log(playerPlacementAreas);

	if (playerPlacementAreas.indexOf(eventObj.hex) == -1) {
		console.log ('Hex is outside placement area.');
		return;
	}


	// Just for testing.
	this.map.placeThing(eventObj.hex, this.player_num, selectedThing.thing);
	eventObj.hex.element.removeClass('placementArea');

	// TODO: hook these up using events.
	this.thisPlayer().gold -= selectedThing.thing.cost;
	this.ui.changeGold(this.thisPlayer().gold);
};

