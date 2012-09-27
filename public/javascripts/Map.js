function Map(parentElementID, nrows, ncols) {
	console.log ('Creating new map on ' + parentElementID + ' with ' + nrows + ' rows and ' + ncols + 'cols');
    this.num_rows     = nrows;   // Number of rows of hexes on the map.
	this.num_cols     = ncols;   // Number of columns of hexes on the map.
	this.tile_width   = null;    // Width in pixels of each tile.
	this.tile_height  = null;    // Height in pixels of each tile.
	this.is_rotating  = [];      // Array of hexes that are rotating (TODO: Investigate).
	this.hexes        = [];      // 2D array of hexes.
	this.parentElement = $('#' + parentElementID); // Element in which to draw.
	
	this.browser      = new Browser();    // Browser object for browser features.
	
	this.arrows       = [];       // Array of arrow elements from one hex to another.
	
	// TODO: Figure out where these values actually come from. Have they been
	// fiddled based on the visible area of the hex?
	this.tile_width = 82;
	this.tile_height = 98;

	// this.hexes[n][n] each contains an object that looks like:
	// 'row'              - Row on map.
	// 'col'              - Col on map.
	// 'element'          - DOM element
	// 'terrain'          - grass or water
	// 'thing'            - a thing object (See Config.things).
	// 'thingPlayerNum'   - player num of thing owner: 1, 2, or null (no thing present).
	// 'thingMoveTarget'  - the hex where the thing is planning to move.
	// 'is_rotating'      - true or false

	// ---------------
	// Initialize events since this object is a dispatcher.
	Event.init(this);
}

Map.prototype.drawHexGrid = function () {
	var row_i, // Loop iterator for the row index.
		col_i, // Loop iterator for the column index.
		this_map; // Alias for this in inner function.

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

			$(this.hexes[row_i][col_i].element).click(function (hex) {
				return function () {
					this_map.dispatch('hexClicked', {
						'hex' : hex
					});
				};
			}(this.hexes[row_i][col_i]));

			$(this.hexes[row_i][col_i].element).bind(
				this.browser.touchStart,
				function hexTouchStart (hex) {
					return function (startEvent) {
						this_map.dispatch('hexTouchStart', {
							'hex' : hex,
							'startEvent' : startEvent
						});
					};
			}(this.hexes[row_i][col_i]));
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
		'row'             : row_i,
		'col'             : col_i,
		'element'         : $('#hex-' + id),
		'terrain'         : null,
		'thing'           : null, // TODO: consider undefined? see hex.thing in Game.js
		'thingPlayerNum'  : null,
		'thingMoveTarget' : null,
		'is_rotating'     : false
	};
};

Map.prototype.updateHexTerrain = function (hex, newTerrain) {
	hex.terrain = newTerrain;
	this.redrawHex(hex);
};

Map.prototype.updateHexThing = function (hex, newThing, newThingPlayer) {
	hex.thing          = newThing;
	hex.thingPlayerNum = newThingPlayer;
	this.redrawHex(hex);
};

Map.prototype.redrawHex = function (hex) {
	var thingFilename; // Filename of the thing.
	//console.log ('Redrawing hex:');
	//console.log(hex);
	
	//console.log('redrawHex');
	//console.log(hex);

	if (hex.thing === null) {
		thingFilename = '/images/hex-' + hex.terrain + '.png';
	} else {
		thingFilename = '/images/hex-p' + hex.thingPlayerNum + '-' + hex.thing.name + '.png';
	}

	$(hex.element).css('background-image', 'url(' + thingFilename + ')');
};

Map.prototype.placeThing = function (hex, playerNum, thing) {
	hex.thingPlayerNum = playerNum;
	hex.thing = thing;

	this.redrawHex(hex);
};

Map.prototype.getHex = function (position) {
	var row, // row index of the hex
		col; // col index position of the hex.

	row = this.convertPosToRow(position.row);
	col = this.convertPosToCol(position.col);
	return this.hexes[row][col];
};

Map.prototype.convertPosToRow = function (pos) {
	var row; // row index of the hex

	if (pos.idx !== undefined) {
		// Row is defined by position.
		if (pos.idx === 'MAX') {
			row = this.num_rows;
		} else if (pos.idx > 0) {
			row = pos.idx;
		} else {
			// Negative number, offset from right of map.
			row = this.num_cols + pos.idx - 1;
		}

	} else if (pos.pct !== undefined) {
		// Row is defined by percentage.
		if (pos.pct >= 0) {
			row = Math.ceil( (this.num_rows - 1) * pos.pct);
		} else {
			row = this.num_rows + Math.floor(this.num_rows * pos.pct);
		}
	} else {
		console.error('Unable to handle row position object.');
		console.log(pos);
	}

	return row;
};

