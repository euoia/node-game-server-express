var mongoose = require('mongoose'),
	Step = require('step');

var accountSchema = new mongoose.Schema({
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

accountSchema.statics.insertTestRecords = function () {
	var lp = '<M:S> insertTestRecords';
    /* ---------------------------------------------*/
    /* Insert some starting data */
    /* ---------------------------------------------*/

    // Account data
    new this ({
        username: 'jpickard',
        real_name: 'James Pickard',
        email: 'james.pickard@gmail.com'
    }).save(function(err) {
        if (err) { throw err; }
        console.log(lp + 'Saved account jpickard');
    });

    new this ({
        username: 'jsmall',
        real_name: 'Jack Small',
        email: 'jack.small@gmail.com'
    }).save(function(err) {
        if (err) { throw err; }
        console.log(lp + 'Saved account jsmall');
    });
	
    new this ({
        username: 'gboucher',
        real_name: 'Guillaume Boucher',
        email: 'guillaume.boucher@xxxxxx.com'
    }).save(function(err) {
        if (err) { throw err; }
        console.log(lp + 'Saved account gboucher');
    });

    console.log(lp + 'Finished initializing account');
};

// Retrieve the user by username.
// Return an object containing one of:
//  { status : "error", "message" : errorMessage }
//  { status : "success", "user" : user }
accountSchema.statics.getByUsername = function (username, cb) {
	var thisAccount = this;
	
    Step (
        function findAccount() {
            thisAccount.findOne(
                {username: username},
                this);
        },
        function findAccountDone(err, account) {
            if (err) {
				return cb(err);
			}

            if (account === null) {
				console.log ('No account with username ' + username);
				cb(null, {
					status : 'error',
					message : 'Account not found.'
				});
			}
			
			cb(null, {
				status : 'success',
				account : account
			});
        }
    );
};

module.exports = mongoose.model('Account', accountSchema);
