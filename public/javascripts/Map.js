function Map(nrows, ncols) {
    this.num_rows     = nrows;   // Number of rows of hexes on the map.
	this.num_cols     = ncols;   // Number of columns of hexes on the map.
	this.tile_width   = null;    // Width in pixels of each tile.
	this.tile_height  = null;    // Height in pixels of each tile.
	this.is_rotating  = [];      // Array of hexes that are rotating (TODO: Investigate).
	
	// TODO: Figure out where these values actually come from. Have they been
	// fiddled based on the visible area of the hex?
	this.tile_width = 82;
	this.tile_height = 98;
}

Map.prototype.drawHexGrid = function () {
	var row, // Loop iterator for the row.
		col; // Loop iterator for the column.

	// ROW MAJOR
	console.log ('Drawing the grid (' + this.num_rows + ' by ' + this.num_cols + ')');

	var tile_width = this.tile_width;
	var tile_height = this.tile_height;

	for (row = 0; row < this.num_rows; row++) {
		console.log ('Drawing row ' + row);
		this.is_rotating[row] = Array();

		for (col = 0; col < this.num_cols; col++) {
			console.log ('Drawing col ' + col);
			// Don't draw the odd columns on the last row
			if (row == this.num_rows && col % 2 == 1) {
				continue;
			}

			this.is_rotating[row][col] = false;

			var id = row + '-' + col;
			var y_offset;

			if (col % 2 == 1) {
				y_offset = tile_height / 2;
			} else {
				y_offset = 0;
			}

			var row_i, col_i;
			row_i = tile_height * row + y_offset;
			col_i = tile_width * col;


			// Rotations
			//$('#stage').append('<div id="hex-' + id + '" class="hex" onclick="rotate(this)" />')

			// Place unit
			$('#stage').append('<div id="hex-' + id + '" class="hex" onclick="game.map.placeUnit(this, \'footman\')" />');

			$('#hex-' + id).css('left', col_i);
			$('#hex-' + id).css('top', row_i);

			$('#hex-' + id).html('<br />' + id);
		}
	}
};

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

Map.prototype.placeUnit  = function (domElement, unit_name) {
	$(domElement).css('background-image', 'url("images/hex-' + unit_name + '.png")');
};
