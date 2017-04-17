
module.exports = function (server, clients, conf) {
	var handler = {};
	var crontab = require('node-crontab');
	var _ = require('underscore');

	handler.hello = function(socket){
		socket.write('connected\r\n');
	};

	handler.executeTasks = function () {
		//TODO select tasks in queue from server
		//Select a socket (slicer app)
		//send task id
		var tasks = ["id1", "id2"];

		_.each(clients, function(client){
			client.write('{"execute_task", "id1"}\r\n')
		})
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