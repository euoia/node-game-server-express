function UI(parentElementID) {
	// ---------------
	// Object Variables
	// Get the parent DOM element.
	this.parentElement = $('#' + parentElementID);

	// Store these in case we need to redraw or animate.
	this.gold = 0;             // Currently dislayed gold.
	this.thingsInPicker = [];  // Currently pickable things (TODO: define object).
	this.gamePhase = null;     // Current game phase.
	this.gamePhaseTime = null;     // Current game phase time remaining.


	this.goldElement = null;
	this.gamePhaseElement = null;
	this.gamePhaseTimeElement = null;
	this.thingPickerElement = null;

	/* thingsInPicker is an array of thingInPicker objects that have:
	 * 'element'  - The DOM element.
	 * 'thing'    - The thing config.
	 * 'selected' - true or false. //TODO!
	*/

	// ---------------

	// ---------------
	// Initialization

	// Gold
	$(this.parentElement).append ('<div class="UI" id="UI-gold"></div>');
	this.goldElement = $('#UI-gold');
	
	// Phase of the game
	$(this.parentElement).append ('<div class="UI" id="UI-gamePhase"></div>');
	this.gamePhaseElement = $('#UI-gamePhase');

	// Phase time remaining.
	$(this.parentElement).append ('<div class="UI" id="UI-gamePhaseTime"></div>');
	this.gamePhaseTimeElement = $('#UI-gamePhaseTime');

	// Thing picker
	$(this.parentElement).append ('<div class="UI" id="UI-thingPicker"></div>');
	this.thingPickerElement = $('#UI-thingPicker');

	// ---------------
	// Initialize events since this object is a dispatcher.
	Event.init(this);
}

UI.prototype.changeGold = function (newGold) {
	console.log ('Upating gold to ' + newGold);
	this.gold = newGold;
	$(this.goldElement).html('Gold: ' + this.gold);
};

UI.prototype.changeGamePhase = function (newGamePhase) {
	this.gamePhase = newGamePhase;
	$(this.gamePhaseElement).html('Game Phase: ' + this.gamePhase);
};

UI.prototype.changeGamePhaseTime = function (newGamePhaseTime) {
	this.gamePhaseTime = newGamePhaseTime;
	$(this.gamePhaseTimeElement).html('Time remaining: ' + this.gamePhaseTime + 's');
};
	
// Add 1 thing to the thing picker.
UI.prototype.pushThingPicker = function (newThing) {
	var thisUI,        // pointer to this object.
		thingElement,  // The DOM element for the thing in the picker.
		thingInPicker; // This thing in the picker.

	console.log ('Pushing onto thingsInPicker:');
	console.log (newThing);
	thisUI = this;

	thingElement = this.generateThingInPickerElement(newThing);
	thingInPicker = {
		'element'   : thingElement,
		'thing'     : newThing
	};

	$(thingElement).click( function () {
		thisUI.dispatch('thingSelected', {
			'thingInPicker' : thingInPicker
		});
	});

	this.thingsInPicker.push(thingInPicker);
};

UI.prototype.generateThingInPickerElement = function (thing) {
	var element; // the element to be returned.

	html = '';
	html += '<div class="icon"><img src="' + thing.picker_icon + '"></div>';
	html += '<div class="name">' + thing.name + '</div>';
	html += '<div class="cost">Cost: ' + thing.cost + '</div>';
	html += '<div class="range">Range: ' + thing.range + '</div>';
	html += '<div class="diechange">Chance to die: ' + thing.diechance + '</div>';

	element = $(document.createElement('div'));
	$(element).addClass('thingInPicker');
	$(element).html(html);

	return element;
};

// Select a thing from the picker. Only one thing can be selected.
UI.prototype.selectThing = function (thingInPicker) {
	var thingInPickerIdx; // thingInPicker iterator.

	for (thingInPickerIdx in this.thingsInPicker) {
		$(this.thingsInPicker[thingInPickerIdx].element).removeClass('selected');
	}

	$(thingInPicker.element).addClass('selected');

	// TODO: This is a bit of an ugly way to do this. We should check for
	// equality in the loop, but I was having problems with that...
};

UI.prototype.redrawThingPicker = function () {
	var
		thingIdx, // Thing iterator.
		thingsInPickerElement; // The things in the picker DOM element.

	// TODO: One day, we'll have buildings as well.
	this.thingPickerElement.html('<div class="title">Units available:</div>');

	// Construct the contents.
	thingsInPickerElement = $(document.createElement('div'));
	$(thingsInPickerElement).addClass('thingsInPicker');
    for (thingIdx in this.thingsInPicker) {
		thingsInPickerElement.append(this.thingsInPicker[thingIdx].element);
	}

	// Add the contents.
	this.thingPickerElement.append(thingsInPickerElement);
};

// Redraw the elements with their current values.
UI.prototype.redraw = function () {
	this.changeGold(this.gold);
	this.redrawThingPicker(this.units);
	this.changeGamePhase(this.gamePhase);
	this.changeGamePhaseTime(this.gamePhaseTime);
};

// Start the game phase timer and call finishedCallback when complete.
// time - time in seconds.
UI.prototype.startGamePhaseTimer = function (time, finishedCallback) {
	var thisUI; // this.

	thisUI = this;
	this.changeGamePhaseTime (time);

	setTimeout ( function () {
		thisUI.updateGamePhaseTimer(
			time - 1, // 1 second later
			finishedCallback
		);
	}, 1000);
};

// Update the game phase timer. If complete, calll the callback.
UI.prototype.updateGamePhaseTimer = function (time, finishedCallback) {
	var thisUI; // this.

	thisUI = this;
	this.changeGamePhaseTime (time);

	if (time <= 0) {
		finishedCallback();
	} else {
		setTimeout ( function () {
			thisUI.updateGamePhaseTimer(
				time - 1, // 1 second later
				finishedCallback
			);
		}, 1000);
	}
};

UI.prototype.thingSelected = function () {
	console.log ('UI thingSelected');
}
