monolith = require ('./app/monolith');

monolith.listen(3000);
console.log("Express server listening on port %d in %s mode", monolith.address().port, monolith.settings.env);
