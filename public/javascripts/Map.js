function Map(parentElementID, nrows, ncols) {
	console.log ('Creating new map on ' + parentElementID + ' with ' + nrows + ' rows and ' + ncols + 'cols');
    this.num_rows     = nrows;   // Number of rows of hexes on the map.
	this.num_cols     = ncols;   // Number of columns of hexes on the map.
	this.tile_width   = null;    // Width in pixels of each tile.
	this.tile_height  = null;    // Height in pixels of each tile.
	this.is_rotating  = [];      // Array of hexes that are rotating (TODO: Investigate).
	this.hexes        = [];      // 2D array of hexes.
	this.parentElement = $('#' + parentElementID); // Element in which to draw.
	
	// TODO: Figure out where these values actually come from. Have they been
	// fiddled based on the visible area of the hex?
	this.tile_width = 82;
	this.tile_height = 98;

	// this.hexes[n][n] each contains an object that looks like:
	// 'element'       - DOM element
	// 'terrain'       - grass or water
	// 'thing'         - a player thing: footman, archer, flag
	// 'thingPlayer'   - owner of the thing: 1, 2, or null (no thing present).
	// 'is_rotating'   - true or false
}

Map.prototype.drawHexGrid = function () {
	var row_i, // Loop iterator for the row index.
		col_i, // Loop iterator for the column index.
		this_map; // Pointer this 'this'.

	// ROW MAJOR
	console.log ('Drawing the grid (' + this.num_rows + ' by ' + this.num_cols + ')');

	for (row_i = 0; row_i < this.num_rows; row_i++) {
		//console.log ('Drawing row ' + row_i);
		this.hexes[row_i] = [];

		for (col_i = 0; col_i < this.num_cols; col_i++) {
			//console.log ('Drawing col ' + col_i);
			// Don't draw the odd columns on the last row
			if (row_i == this.num_rows && col_i % 2 == 1) {
				continue;
			}

			this.hexes[row_i][col_i] = this.initHex(row_i, col_i);
			this.updateHexTerrain(this.hexes[row_i][col_i], 'grass');

			this_map = this;
			$(this.hexes[row_i][col_i].element).click(function () {
				this_map.placeUnit(this, "footman");
			});
		}
	}
};

// TODO: Use row and col instead of xpos and ypos.
Map.prototype.initHex = function (row_i, col_i) {
	var xpos, ypos, y_offset;

	// Offset the y value on every other column.
	if (col_i % 2 == 1) {
		y_offset = this.tile_height / 2;
	} else {
		y_offset = 0;
	}

	ypos = this.tile_height * row_i + y_offset;
	xpos = this.tile_width * col_i;

	var id = row_i + '-' + col_i;
	//console.log ('Initializing hex ' + id);

	// Add to the DOM.
	$(this.parentElement).append('<div id="hex-' + id + '" class="hex">');

	// Position the hex.
	$('#hex-' + id).css('left', xpos);
	$('#hex-' + id).css('top', ypos);

	$('#hex-' + id).html('<br />' + id);

	/* Return the hex object. */
	return {
		'element'     : $('#hex-' + id),
		'terrain'     : null,
		'thing'       : null,
		'thingPlayer' : null,
		'is_rotating' : false
	};
};

Map.prototype.updateHexTerrain = function (hex, newTerrain) {
	hex.terrain = newTerrain;
	this.redrawHex(hex);
};

Map.prototype.updateHexThing = function (hex, newThing, newThingPlayer) {
	hex.thing       = newThing;
	hex.thingPlayer = newThingPlayer;
	this.redrawHex(hex);
}

Map.prototype.redrawHex = function (hex) {
	var thingFilename; // Filename of the thing.
	//console.log ('Redrawing hex:');
	//console.log(hex);

	if (hex.thing === null) {
		$(hex.element).css('background-image', 'images/hex-' + hex.terrain + '.png');
		return;
	}

	// TODO: May need to look to the config for the thing filename.
	thingFilename = 'images/hex-p' + hex.thingPlayer + '-' + hex.thing + '.png';

	$(hex.element).css('background-image', 'url(' + thingFilename + ')');
}

Map.prototype.placeUnit = function (hex, player, unit) {
	hex.thing = unit;
	hex.thingPlayer = player;
};

