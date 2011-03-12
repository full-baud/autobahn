var socket;

config = {
	//server: "ws://localhost:8000/socket/server/lounge"
	server: "ws://localhost:8080"
};

client = {
	id: null,
	
	setUserId: function(id) {
		client.id = id;
		
		console.log("got id " + id);
		
		// set up join button
		var button = document.getElementById("join");
		button.disabled = false;
		button.onclick = function() {
			socket.invoke("joinGame", [id, "foo"]);
			
			return false;
		};
	}
};

dojo.addOnLoad(function() {
	console.log("loaded");
	
	socket = new WebSocket(config.server);
	socket.onopen = function(message) {
		console.log("open");
		
		// we've connected to the server
		socket.invoke("getLoungeList");
	}
	socket.onmessage = function(message) {
		console.log("connected " + message);
		
		console.dir(message);
		
		if(!message.data) {
			return;
		}
		
		try {
			var methodCall = eval("(" + message.data + ")");
			
			if(methodCall && methodCall.action && client[methodCall.action]) {
				client[methodCall.action].apply(this, methodCall.args ? methodCall.args : []);
			}
		} catch(e) {
			sys.puts(":( " + e);
		}
		
		
	}
	socket.onerror = function(message) {
		console.log("error!");
		
		console.error(message);
	}
	socket.invoke = function(method, args) {
		socket.send(JSON.stringify({
			action: method,
			args: args ? args : []
		}) + "\r\n");
	}
});

