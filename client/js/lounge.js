config = {
	//server: "ws://localhost:8000/socket/server/lounge"
	server: "ws://localhost:8080"
};

dojo.addOnLoad(function() {
	console.log("loaded");
	
	var socket = new WebSocket(config.server);
	socket.onopen = function(message) {
		console.log("open");
		
		// we've connected to the server
		socket.send("{action: \"getLoungeList\", args: []}");
	}
	socket.onmessage = function(message) {
		console.log("connected " + message);
		
		console.dir(message);
	}
	
	socket.onerror = function(message) {
		console.log("error!");
		
		console.error(message);
	}
});

