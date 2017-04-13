
module.exports = function (server, clients, conf) {
	var handler = {};
	var crontab = require('node-crontab');
	var _ = require('underscore');

	handler.broadcast = function(message, sender) {
		clients.forEach(function (client) {
			// Don't want to send it to sender
			if (client === sender) return;
			client.write(message);
		});
		// Log it to the server output too
		process.stdout.write("> " + message)
	}

	handler.hello = function(socket){
		handler.broadcast("'connected', {msg:'hola'}","");
	}

	handler.executeTasks = function () {
		//TODO select tasks in queue from server
		//Select a socket (slicer app)
		//send task id
		var tasks = ["id1", "id2"];
		clients.forEach(function (client) {

		  client.write('"execute_task", "id1"');
		});
	};

	server.method({
	    name: 'dcbia.executeTasks',
	    method: handler.executeTasks,
	    options: {}
	});

	crontab.scheduleJob("1 * * * * *", function(){
		server.methods.dcbia.executeTasks();
	});

	return handler;
}