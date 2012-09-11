function UI(parentElementID) {
	// ---------------
	// Object Variables
	// Get the parent DOM element.
	this.parentElement = $('#' + parentElementID);

	// Store these in case we need to redraw or animate.
	this.gold = 0;             // Currently dislayed gold.
	this.thingsInPicker = [];  // Currently pickable things (TODO: define object).
	this.gamePhase = null;     // Current game phase.

	this.goldElement = null;
	this.gamePhaseElement = null;
	this.thingPickerElement = null;

	/* thingsInPicker is an array of objects that have:
	 * 'element' - The DOM element.
	 * 'thing'   - The thing config.
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
	console.log ('UI created');

	// Thing picker
	$(this.parentElement).append ('<div class="UI" id="UI-thingPicker"></div>');
	this.thingPickerElement = $('#UI-thingPicker');
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

	
// Add 1 thing to the thing picker.
UI.prototype.pushThingPicker = function (newThing) {
	var thingElement,  // The DOM element for the thing in the picker.
		thing;         // The thing.

	console.log ('Pushing onto thingsInPicker:');
	console.log (newThing);

	thingElement = this.generateThingInPickerElement(newThing);
	thing = {
		'element'   : thingElement,
		'thing'     : newThing
	};

	this.thingsInPicker.push(thing);
};

UI.prototype.generateThingInPickerElement = function (thing) {
	var element; // the element to be returned.

	html = '';
	html += '<div class="icon"><img src="' + thing.hex_icon + '"></div>';
	html += '<div class="name">' + thing.name + '</div>';
	html += '<div class="cost">Cost: ' + thing.cost + '</div>';
	html += '<div class="range">Range: ' + thing.range + '</div>';
	html += '<div class="diechange">Chance to die: ' + thing.diechance + '</div>';

	element = $(document.createElement('div'));
	$(element).addClass('thingInPicker');
	$(element).click( function () {
		console.log (this);
		$(this).addClass('selected');
	});

	$(element).html(html);

	return element;
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
}


// Redraw the elements with their current values.
UI.prototype.redraw = function () {
	this.changeGold(this.gold);
	this.redrawThingPicker(this.units);
	this.changeGamePhase(this.gamePhase);
}
