function Player(player) {
    var key; // Object key for player.

	this.username         = null;   // The player's username.
	this.player_num       = null;   // Player num (either 1 [left] or 2 [right])
	this.gold 	          = null;   // Amount of gold this player has.
	this.things_unspent   = [];     // Array of unspent things (units|buildings)
	this.things_onmap     = [];     // Array of things on the map.
	this.selected_thing   = null;   // Currently selected thing.
    this.placement_areas  = [];     // Array of areas corresponding to placement area.
	
	this.phasePlacements  = [];   // Array of hexes placed in this phase.
	this.phaseMoves       = [];   // Array of moves made in this phase.
    
    for (key in player) {
        console.log ('overriding ' + key);
        this[key] = player[key];
    }
}


