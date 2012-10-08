	
exports.check = function (req) {
	if (req.session.username === undefined) {
		return ({
			'status': 'error',
			'message': 'Invalid session.'
		});
	}
	
	return null;
};

