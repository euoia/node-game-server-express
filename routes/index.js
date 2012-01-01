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
    var room_messages = [];

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

            ChatRoom.getMessages(room_name, this);
        },
        function getMessagesDone(err, messages) {
            if (err) { throw (err); }

            room_messages = messages;
            console.log('getMessages returned:');
            console.log(room_messages);
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
                messages: room_messages,
                room_name: room_name,
                users: users
            });
        }
    )
};

// This is an ajax request, so the respond should be a JSON object.
exports.chat_send = function (req, res) {
    console.log('Request handler "chat_send" was called.');
    console.log('Request body: ');
    console.log(req.body);
    console.log('From: ' + req.session.username);

    if (req.session.username === undefined) {
        console.log('chat_send called without a valid session!');
        res.send({error: "Invalid session."}, 400);
        return;
    }

    var ChatRoom = mongoose.model('ChatRoom');

    step (
            function sendMessage() {
                ChatRoom.sendMessage(req.body.room_name, req.session.username, req.body.message, this);
            },
            function sendMessageDone(err) {
                if (err) { throw (err); }

                this();
            },
            function getUnreadMessages() {
                ChatRoom.getUnreadMessages(req.body.room_name, req.session.username, this);
            },
            function getUnreadMessagesDone(err, messages) {
                if (err) { throw (err); }

                console.log('getUnreadMessages returned:');
                console.log(messages);
                this(messages);
            },
            function sendResponse(messages) {
                return res.send({
                    status: 1,
                    messages: messages 
                }, 200);
            }
    );
}
