
module.exports = function(server, conf){
	net = require('net');
	var clients = [];

	if(conf.connection_label){
		var server_socket = server.select(conf.connection_label);
	}else{
		console.log("Using default connection 'websocket'");
		console.log("If you want to get rid of this message add 'connection_label' to the plug-in configuration:",
			JSON.stringify({
				connection_label: 'somelabel'
			}, null, 4));
		var server_socket = server.select("websocket");
	}

	net.createServer(function (socket) {
		var handlers = require('./websocket.handlers')(server, clients, conf);
		// Identify this client
		socket.name = socket.remoteAddress + ":" + socket.remotePort 
		// Put this new client in the list
		clients.push(socket);

		// Handle incoming messages from clients.
		socket.on('data', function (data) {
			console.log("- " + data);
			if(data == "Hello"){
				handlers.hello(socket)
			}
			else if(data == "emit_with_callback"){
				handlers.hello(socket)
				if(fn){
					fn("Awesome callback")
				}
			}
			server.methods.dcbia.executeTasks()
		});

		// Remove the client from the list when it leaves
		socket.on('end', function () {
			clients.splice(clients.indexOf(socket), 1);
			console.log("> Connection lost with " + socket.name + ".\n");
		});

		// // Send a message to all clients
		function broadcast(message, sender) {
			clients.forEach(function (client) {
				// Don't want to send it to sender
				if (client === sender) return;
				client.write(message);
			});
			// Log it to the server output too
			process.stdout.write(message)
		}

	}).listen(server_socket.info.port-1);
	
	server.route({
	    method: '*',
	    path: '/suscribe/{path*}',
	    handler: {
	        proxy: {
				mapUri: function(req, callback){
					var path = req.url.path.replace("/suscribe", server_socket.info.uri);
					callback(null, path);
				},
				rejectUnauthorized: false
	        }
	    },
	    config: {
	    	plugins: {
		        good: {
		            suppressResponseEvent: true
		        }
		    }
	    }
	});
	
}
	