bunyan = require('bunyan');

function Log () {
	this.logger = new bunyan({
		name: "monolith",
		src: true,
		streams: [
			{
				level: "info",
				stream: process.stdout, // log INFO and above to stdout
			}, {
				level: "error",
				path: "log/error.log"   // log ERROR and above to a file
			}
		]
	});
}

l = new Log();

module.exports = l.logger;

// Disable the serializers for now.
// serializers: {
// 	req: bunyan.stdSerializers.req,
// 	err: bunyan.stdSerializers.err
// }
