/* Singleton class for game configuration. */
function Config() {
    this.starting_gold = 200;
    this.map_rows      = 11;
    this.map_cols      = 19;
	
	// Dev settings
    //this.map_rows      = 8;
    //this.map_cols      = 8;

    // thing (unit/building) config
    this.things = {
        'footman' : {
            'name'            : 'footman', // display name
            'cost'            : 25,
            'picker_icon'     : '/images/hex-footman.png', // partial filename
            'range'           : 1,
            'diechance'       : 0.9
        },
        'archer' : {
            'name'            : 'archer', // display name
            'cost'            : 40,
            'picker_icon'     : '/images/hex-archer.png', // icon in picker
            'range'           : 2,
            'diechance'       : 1.0
        },
        'flag' : {
            'name'            : 'flag' // display name
            // No cost means do not display in picker.
        }
    };

    // Flags to be captured.
    this.flags = [{
        'player_num' : 1,
        'position'   : {'row' : {'pct' : 0.5}, 'col' : {'idx': 3}}
    }, {
        'player_num' : 2,
        'position'   : {'row' : {'pct' : 0.5}, 'col' : {'idx': -3}}
    }];


    // Defaults for players.
    this.players = [{
        'player_num'  : 1,
        'placement_areas' : [{
            'rowMin' : {'pct' : 0},
            'rowMax' : {'pct' : 1},
            'colMin' : {'pct' : 0},
            'colMax' : {'idx' : 3}
        }]
    } , {
        'player_num'  : 2,
        'placement_areas' : [{
            'rowMin' : {'pct' : 0},
            'rowMax' : {'pct' : 1},
            'colMin' : {'idx' : -3},
            'colMax' : {'pct' : 1}
        }]
    }];

    this.phases = {
        'placement' : {
			'title' : 'placement',
			'time' : 560,
			'canPlaceThings' : true,
			'canMoveThings' : false
		},
        'order' : {
			'title' : 'order',
			'time' : 590,
			'canPlaceThings' : false,
			'canMoveThings' : true
		},
        'battle' : {
			'title' : 'battle',
			'canPlaceThings' : false,
			'canMoveThings' : false
		}
    };



    /* areas:
     * Areas are inclusive (they include the max hex).
     * Min MUST BE less than Max. */

    /* Ways of selecting a tile, or multuple tiles: */
    /* Position object, has x and y values. */
    /* row and col values must be a either:
     * 1) 'idx' (index, can be negative to indicate distance from
     *    right or bottom of map; can be 'MAX' to indicate rightmost hex).
     * 2) 'pct' (percentage value < 1.0 , can be negative  to indicate
     *    distance from right or bottom of map).
    */
}

// Given a config item, return only those items which correspond to
// player=playerNum.
Config.prototype.filterByPlayer = function ( configItem, playerNum ) {
    // TODO: Can probably use some kind of filter function for this.

    var configItemIdx,   // Iterator for config item.
        retVal = [];     // Array to be returned.

    for (configItemIdx in configItem) {
        if (configItem[configItemIdx].player_num === playerNum) {
            retVal.push(configItem[configItemIdx]);
        }
    }

    return retVal;
};

module.exports = Config;