Map.prototype.getHex = function (position) {
	var row, // row index of the hex
		col; // col index position of the hex.

	if (position.row.pos !== undefined) {
		// X is defined by position
		if (position.row.pos > 0) {
			row = position.row.pos;
		} else {
			// Negative number, offset from right of map.
			row = this.num_cols + position.row.pos - 1;
		}
	} else if (position.row.pct !== undefined) {
		// X is defined by percentage
		if (position.row.pct > 0) {
			row = Math.ceil( (this.num_rows - 1) * position.row.pct);
		} else {
			row = this.num_rows + Math.floor(this.num_rows * position.row.pct);
		}
	} else {
		console.log(position);
		throw 'Unable to handle position object X pos.'
	}

	console.log ('getHex row = ' + row)

	if (position.col.pos !== undefined) {
		// Y is defined by position
		if (position.col.pos > 0) {
			col = position.col.pos;
		} else {
			// Negative number, offset from right of map.
			col = this.num_cols + position.col.pos - 1;
		}
	} else if (position.col.pct !== undefined) {
		// y is defined by percentage
		if (position.col.pct > 0) {
			col = Math.ceil( (this.num_cols - 1)* position.col.pct);
		} else {
			col = this.num_cols + Math.floor(this.num_cols * position.col.pct);
			// TODO: Test this rounding.
		}
	} else {
		console.log(position);
		throw 'Unable to handle position object.'
	}

	console.log ('getHex col = ' + col)

	return this.hexes[row][col];
}

Map.prototype.getNeighbourIDs = function (row_i, col_i) {
	var return_ids = new Array();
	row_i = parseInt(row_i, 10);
	col_i = parseInt(col_i, 10);

	/* Store a modified version of row_i based on column so we can use sensible coords */
	var row_i_mod;

	if (col_i % 2 == 1) {
		row_i_mod = row_i + 1;
	} else {
		row_i_mod = row_i;
	}

	/* Up-Left */
	if (row_i_mod - 1 > 0 && col_i - 1 > 0) {
		return_ids.push ([row_i_mod - 1, col_i - 1]);
	}

	/* Up */
	if (row_i - 1 > 0) {
		return_ids.push ([row_i - 1, col_i]);
	}

	/* Up-right */
	if (row_i_mod - 1 > 0 && col_i + 1 < this.num_cols) {
		return_ids.push ([row_i_mod - 1, col_i + 1]);
	}

	/* Down-Left */
	if (col_i - 1 > 0) {
		return_ids.push ([row_i_mod, col_i - 1]);
	}

	/* Down */
	if (row_i + 1 > 0) {
		return_ids.push ([row_i + 1, col_i]);
	}

	/* Down-right */
	if (col_i < this.num_cols) {
		return_ids.push ([row_i_mod, col_i + 1]);
	}

	return return_ids;
};

Map.prototype.rotate = function (domElement) {

	var match = new RegExp(/hex-(\d+)-(\d+)/).exec(domElement.id);
	var row_i = match[1];
	var col_i = match[2];

	rotateNeighbours (row_i, col_i);
	$(domElement).css('-webkit-animation', 'rotate360 1s infinite linear');
};

Map.prototype.placeUnit  = function (domElement, unit_name) {
	$(domElement).css('background-image', 'url("images/hex-' + unit_name + '.png")');
};

Map.prototype.addFlag  = function (xpos, ypos, player) {
	this.
	$(domElement).css('background-image', 'url("images/hex-' + unit_name + '.png")');
};


/* Junk / not used code */
// Rotations
//$(this.parentElement).append('<div id="hex-' + id + '" class="hex" onclick="rotate(this)" />')
/*
Map.prototype.rotateNeighbours  = function (row_i, col_i) {
	console.log ('rotateNeighbours ' + row_i + ' ' + col_i);
	var neighbours = getNeighbourIDs(row_i, col_i);

	var neighbour_id;
	var n_row_i, n_col_i;
	for (var i = 0; i < neighbours.length; i++) {
		n_row_i = neighbours[i][0];
		n_col_i = neighbours[i][1];

		neighbour_id = 'hex-' + n_row_i + '-' + n_col_i;

		$('#' + neighbour_id).css('-webkit-animation', 'rotate360 1s infinite linear');

		if (this.is_rotating[n_row_i][n_col_i] === false) {
			this.is_rotating[n_row_i][n_col_i] = true;
			setTimeout('rotateNeighbours(' + neighbours[i][0] + ', ' + neighbours[i][1] + ')', 500);
		}
	}
};
*/
