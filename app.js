
/**
 * Module dependencies.
 */

var express = require('express'),
    mongoose = require('mongoose'),
    routes = require('./routes'),
    gameRoutes = require('./routes/game'),
    account = require('./account'),
    chatRoom = require('./chatRoom');

var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    app.use(express.cookieParser());
    app.use(express.session({ secret: "secret santa" }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

// Specify environment with environment variable, e.g.
// NODE_ENV=production node app.js
app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// -------
// Routes
// get
app.get('/', routes.login_form);

// post
app.post('/login', routes.login);
app.post('/chat/send', routes.chat_send); // TODO: Move this to its own route file somehow
app.post('/chat/getUnreadEvents', routes.chat_get_unread_events); // TODO: Move this to its own route file somehow
app.post('/chat/pollEvents', routes.chat_poll_events); // TODO: Move this to its own route file somehow

// Game
app.post('/game/init', gameRoutes.init);
app.post('/game/getConfig', gameRoutes.getConfig);

// ---------
// Database
var db = mongoose.connect('mongodb://localhost/test');
account.init({rebuild: true});
chatRoom.init({rebuild: true});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
