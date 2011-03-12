var socket;

var config = {
	//server: "ws://localhost:8000/socket/server/lounge"
	server: "ws://localhost:8080"
};

client = {
	id: null,
	game: null,
	_lastKeyPressSent: null,
	
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
	},
	
	startGame: function(id) {
		console.log("should start game " + id);
		
		client.game = id;
		
		dojo.connect(window, "onkeydown", client._keyDown);
		dojo.connect(window, "onkeyup", client._keyUp);
		
		// do something here to show the track!
	},
	
	_keyDown: function(event) {
		client._sendKeyPressEvent(event, "receiveKeyDown");
	},
	
	_keyUp: function(event) {
		client._sendKeyPressEvent(event, "receiveKeyUp");
	},
	
	_sendKeyPressEvent: function(event, remoteMethod) {
		if(event.keyIdentifier != "Up" && event.keyIdentifier != "Down" && event.keyIdentifier != "Left" && event.keyIdentifier != "Right") {
			return;
		}
		
		var code = event.keyIdentifier + " " + event.type;
		
		//console.log(code);
		
		if(client._lastKeyPressSent == code) {
			// don't send repeat codes
			return;	
		}
		
		socket.invoke(remoteMethod, [client.id, client.game, event.keyIdentifier]);
		
		client._lastKeyPressSent = code;
	},
	
	updateGame: function(id, positions) {
		// positions is an array of objects that look like this:
		// {
		//		player: id
		//		position: {
		//			x: int
		//			y: int
		//			z: int
		//		}
		//		velocity: {
		//			angle: int (0 to 360 - left and right)
		//			elevation: int (0 to 360 - up and down)
		//			speed: int (pixels moved in the last iteration)
		//		}
		//	}
		
		for(var i = 0; i < positions.length; i++) {
			var position = positions[i];
			var div = document.getElementById(position.player);
			
			if(!div) {
				div = document.createElement("div");
				div.id = position.player;
				document.body.appendChild(div);
				div.style.position = "absolute";
				div.style.backgroundColor = position.player == "player0" ? "red" : "blue";
				div.style.width = "50px";
				div.style.height = "50px";
			}
			
			div.style.top = position.position.x + "px";
			div.style.left = position.position.y + "px";
		}
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
		//console.log("connected " + message);
		//console.dir(message);
		
		if(!message.data) {
			return;
		}
		
		try {
			var methodCall = eval("(" + message.data + ")");
			
			if(methodCall && methodCall.action && client[methodCall.action]) {
				client[methodCall.action].apply(this, methodCall.args ? methodCall.args : []);
			}
		} catch(e) {
			console.error(e);
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