Map.prototype.convertPosToCol = function (pos) {
	var col; // col index of the hex

	if (pos.idx !== undefined) {
		// Column is defined by position.

		if (pos.idx === 'MAX') {
			col = this.num_cols;
		} else if (pos.idx > 0) {
			col = pos.idx;
		} else {
			// Negative number, offset from right of map.
			col = this.num_cols + pos.idx - 1;
		}
	} else if (pos.pct !== undefined) {
		// Column is defined by percentage.

		if (pos.pct >= 0) {
			col = Math.ceil( (this.num_cols - 1)* pos.pct);
		} else {
			col = this.num_cols + Math.floor(this.num_cols * pos.pct);
			// TODO: Test this rounding.
		}
	} else {
		console.error('Unable to handle row position object.');
		console.log(pos);
	}

	return col;
};

// Return a neighbouring hex of hex.
// Will return null if the neighbour is invalid (off the map).
Map.prototype.getHexNeighbour = function (hex, neighbour) {
	var retNeighb = null, // Neighbour to return.
		row_mod;          // Modified row index.
		
	/* Store a modified version of hex.row based on column so we can use sensible coords */
	if (hex.col % 2 == 1) {
		row_mod = hex.row + 1;
	} else {
		row_mod = hex.row;
	}
	
	console.log ('With row ' + hex.row + ' and row_mod ' + row_mod + ' - Getting neighbour ' + neighbour + ' for hex:');
	console.log (hex);

	switch (neighbour) {
		case 'up-left':
			if (row_mod - 1 >= 0 && hex.col - 1 >= 0) {
				retNeighb = this.hexes[row_mod - 1][hex.col -1];
			}
			break;
		case 'down-left':
			if (hex.col - 1 >= 0) {
				retNeighb = this.hexes[row_mod][hex.col - 1];
			}
			break;
		case 'down':
			if (hex.row + 1 >= 0) {
				retNeighb = this.hexes[hex.row + 1][hex.col];
			}
			break;
		case 'down-right':
			if (hex.col < this.num_cols) {
				retNeighb = this.hexes[row_mod][hex.col + 1];
			}
			break;
		case 'up-right':
			if (row_mod - 1 >= 0 && hex.col + 1 < this.num_cols) {
				retNeighb = this.hexes[row_mod - 1][hex.col + 1];
			}
			break;
		case 'up':
			if (hex.row - 1 >= 0) {
				retNeighb = this.hexes[hex.row - 1][hex.col];
			}
			break;
		default:
			console.error ('Unknown type of neighbour: ' + neighbour);
			break;
	}
	
	return retNeighb;
};

Map.prototype.rotate = function (domElement) {

	var match = new RegExp(/hex-(\d+)-(\d+)/).exec(domElement.id);
	var row_i = match[1];
	var col_i = match[2];

	rotateNeighbours (row_i, col_i);
	$(domElement).css('-webkit-animation', 'rotate360 1s infinite linear');
};

// Return the hexes covered by areas.
Map.prototype.getAreasHexes = function (areas) {
	var areaIdx,   // Iterator for areas.
        row_i,     // Row iterator,
		col_i,     // Col iterator,
		row_min,   // Row minimum,
		row_max,   // Row maximum,
		col_min,   // Col minimum,
		col_max,   // Col maximum.
        retArr = [];    // Array of hexes to be returned.

    for (areaIdx in areas) {
        row_min = this.convertPosToRow(areas[areaIdx].rowMin);
        row_max = this.convertPosToRow(areas[areaIdx].rowMax);

        col_min = this.convertPosToCol(areas[areaIdx].colMin);
        col_max = this.convertPosToCol(areas[areaIdx].colMax);

        for (row_i = row_min; row_i <= row_max; row_i += 1) {
            for (col_i = col_min; col_i <= col_max; col_i += 1) {
                if  (retArr.indexOf(this.hexes[row_i][col_i]) == -1) {
                    retArr.push(this.hexes[row_i][col_i]);
                }
            }
        }
    }

    return retArr;
};

// Return the hexes covered by areas.
Map.prototype.getAreaHexes = function (area) {
    return this.getAreasHexes ( [area] );
};

// Remove highlightType from an area.
Map.prototype.unHighlightArea = function (area, highlightType, test) {
    var hexes, // Hexes covered by area.
        hexesIdx; // Iterator for Hexes.

    hexes = this.getAreaHexes (area);
    for (hexesIdx in hexes) {
		hexes[hexesIdx].element.removeClass(highlightType);
    }
};
	
// Highlight an area of hexes with highlightType highlight.
Map.prototype.highlightArea = function (area, highlightType, test) {
    var hexes, // Hexes covered by area.
        hexesIdx; // Iterator for Hexes.

	console.log('highlighting area:');
	console.log(area);

    hexes = this.getAreaHexes (area);
    for (hexesIdx in hexes) {
        if (test(hexes[hexesIdx]) === true) {
            hexes[hexesIdx].element.addClass(highlightType);
        }
    }
};

// Perform moves for the hex.
Map.prototype.move = function (hex) {
	if (hex.thingMoveTarget === null) {
		//console.log ('No move target.');
		return;
	}
	
	hex.element.removeClass('selected');
	hex.thingMoveTarget.element.removeClass('selected');
	
	this.updateHexThing(hex.thingMoveTarget, hex.thing, hex.thingPlayerNum);
	this.updateHexThing(hex, null, null);
	
	hex.thingMoveTarget = null;
};

