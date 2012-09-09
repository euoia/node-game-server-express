function Player(player_num, gold) {
	this.player_num      = player_num;    // Player num (either 1 [left] or 2 [right])
	this.gold 	         = gold;          // Amount of gold this player has.
	this.things_unspent  = [];            // Array of unspent things (units|buildings)
	this.things_onmap    = [];            // Array of things on the map.
	this.selected_thing  = null;          // Currently selected thing.
}


