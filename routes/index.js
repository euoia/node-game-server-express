var mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    step     = require('step');

exports.index = function(req, res){
    // This is the boring old default index
  res.render('index', { title: 'Express' });
};

exports.login_form = function(req, res){
    res.render('login_form', { title: 'Chat Login' });
};

// Log the user in.
exports.login = function (req, res) {
    console.log('Request handler "login" was called.');
    console.log('Request body: ');
    console.log(req.body);

    var ChatRoom = mongoose.model('ChatRoom');
    var Account = mongoose.model('Account');
    var room_name = 'global';

    var this_account = null;
    var room_users = [];
    var room_events = [];

    step (
        function findAccount() {
            Account.findOne(
                {username: req.body.username},
                this
            );
        },
        function findAccountDone(err, account) {
            if (err) { throw(err); }

            if (account === null) {
                return res.render('error', {
                    title: 'Error!',
                    message: 'user not found.'
                });
            }

            this_account = account;

            ChatRoom.getEvents(room_name, this);
        },
        function getEventsDone(err, events) {
            if (err) { throw (err); }

            room_events = events;
            ChatRoom.join(room_name, this_account.username, this);
        },
        function joinRoomDone(err) {
            if (err) { throw (err); }

            ChatRoom.getUsers(room_name, this);
        },
        function getUsersDone(err, users) {
            if (err) { throw (err); }

            room_users = users;

            req.session.username = this_account.username;
            return res.render('chat', {
                // Account
                title: 'Logged in',
                username: this_account.username,
                real_name: this_account.real_name,

                // Chat
                events: room_events,
                room_name: room_name,
                users: users
            });
        }
    )
};

// This is an ajax request that is expecting a JSON response.
exports.chat_send = function (req, res) {
    console.log('Message from ' + req.session.username);

    if (req.session.username === undefined) {
        console.log('chat_send called without a valid session!');
        res.send({error: "Invalid session."}, 200);
        return;
    }

    var ChatRoom = mongoose.model('ChatRoom'),
        thisEvents = [],
        thisUsers = [];

    step (
        function sendMessage() {
            ChatRoom.sendMessage(req.body.room_name, req.session.username, req.body.message, this);
        },
        function sendMessageDone(err) {
            if (err) { throw (err); }

            console.log('message sent, I suppose');
            this();
        },
        function getUnreadEvents() {
            console.log('getting unread events');
            ChatRoom.getUnreadEvents(req.body.room_name, req.session.username, this);
        },
        function getUnreadEventsDone(err, events) {
            if (err) { throw (err); }

            console.log('Unread events:');
            console.log(events);

            thisEvents = events;
            this();
        },
        function sendResponse() {
            return res.send({
                status: 1,
                events: thisEvents
            }, 200);
        }
    );
};

// Client uses long polling to wait for new events
exports.chat_get_unread_events = function (req, res) {
    var ChatRoom = mongoose.model('ChatRoom'),
        thisEvents = [];

    step (
        function getUnreadEvents() {
            console.log('getting unread events');
            ChatRoom.getUnreadEvents(req.body.room_name, req.session.username, this);
        },
        function getUnreadEventsDone(err, events) {
            if (err) {
                throw (err);
            }

            console.log('Unread events:');
            console.log(events);

            thisEvents = events;
            this();
        },
        function sendResponse() {
            return res.send({
                status: 1,
                events: thisEvents
            }, 200);
        }
    );
};

// Client uses long polling to wait for new events
exports.chat_poll_events = function (req, res) {
    console.log('chat_poll_events from ' + req.session.username);
    /*
    var ChatRoomEvent = mongoose.model('ChatRoomEvent'); // TODO abstract this out

    ChatRoomEvent.pre('save', function () {
        return res.send({
            status: 1,
            events: this
        }, 200);
    });
   */
};
