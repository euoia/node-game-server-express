function Game() {

	this.stage_element_id  = null;       // ID of the stage element.
	this.players     = [];       // Array of Players
	this.map         = null;     // The Map.
	this.phase       = null;     // Current game phase object.
	this.player_nums = [];       // Array of player numbers.
	this.player_num  = null;     // The player who's perspective this is (1 [left] or 2 [right])
	this.ui          = null;     // The instance of UI.
	this.phase_end_callback = null; // Called when the current phase ends.

	this.config     = null;     // Configuration object (retrieved from server).
	
	this.net        = null;         // Net object.

	Event.init(this);
}

// Initialize the game.
Game.prototype.init = function (
	stageElementID,
	playerNum)
{
	this.stage_element_id = stageElementID;
	this.player_num = playerNum;
	
	// Connect to the server.
	this.net = new Net();
	this.net.login('jpickard', this.loginResponseReceived, this);
};

Game.prototype.loginResponseReceived = function () {
	console.log('loginResponseReceived');
	this.net.getConfig(this.getConfigResponseReceived, this);
};

Game.prototype.getConfigResponseReceived = function (configResponse) {
	var thisGame = this,   // this object.
		flagIdx,           // Flag iterator index.
		hex,               // Temporary hex object.
		thingIdx,          // Thing iterator index.
		player,            // Player instance.
		playerIdx;         // Player iterator.

	console.log('getConfigResponseReceived.');
	this.config = configResponse;
	
	// Create a map.
	this.map = new Map (this.stage_element_id, this.config.map_rows, this.config.map_cols);

	// Draw the map.
	this.map.drawHexGrid();

	// Create the players.
	for (playerIdx in this.config.players) {
		player = new Player(this.config.players[playerIdx]);
		player.gold = this.config.starting_gold;
		this.players.push(player);
	}

	// Create the UI
	this.ui = new UI(this.stage_element_id);
	this.ui.changeGold(this.thisPlayer().gold);
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
	
	this.beginPlacementPhase();

	/* Event listeners. */
	// Events dispatched by ui.
	this.ui.listen ('thingSelected', this.thingSelected, this);
	this.ui.listen ('doneButtonClicked', this.endCurrentPhase, this);

	// Events dispatched by map.
	this.map.listen ('hexClicked', this.hexClicked, this);
	this.map.listen ('hexTouchStart', this.hexTouchStart, this);
	
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

// Reset placement area highlight.
Game.prototype.resetHighlightPlacementAreas = function (playerNum) {
	var areaIdx; // Iterator.

	for (areaIdx in this.thisPlayer().placement_areas) {
		this.map.unHighlightArea(
			this.thisPlayer().placement_areas[areaIdx],
			'placementArea');
	}
};

// Highlight placement areas. 
Game.prototype.highlightPlacementAreas = function (playerNum) {
	var areaIdx; // Iterator.

	for (areaIdx in this.thisPlayer().placement_areas) {
		this.map.highlightArea(
			this.thisPlayer().placement_areas[areaIdx],
			'placementArea',
			function testHex (hex) {
				return (hex.thing === null);
			});
	}
};

Game.prototype.thingSelected = function ( eventObj ) {
	console.log ('A thing was selected.');
	console.log (eventObj);
	console.log (this.thisPlayer());
	
	if (this.phase.canPlaceThings !== true) {
		console.log('Cannot place things in this phase.');
		return;
	}

	if (this.thisPlayer().selected_thing === null) {
		// First selected thing.
		console.log('Nothing was previously selected, highlighting placement areas.');
		this.highlightPlacementAreas (this.player_num);
	}

	this.ui.selectThing(eventObj.thingInPicker);
	this.thisPlayer().selectedThing = eventObj.thingInPicker;
};

// Try to move the thing.
Game.prototype.hexTouchStart = function ( eventObj ) {
	var thisGame = this,
		xDiff,
		yDiff,
		angle,
		hexNeigh;
	
	console.log ('hexTouchStart');
	console.log (eventObj);
	
	if (this.phase.canMoveThings !== true) {
		console.log('Cannot move things in this phase.');
		return;
	}
	
	if (eventObj.hex.thing === null) {
		console.log('Nothing there to move.');
		return;
	}
	
	eventObj.hex.element.addClass('selected');
	
	$(document).bind('mousemove', function mouseMove (moveEvent) {
		console.log('moved');
		console.log (moveEvent);
		
		// calculate angle between start and move.
		xDiff = moveEvent.clientX - eventObj.startEvent.clientX;
		yDiff = moveEvent.clientY - eventObj.startEvent.clientY;
		
		// Angle from -180 to +180 degrees.
		angle = Math.atan2 (xDiff, yDiff)  * (180/Math.PI);
		angle = angle + 180; // 0 to 360; easier to reason about.
		
		// Calculate which neighbour to highlight.
		// Angle starts at 0 directly up, and increases counter-clockwise.
		if (angle >= 30 && angle < 90) {
			hexNeighb = thisGame.map.getHexNeighbour(eventObj.hex, 'up-left');
			console.log('up left');
		} else if (angle >= 90 && angle < 150) {
			hexNeighb = thisGame.map.getHexNeighbour(eventObj.hex, 'down-left');
			console.log('down left');
		} else if (angle >= 150 && angle < 210) {
			hexNeighb = thisGame.map.getHexNeighbour(eventObj.hex, 'down');
			console.log('down');
		} else if (angle >= 210 && angle < 270) {
			hexNeighb = thisGame.map.getHexNeighbour(eventObj.hex, 'down-right');
			console.log('down right');
		} else if (angle >= 270 && angle < 330) {
			hexNeighb = thisGame.map.getHexNeighbour(eventObj.hex, 'up-right');
			console.log('up right');
		} else  {
			hexNeighb = thisGame.map.getHexNeighbour(eventObj.hex, 'up');
			console.log('up');
		}
		
		if (hexNeighb.thing !== null) {
			console.log ('Something already there.');
		} else if (hexNeighb !== null) { 
			if (eventObj.hex.thingMoveTarget !== null) {
				eventObj.hex.thingMoveTarget.element.removeClass('selected');
			}
			eventObj.hex.thingMoveTarget = hexNeighb;
			eventObj.hex.thingMoveTarget.element.addClass('selected');
			console.log('Updating thingMoveTarget');
			console.log(eventObj.hex);
		}
	});
	
	$(document).bind('mouseup', function mouseUp () {
		console.log ('mouse up');
		$(document).unbind('mousemove');
		$(document).unbind('mouseup');
	});
};

Game.prototype.hexClicked = function ( eventObj ) {
	var thisGame = this,
		selectThing,           // Thing currently selected by this player.
		playerPlacementAreas;  // The player's placement area.

	console.log('hexClicked');
	if (this.phase.canPlaceThings !== true) {
		console.log('Cannot place things in this phase.');
		return;
	}
	
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

// Start a new phase. Once the phase is started call phasechangeDoneCallback.
Game.prototype.changePhase = function (
	newPhase,
	phaseChangeDoneCallback
) {
	var thisGame = this;
	
	this.phase = this.config.phases[newPhase];
	
	this.ui.changeGamePhase(this.phase.title);
	this.ui.changeGamePhaseTime(this.phase.time);
	
	// TODO: Perhaps abstract the class change into UI.
	if (this.phase.canPlaceThings === true) {
		this.ui.thingPickerElement.removeClass('disabled');
	} else {
		this.resetHighlightPlacementAreas();
		
		this.ui.thingPickerElement.addClass('disabled');
		this.ui.resetPicker();
		this.thisPlayer().selected_thing = null; //TODO: Make this an event.
	}
	
	this.ui.changeTitle(this.phase.title + ' phase');
	this.ui.titleElement.removeClass('title-fade-out');
	
	// Limitation of webkit animations is that they must be applied afer a delay.
	// TODO: Investigate alternatives.
	setTimeout (function fadeTitle () {
			thisGame.ui.titleElement.addClass('title-fade-out');
		}, 1);
	
	// Remove the title DOM element so player can select hexes.
	// TODO: Decouple this from the CSS animation time.
	this.ui.hideDoneButton();
	
	// After the title has been removed set up the next phase.
	setTimeout (function removeTitleTimeout () {
			thisGame.ui.removeTitle();
			
			if (thisGame.phase.time !== undefined) {
				thisGame.ui.showDoneButton();
				thisGame.ui.startGamePhaseTimer(
					thisGame.phase.time,
					thisGame.endCurrentPhase,
					thisGame);
			}
					
			console.log('phaseChangeDone:');
			console.log(phaseChangeDoneCallback);
			if (phaseChangeDoneCallback !== undefined) {
				phaseChangeDoneCallback();
			}
		}, 3000);
};

Game.prototype.endCurrentPhase = function () {
	var callback; // Save it incase the callback resets it.
	
	console.log(this.phase_end_callback);
	this.ui.stopGamePhaseTimer();
	if (this.phase_end_callback !== null) {
		
		callback = this.phase_end_callback;
		this.phase_end_callback = null;
		callback.call(this);
	}
};

Game.prototype.beginPlacementPhase = function () {
	this.phase_end_callback = this.endPlacementPhase;	
	this.changePhase('placement');
};

Game.prototype.endPlacementPhase = function () {
	this.beginOrderPhase();
};

Game.prototype.beginOrderPhase = function () {
	this.phase_end_callback = this.beginBattlePhase;
	this.changePhase('order');
};

Game.prototype.beginBattlePhase = function () {
	var thisGame = this,
		phaseChangeDone; // callback for when the phase change animation is complete.
	
	phaseChangeDone = function () {
		thisGame.moveUnits();
		thisGame.beginOrderPhase();
	};
	
	this.changePhase('battle', phaseChangeDone);
};

Game.prototype.moveUnits = function () {
	var row,
		col;
		
	console.log ('Moving units');
		
	for (row in this.map.hexes) {
		for (col in this.map.hexes[row]) {
			console.log ('Moving units row=' + row + ' col=' + col);
			this.map.move(this.map.hexes[row][col]);
		}
	}
};
