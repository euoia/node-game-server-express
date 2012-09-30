var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

exports.init = function (args) {
    // TODO: Find a library that cleanly allows default args

    // Account: Schema
    var AccountSchema = new Schema({
        username: {
            type: String,
            index: { unique: true } }, // Index example
        real_name: String,
        email: {
            type: String,
            validate: /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
            index: { unique: true } },
        status: {
            type: String,
            enum: ['active', 'closed'],
            default: 'active' },
        // Also possible to validate using a function
        created: { type: Date, default: Date.now}

        // Nested members are possible, e.g. Post has
        // author, author has name and email
    });

    // Account: Init
    var Account = mongoose.model('Account', AccountSchema);

    if (args.rebuild === true) {
        Account.collection.drop();
    };

    /* ---------------------------------------------*/
    /* Insert some data */
    /* ---------------------------------------------*/

    // Account data
    account = new Account({
        username: 'jpickard',
        real_name: 'James Pickard',
        email: 'james.pickard@gmail.com'
    }).save(function(err) {
        if (err) { throw err; }
        console.log('saved account.');
    });

    new Account({
        username: 'jsmall',
        real_name: 'Jack Small',
        email: 'jack.small@gmail.com'
    }).save(function(err) {
        if (err) { throw err; }

        console.log('saved account.');
    });
	
    new Account({
        username: 'gboucher',
        real_name: 'Guillaume Boucher',
        email: 'guillaume.boucher@xxxxxx.com'
    }).save(function(err) {
        if (err) { throw err; }

        console.log('saved account.');
    });

    console.log('finished initializing account');
};
// TODO: What do references in the schema look like?

//        globalRoom.recentMessages(function(err, messages) {
//            if (err) {
//                console.log('Error: ' + err);
//                throw err;
//            }
//
//            console.log(messages.length() + ' recent messages:');
//
//            messages.forEach(function(message) {
//                console.log(message.doc);
//            });
//        });
