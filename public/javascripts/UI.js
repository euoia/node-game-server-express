function UI(parentElementID) {
	// ---------------
	// Object Variables
	// Get the parent DOM element.
	this.parentElement = $('#' + parentElementID);

	// Store these in case we need to redraw or animate.
	this.gold = 0;            // Currently dislayed gold.
	this.unitsInPicker = [];  // Currently pickable units (TODO: define object).
	this.gamePhase = null;    // Current game phase.

	this.goldElement = null;
	this.gamePhaseElement = null;
	this.unitPickerElement = null;
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

	// Unit picker
	$(this.parentElement).append ('<div class="UI" id="UI-unitPicker"></div>');
	this.unitPickerElement = $('#UI-unitPicker');
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

// TODO: Will be more complicated.
UI.prototype.changeUnitPicker = function (newUnits) {
	var unit_i; // Unit index;

	this.units = newUnits;

	$(this.unitPickerElement).html('Units available: ');
    for (unit_i in this.units) {
		// ...
	}
};
	

// Redraw the elements with their current values.
UI.prototype.redraw = function () {
	this.changeGold(this.gold);
	this.changeUnitPicker(this.units);
	this.changeGamePhase(this.gamePhase);
}
