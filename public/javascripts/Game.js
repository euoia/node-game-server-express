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
	this.net        = null;     // Net object.

	this.browser    = new Browser(); // Browser object for browser features.
	Event.init(this);
}

// Initialize the game.
Game.prototype.init = function (stageElementID) {
	this.stage_element_id = stageElementID;
	
	// Connect to the server.
	//this.net.send('login', {'username':'jpickard'}, this.loginResponseReceived, this);
	
	this.net = new Net();
	this.net.send('getConfig', {}, this.getConfigResponseReceived, this);
};

Game.prototype.loginResponseReceived = function () {
	console.log('loginResponseReceived');
	this.net.send('getConfig', {}, this.getConfigResponseReceived, this);
};

Game.prototype.getConfigResponseReceived = function (configResponse) {
	var thisGame = this,   // this object.
		flagIdx,           // Flag iterator index.
		hex,               // Temporary hex object.
		thingIdx,          // Thing iterator index.
		player,            // Player instance.
		playerIdx;         // Player iterator.
		
	console.log('getConfigResponseReceived.');
	
	// Set the config.
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
	this.ui.changeGold(this.config.starting_gold);
	
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
	
	// Attempt to start the game.
	this.net.longPoll('startGame', {}, this.startGame, this);
	this.ui.changeNotice ('Waiting for second player to join.');
};

Game.prototype.startGame = function (startGameResponse) {
	var playerIdx; // Iterator for player object that comes back from startGameResponse.
	
	this.ui.resetNotice ();
	if (startGameResponse.status === 'error') {
		// Nothing more we can do here.
		this.ui.changeNotice ('Error occurred: ' + startGameResponse.message);
		return;
	}
	
	this.player_num = startGameResponse.playerNum;
	
	// Create the players.
	// Add information about the player's received from the server.
	for (playerIdx in startGameResponse.players) {
		this.getPlayerByNum(
			startGameResponse.players[playerIdx].playerNum).username = 
			startGameResponse.players[playerIdx].username;
	}
	
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
Game.prototype.getPlayerByNum = function (
	playerNum)
{
	var playerIdx;

	for (playerIdx in this.players) {
		if (this.players[playerIdx].player_num === playerNum) {
			return this.players[playerIdx];
		}
	}

	console.log ('ERROR: Invalid player number ' + playerNum);
	return null;
};

// Return the player object given the username.
Game.prototype.getPlayer = function (
	username)
{
	var playerIdx;

	for (playerIdx in this.players) {
		if (this.players[playerIdx].username === username) {
			return this.players[playerIdx];
		}
	}

	console.log ('ERROR: Invalid player username ' + username);
	return null;
};

// Sugar.
Game.prototype.thisPlayer = function () {
	return this.getPlayerByNum(this.player_num);
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
	
	$(document).bind(this.browser.touchMove, function mouseMove (moveEvent) {
		console.log('moved');
		console.log (moveEvent);
		
		// calculate angle between start and move.
		xDiff = moveEvent.clientX - eventObj.startEvent.clientX;
		yDiff = moveEvent.clientY - eventObj.startEvent.clientY;
		
		// Angle from -180 to +180 degrees.
		angle = Math.atan2 (xDiff, yDiff)  * (180/Math.PI);
		angle = angle + 180; // 0 to 360; easier to reason about.
		
		// Get the neighbour at that angle.
		hexNeighb = thisGame.map.getHexNeighbour(
			eventObj.hex,
			thisGame.map.angleToNeighbName(angle));
			
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
	
	$(document).bind(this.browser.touchEnd, function mouseUp () {
		console.log ('mouse up');
		eventObj.hex.element.removeClass('selected');
		$(document).unbind(thisGame.browser.touchMove);
		$(document).unbind(thisGame.browser.touchEnd);
		
		if (eventObj.hex.thingMoveTarget !== null) {
			thisGame.map.arrowFromTo (
				eventObj.hex,
				eventObj.hex.thingMoveTarget);
		}
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
	
	console.log('adding to phasePlacements');
	this.thisPlayer().phasePlacements.push(eventObj.hex);
	
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
	console.log ('Ending placement phase.');
	
	this.net.send(
		'doPlacements',
		{'placements' : 
			this.net.formatPlacements(this.thisPlayer().phasePlacements)},
		this.resolvePlacementPhase,
		this);
		
	this.ui.changeNotice ('Waiting for second player to place.');
	this.ui.hideDoneButton();
};

// Receive response from server regarding the placement phase.
Game.prototype.resolvePlacementPhase = function (doPlacementsResponse) {
	var placements,         // Placements for all players.
		playerPlacements,   // Placements for a single player.
		playerName,    // Iterator for the placements object.
		placementIdx,  // Iterator for the placement array.
		placement;     // A single item in the placement array.
	
	this.ui.resetNotice ();
	console.log('Placements received:');
	console.log(doPlacementsResponse);
	
	placements = doPlacementsResponse.placements;
	for (playerName in placements) {
		
		// One per player.
		if (playerName !== this.thisPlayer().username) {
			playerPlacements = placements[playerName];
			console.log ('Placing for ' + playerName);
			console.log (playerPlacements);
			
			// Place other players' things.
			for (placementIdx in playerPlacements) {
				placement = playerPlacements[placementIdx];
				console.log ('Placing:');
				console.log (placement);
				
				this.map.placeThing (
					this.map.hexes[placement.row][placement.col],
					this.getPlayer(playerName).player_num,	
					this.config.things[placement.thingName]);
			}
		}
	}
	
	this.beginOrderPhase();
};

Game.prototype.beginOrderPhase = function () {
	this.phase_end_callback = this.endOrderPhase;
	this.changePhase('order');
};

Game.prototype.endOrderPhase = function () {
	console.log ('Ending order phase.');
	
	this.net.send(
		'doOrders',
		{'orders' : this.net.formatOrders(this.map)},
		this.beginBattlePhase,
		this);
		
	this.ui.changeNotice ('Waiting for second player to complete orders.');
	this.ui.hideDoneButton();
};


Game.prototype.beginBattlePhase = function (doOrdersResponse) {
	var thisGame = this,
		phaseChangeDone; // callback for when the phase change animation is complete.
	
	this.ui.resetNotice ();
	
	phaseChangeDone = function () {
		this.map.clearArrows();
		thisGame.performOrders(doOrdersResponse.orders);
		thisGame.beginOrderPhase();
	};
	
	this.changePhase('battle', phaseChangeDone);
};

Game.prototype.performOrders = function (orders) {
	var playerIdx,       // Iterator for the players.
		playerOrders,    // Array of orders for a single player.
		orderIdx, // Iterator for orders.
		order,    // Shortcut.
		row,
		col;
		
	console.log ('Performing orders:');
	console.log (orders);
		
	// Overwrite local orders with server ones.
	// TODO: Should really clear local orders first.
	for (playerIdx in orders) {
		playerOrders = orders[playerIdx];
		
		for (orderIdx in playerOrders) {
			order = playerOrders[orderIdx];
			
			console.log ('Performing order:');
			console.log (order);
		
			this.map.hexes[order.moveFrom.row][order.moveFrom.col].thingMoveTarget =
				this.map.hexes[order.moveTo.row][order.moveTo.col];
		}
	}
	
	// Do the moves.
	for (row in this.map.hexes) {
		for (col in this.map.hexes[row]) {
			console.log ('Moving units row=' + row + ' col=' + col);
			this.map.move(this.map.hexes[row][col]);
		}
	}
};
