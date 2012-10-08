var express = require('express'),
	mongoose = require('mongoose'),
	lessMiddleware = require('less-middleware'),
	flash = require('connect-flash'),
	helpers = require('../helpers'),
	Lobby = require('../Lobby'),
	loginRoutes = require('../routes/login'),
	chatRoutes = require('../routes/chat'),
	gameRoutes = require('../routes/game'),
	RedisStore = require('connect-redis')(express);

var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
	app.use(lessMiddleware({
		src: __dirname + '/../public',
		compress: true
	}));
	
	app.use(express.static(__dirname + '/../public'));
	
	app.use(flash());
	
	app.set('views', __dirname + '/../views');
	app.set('view engine', 'jade');
	
	app.register('.html', require('jade'));

	app.use(express.cookieParser());
	app.use(express.session({
		secret: "asdalskdjalsdj8u819238u",
		store: new RedisStore
	}));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/../public'));

	// -------
	// First-party configuration.
	app.set('routeIndex', loginRoutes.goLogin);
	app.set('successfulLoginRedirect', '/lobby/go');
	app.set('failedLoginRedirect', '/');
	
	app.set('defaultRoom', 'global');
});

// Specify environment with environment variable, e.g.
// NODE_ENV=production node app.js
app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


// Routes
// Login
app.get('/', app.settings.routeIndex);
app.post('/login', loginRoutes.doLogin)

// Lobby
app.get('/lobby/go', loginRoutes.goLobby);

// Chat (AJAX)
app.post('/chat/send', chatRoutes.send);
app.post('/chat/getUnreadEvents', chatRoutes.getUnreadEvents);
app.post('/chat/pollEvents', chatRoutes.pollEvents);

// Game
app.get('/game/login', gameRoutes.goLogin);
app.post('/game/doLogin', gameRoutes.doLogin);
app.get('/game/play', gameRoutes.playGame);

app.post('/game/init', gameRoutes.init);
app.post('/game/getConfig', gameRoutes.getConfig);
app.post('/game/start', gameRoutes.start);
app.post('/game/waitStart', gameRoutes.waitStart);
app.post('/game/doPlacements', gameRoutes.doPlacements);
app.post('/game/doOrders', gameRoutes.doOrders);

// ---------
// Helpers
helpers(app);

// ---------
// Database
var db = mongoose.connect('mongodb://localhost/test');

Lobby.init( {rebuild: true, rooms: [app.settings.defaultRoom]}, function (err) {
	console.error ('A fatal error occurred whilst initializing the lobby.');
	console.error(err.stack);
});
