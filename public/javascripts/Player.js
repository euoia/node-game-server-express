function Player() {
	this.player_num     = null;    // Player num (either 1 [left] or 2 [right])
	this.gold 	        = 0;       // Amount of gold this player has.
	this.units_unspent  = [];      // Array of unspent units
	this.bulds_unspect  = [];      // Array of unspent buildings
	this.units_onmap    = [];      // Array of units on the map.
	this.bulds_onmap    = [];      // Array of building on the map
}


