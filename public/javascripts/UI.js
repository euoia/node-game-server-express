function UI(parentElementID) {
	var thisUI = this;
	
	// ---------------
	// Object Variables
	// Get the parent DOM element.
	this.parentElement = $('#' + parentElementID);

	// Store these in case we need to redraw or animate.
	this.gold = 0;              // Currently dislayed gold.
	this.thingsInPicker = [];   // Currently pickable things (TODO: define object).
	this.gamePhase = null;      // Current game phase.
	this.gamePhaseTime = null;  // Current game phase time remaining.
	this.title = null;          // Current title.
	this.timerState = null;     // 'running' or 'stopped'


	this.goldElement = null;
	this.gamePhaseElement = null;
	this.gamePhaseTimeElement = null;
	this.thingPickerElement = null;
	this.titleElement = null;
	this.doneButtonElement = null; // Button to end phase.

	/* thingsInPicker is an array of thingInPicker objects that have:
	 * 'element'  - The DOM element.
	 * 'thing'    - The thing config.
	 * 'selected' - true or false. //TODO!
	*/

	// ---------------

	// ---------------
	// Initialization

	// ---------------
	// Initialize events since this object is a dispatcher.
	Event.init(this);

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

	// End Phase button.
	$(this.parentElement).append ('<div class="UI" id="UI-doneButton"></div>');
	this.doneButtonElement = $('#UI-doneButton');
	this.doneButtonElement.html('Done');
	this.doneButtonElement.click (function doneButtonClicked () {
			thisUI.dispatch('doneButtonClicked');
		});

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
	var text; // Text to set the element to.
	
	this.gamePhaseTime = newGamePhaseTime;
	
	if (newGamePhaseTime === undefined) {
		text = 'Paused.';
	} else if (typeof(newGamePhaseTime) === 'number') {
		text = 'Time remaining: ' + this.gamePhaseTime + 's';	
	} else {
		text = 'Time remaining: ' + this.gamePhaseTime;	
	}
	
	$(this.gamePhaseTimeElement).html(text);

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
	this.resetPicker();
	$(thingInPicker.element).addClass('selected');

};

// Reset the picker to an unselected state.
UI.prototype.resetPicker = function () {
	var thingInPickerIdx; // thingInPicker iterator.

	for (thingInPickerIdx in this.thingsInPicker) {
		// TODO: This is a bit of an ugly way to do this. We should check for
		// equality in the loop, but I was having problems with that...
		$(this.thingsInPicker[thingInPickerIdx].element).removeClass('selected');
	}
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
UI.prototype.startGamePhaseTimer = function (time, finishedCallback, scope) {
	var thisUI; // this.

	thisUI = this;
	this.changeGamePhaseTime (time);
	this.timerState = 'running';

	setTimeout ( function () {
		thisUI.updateGamePhaseTimer(
			time - 1, // 1 second later
			finishedCallback,
			scope
		);
	}, 1000);
};

// Update the game phase timer. If complete, calll the callback.
UI.prototype.updateGamePhaseTimer = function (time, finishedCallback, scope) {
	var thisUI; // this.
	
	if (this.timerState !== 'running') {
		console.warn ('Timer has been stopped.');
		return;
	}

	thisUI = this;
	this.changeGamePhaseTime (time);
	
	if (time <= 0) {
		finishedCallback.call (scope);
	} else {
		setTimeout ( function () {
			thisUI.updateGamePhaseTimer(
				time - 1, // 1 second later
				finishedCallback,
				scope);
		}, 1000);
	}
};

// Stop the timer.
UI.prototype.stopGamePhaseTimer = function () {
	this.timerState = 'stopped';
};


UI.prototype.thingSelected = function () {
	console.log ('UI thingSelected');
};

// Overlay a big title in the middle of the screen.
UI.prototype.changeTitle = function (title) {
	if (this.titleElement === null) {
		$(this.parentElement).append ('<div class="UI" id="UI-title"></div>');
		this.titleElement = $('#UI-title');
	}
	
	this.titleElement.html(title);
};

UI.prototype.removeTitle = function () {
	$(this.titleElement).remove();
	this.titleElement = null;
};

UI.prototype.showDoneButton = function () {
	this.doneButtonElement.show();
	this.doneButtonElement.addClass('button-flash');
};

UI.prototype.hideDoneButton = function () {
	this.doneButtonElement.hide();
	this.doneButtonElement.removeClass('button-flash');
};
