helpers = function (app) {
	app.dynamicHelpers ({
		flash: function (req, res) {
			return req.flash();
		}
	});
}

module.exports = helpers;