// Given an angle, return the neighbour name.
Map.prototype.angleToNeighbName = function (angle) {
	var neighbName;
	
	// Angle starts at 0 directly up, and increases counter-clockwise.
	if (angle >= 30 && angle < 90) {
		neighbName = 'up-left';
	} else if (angle >= 90 && angle < 150) {
		neighbName = 'down-left';
	} else if (angle >= 150 && angle < 210) {
		neighbName = 'down';
	} else if (angle >= 210 && angle < 270) {
		neighbName = 'down-right';
	} else if (angle >= 270 && angle < 330) {
		neighbName = 'up-right';
	} else  {
		neighbName = 'up';
	}
	
	return neighbName;
};

// Given an neighbour name, return the angle.
Map.prototype.neighbNameToAngle = function (neighbName) {
	var angle;
	
	// Angle starts at 0 directly up, and increases counter-clockwise.
	if (neighbName === 'up-left') {
		angle = -60;
	} else if (neighbName === 'down-left') {
		angle = -120;
	} else if (neighbName === 'down') {
		angle = -180;
	} else if (neighbName === 'down-right') {
		angle = -240;
	} else if (neighbName === 'up-right') {
		angle = -300;
	} else if (neighbName === 'up') {
		angle = 0;
	} else {
		console.error ('Invalid neighbour name: ' + neighbName);
		angle = null;
	}
	
	return angle;
};

// Get the 'neighbour name' going from from_hex to to_hex.
Map.prototype.getHexFromToNeighbName = function (from_hex, to_hex) {
	var retNeighbName = null, // Neighbour to return.
		from_hex_row_mod; // Modified row index.
		
	
	/* Store a modified version of from_hex.row based on column so we can use sensible coords */
	if (from_hex.col % 2 == 1) {
		from_hex_row_mod = from_hex.row + 1;
	} else {
		from_hex_row_mod = from_hex.row;
	}
	
	if (from_hex_row_mod - 1 === to_hex.row && from_hex.col - 1 === to_hex.col) {
		retNeighbName = 'up-left';
	} else if (from_hex_row_mod === to_hex.row && from_hex.col - 1 === to_hex.col) {
		retNeighbName = 'down-left';
	} else if (from_hex.row + 1 == to_hex.row && from_hex.col === to_hex.col) {
		retNeighbName = 'down';
	} else if (from_hex_row_mod === to_hex.row && from_hex.col + 1 === to_hex.col) {
		retNeighbName = 'down-right';
	} else if (from_hex_row_mod - 1 === to_hex.row && from_hex.col + 1 === to_hex.col) {
		retNeighbName = 'up-right';
	} else if (from_hex.row - 1 === to_hex.row && from_hex.col === to_hex.col) {
		retNeighbName = 'up';
	} else {
		console.error ('Hexes are not neighbours (from, to):');
		console.error (from_hex);
		console.error (to_hex);
	}
	
	return retNeighbName;
};

Map.prototype.arrowFromTo = function (from_hex, to_hex) {
	var avgLeft, // Average xPos.
		avgTop, // Average yPos.
		arrow, // The new arrow.
		angle; // Angle to rotate the arrow at.
		
	arrow = $('<div class="arrow"></div>');
	$(this.parentElement).append(arrow);
	
	avgLeft = ($(from_hex.element).offset().left + $(to_hex.element).offset().left) / 2;
	avgTop = ($(from_hex.element).offset().top + $(to_hex.element).offset().top) / 2;
	
	$(arrow).offset({left: avgLeft, top: avgTop});
	
	angle = this.neighbNameToAngle (
		this.getHexFromToNeighbName(from_hex, to_hex));
		
	arrow.css('-webkit-transform', 'rotate(' + angle + 'deg)');
	this.arrows.push(arrow);
};

Map.prototype.clearArrows = function () {
	var arrow;
	
	while (this.arrows.length) {
		arrow = this.arrows.pop();
		$(arrow).remove();
	}
};


// Junk / not used code
// Rotations
//$(this.parentElement).append('<div id="hex-' + id + '" class="hex" onclick="rotate(this)" />')
//Map.prototype.rotateNeighbours  = function (row_i, col_i) {
//	console.log ('rotateNeighbours ' + row_i + ' ' + col_i);
//	var neighbours = getNeighbourIDs(row_i, col_i);
//
//	var neighbour_id;
//	var n_row_i, n_col_i;
//	for (var i = 0; i < neighbours.length; i++) {
//		n_row_i = neighbours[i][0];
//		n_col_i = neighbours[i][1];
//
//		neighbour_id = 'hex-' + n_row_i + '-' + n_col_i;
//
//		$('#' + neighbour_id).css('-webkit-animation', 'rotate360 1s infinite linear');
//
//		if (this.is_rotating[n_row_i][n_col_i] === false) {
//			this.is_rotating[n_row_i][n_col_i] = true;
//			setTimeout('rotateNeighbours(' + neighbours[i][0] + ', ' + neighbours[i][1] + ')', 500);
//		}
//	}
//};
