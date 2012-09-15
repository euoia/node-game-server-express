var mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    step     = require('step'),
    sanitize = require('validator').sanitize;

var waiting = []; // Client connections waiting. Array of objects containing username and callback.

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
                return res.json({
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
        function joinRoomDone(err, join_response) {
            var i;
            if (err) { throw (err); }

            if (join_response.status == 'ALREADY_PRESENT') {
                console.log ('User was apparently already in the room - '
                    + 'searching whether the user was waiting and deleting the connection.');
                /* Remove user from waiting list. */
                /* Could use array filter but I want to log it. */
                for (i=0; i < waiting.length; i += 1) {
                    if (waiting[i].username == this_account.username) {
                        console.log ('User ' + waiting[i].username + ' was already in room - removing');
                        waiting[i].callback({'message': 'You have connected from elsewhere.'});
                        waiting.splice(i, 1);
                        i -= 1;
                    }
                }
            }

            ChatRoom.getUsers(room_name, this);
        },
        function getUsersDone(err, users) {
            if (err) { throw (err); }

            room_users = users;

            req.session.username = this_account.username;
            return res.json({
                // Account
                title: 'Logged in',
                username: this_account.username,
                real_name: this_account.real_name,

                // Chat
                events: JSON.stringify(room_events),
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
        res.json({error: "Invalid session."});
        return;
    }

    var ChatRoom = mongoose.model('ChatRoom'),
        thisEvents = [],
        thisUsers = [];

    step (
        function sendMessage() {
            ChatRoom.sendMessage(req.body.room_name, req.session.username, sanitize(req.body.message).entityEncode(), this);
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
        function sendToWaitingClients() {
            /* Any clients that are waiting on the long poll should receive the message. */
            var waiting_user;

            console.log('There are ' + waiting.length + ' clients waiting.');

            while (waiting.length > 0) {
                waiting_user = waiting.pop();

                console.log ('Sending to waiting user ' + waiting_user['username']);
                waiting_user['callback']();
            }

            this();
        },
        function sendResponse() {
            return res.json({
                status: 1,
                events: thisEvents
            });
        }
    );
};

// Client uses long polling to wait for new events
//
// To facilitate long-polling this should only return when there is a new message.
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

            console.log('Unread events: - ');
            console.log(events);

            if (events.length == 0) {
                console.log ('No unread events - pushing this connection onto the waiting queue.');

                var waiting_user = {
                    'username' : req.session.username,
                    'callback' : this
                };

                waiting.push(waiting_user);
            } else {
                console.log ('Sending unread event.');
                thisEvents = events;
                this();
            }
        },
        function sendResponse(err) {
            if (err) {
                req.session.destroy();

                return res.json({
                    status: 0,
                    error: err.message
                });
            }

            return res.json({
                status: 1,
                events: thisEvents
            });
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
