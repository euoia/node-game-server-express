/* Event listener and dispatcher class. */

function Event () {

	// Object where keys are event names and values are objects like:
	// handler - the function to call,
	// scope   - the scope to call the function in.
	var eventsListeners = {};

	// Add a listener.
	this.listen = function (eventName, handler, scope) {
		console.log('Handling ' + eventName + ' with ');
		console.log(handler);

		if (eventsListeners[eventName] === undefined) {
			// Initialize to an array.
			console.log('Initializing eventsListeners');
			eventsListeners[eventName] = [];
		}

		eventsListeners[eventName].push({
			'handler'    : handler,
			'scope'      : scope
		});

		console.log('Pushed onto eventsListeners');
	};

	/* Dispatch eventName with eventObj containing the payload. */
	this.dispatch = function (eventName, eventObj) {
		var listeners,    // Listeners to this event.
			listenerIdx;  // Iterator for listeners.

		listeners = eventsListeners[eventName];
		console.log('Dispatching event ' + eventName + ' ... eventObj:');
		console.log(eventObj);

		for (listenerIdx in listeners) {
			listeners[listenerIdx].handler.call (
				listeners[listenerIdx].scope,
				eventObj);
		}
	};

}

// Mix the dispatch and listen functions in to objectToExtent.
Event.init = function (objectToExtend) {
	var event = new Event();

	objectToExtend.listen   = event.listen;
	objectToExtend.dispatch = event.dispatch;
}
