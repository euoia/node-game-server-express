var monolith = require ('./app/monolith'),
	Lobby = require('./Lobby'),
	log = require('./Log');

// ---------
// Init
Lobby.init( {rebuild: true, rooms: [monolith.settings.defaultRoom]}, function (err) {
	console.error ('A fatal error occurred whilst initializing the lobby.');
	console.error (err);
	console.error(err.stack);
});

monolith.listen(3000);
log.info ("Express server listening on port %d in %s mode", monolith.address().port, monolith.settings.env);
