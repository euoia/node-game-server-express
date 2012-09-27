function Net() {
	// Map of action => url.
	this.urls = {
		'login' : '/login',
		'init' : '/game/init',
		'getConfig' : '/game/getConfig',
		'startGame' : '/game/start',
		'waitStart' : '/game/waitStart',
		'doPlacements' : '/game/doPlacements',
		'doOrders' : '/game/doOrders'
	};

	// ---------------
	// Initialize events since this object is a dispatcher.
	Event.init(this);
}

Net.prototype.send = function(action, data, callback, scope) {
	var url; // The URL to post to.
	
	url = this.urls[action];
	if (url == undefined) {
		console.error ('URL is not defined for action ' + action);
	}
	
	console.log('Sending to url ' + url + ' - callback:');
	console.log(callback);
	console.log('Data');
	console.log(data);
	
	$.ajax({
		cache: false,
		type: 'POST',
		url: url,
		data: data,
        error: function error (response) {
			console.error ('An error occurred:');
			console.error (response);
        },
		success: function success (data) {
			callback.call(scope, data)
		},
		dataType: 'json'
	});
	
};

Net.prototype.longPoll = function (action, data, callback, scope, repeat) {
    var thisNet = this,
		errRetryTime = 10000,  // Time in milliseconds to retry after an error.
		url; // The URL to request.

	if (repeat === undefined) {
		repeat = false; // default to false.
	}
	
	url = this.urls[action];
	if (url === undefined) {
		console.error ('URL is not defined for action ' + action);
	}
	
    $.ajax({
        cache: false,
        type: "POST",
        url: url,
        data: data,
        dataType: "json",
        error: function error () {
            thisNet.dispatch('NetError', {'message' : 'Long poll error, retrying after ' + errRetryTime + 'ms'} );
			
            // When an error occurs, wait some time before retrying.
            setTimeout(thisNet.longPoll, errRetryTime);
        },
        success: function success (responseData) {

			// expects data status of: 'success', 'error' or 'fatal'
            if (responseData.status === 'fatal') {
                // Fatal: Do not reconnect to server.
                if (responseData.error) {
					console.log ('Error received from server.');
					this.dispatch('NetError', {
						'message' : 'Fatal error received',
						'remoteError' : responseData.error
					});
                }
            } else if (responseData.status === 'success') {
                // Upon success we want to long poll again immediately.
				if (repeat === true) {
					thisNet.longPoll();
				}
				
				if (callback !== undefined) {
					callback.call(scope, responseData);
				}
            }
        }
    });
};

// Turn the player phasePlacements array into something that is worth sending to the
// server.
Net.prototype.formatPlacements = function (placedHexes) {
	var retVal = [],
		hexIDx; // Array of placements.
	
	for (hexIdx in placedHexes) {
		retVal.push ({
			'row' : placedHexes[hexIdx].row,
			'col' : placedHexes[hexIdx].col,
			'thingName' : placedHexes[hexIdx].thing.name
		});
	}
	
	console.log('formatPlacements returning:');
	console.log(retVal);
	
	return retVal;
};

// Turn the map into something that is worth sending to the
// server for orders.
// 
// Returns an array of move objects:
// 'moveFrom' : {'row' : The thing row, 'col' : The target row},
// 'moveTo':  {'col' : The thing row, 'col' : The target col},
Net.prototype.formatOrders = function (map) {
	var row,  // Hex row.
		col,  // Hex col.
		retMoves = []; // Array of moves to be returned.
	
	for (row in map.hexes) {
		for (col in map.hexes[row]) {
			if (map.hexes[row][col].thingMoveTarget !== null) {
				retMoves.push({
					'moveFrom' : {'row' : row, 'col' : col},
					'moveTo' : {
						'row' : map.hexes[row][col].thingMoveTarget.row,
						'col' : map.hexes[row][col].thingMoveTarget.col
					}
				});
			}
		}
	}
	
	console.log('formatOrders returning:');
	console.log(retMoves);
	
	return retMoves;
};
