// Class to check for browser features and return what is appropriate
// for the environment in which the game is running.

// May need another name.
function Browser() {
	this.touchStart = null;
	
	// Determine whether we need to use touchstart or mousedown.
	if ('ontouchstart' in document.documentElement) {
		// Probably iOS.
		this.touchStart = 'touchstart';
		this.touchMove = 'touchmove';
		this.touchEnd = 'touchmove';
		
		/*
		document.body.addEventListener('touchmove',
			function(e){ e.preventDefault(); });
		document.body.addEventListener('touchstart',
			function(e){ e.preventDefault(); }); 
		*/
	} else {
		this.touchStart = 'mousedown';
		this.touchMove = 'mousemove';
		this.touchEnd = 'mouseup';
	}
}
