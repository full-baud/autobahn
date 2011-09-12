dojo.require("dojox.grid.DataGrid");

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
		
		// we've connected to the server, display the list of available games
		socket.invoke("getLoungeList", [id]);
		
		// set up the new game button
		document.getElementById("createNewGameButton").onclick = function() {
			var gameName = document.getElementById("createNewGameTitle").value;
			var numPlayers = document.getElementById("createNewGamePlayers").value;
			
			if(!gameName) {
				document.getElementById("createNewGameTitle").style.borderColor = "red";
				
				return false;
			}
			
			socket.invoke("createGame", [id, gameName, numPlayers]);
			
			return false;
		};
	},
	
	startGame: function(id) {
		console.log("should start game " + id);
		
		document.getElementById("loungeList").style.display = "none";
		
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
				div.style.backgroundColor = position.player == "player0" ? "green" : "blue";
				div.style.backgroundImage = position.player == "player0" ? "url('https://secure.gravatar.com/avatar/9d1124bf8f7fe1b93a92a7927accd9a9')" : "url('https://secure.gravatar.com/avatar/a3b09ba64ff875d8718e610dc729581b')";				
				div.style.width = "80px";
				div.style.height = "80px";
			}
			
			div.style.top = position.position.x + "px";
			div.style.left = position.position.y + "px";
		}
	},

	/**
	 * This object contains method calls that are invoked when a 'response'
	 * is received from the server. All functions should take two params: 
	 * 
	 * 1. The response object from the server
	 * 2. An array of the arguments that were sent to the server (optional)
	 */
	response: {
		
		getLoungeList: function(loungeList) {
			console.dir(loungeList);
			
			var tbody = document.getElementById("loungeTableList");
			
			for(var i = 0; i < loungeList.length; i++) {
				var lounge = loungeList[i];
				
				var row = document.createElement("tr");
				var title = document.createElement("td");
				title.appendChild(document.createTextNode(lounge.lounge.title));
				row.appendChild(title);
				
				var players = document.createElement("td");
				players.appendChild(document.createTextNode(lounge.lounge.players.length + "/" + lounge.lounge.numPlayers));
				row.appendChild(players);
				
				var button = document.createElement("input");
				button.type = "submit";
				button.value = "Join";
				button.onclick = function() {
					socket.invoke("joinGame", [client.id, lounge.id]);
					
					return false;
				};
				
				var joinButton = document.createElement("td");
				joinButton.appendChild(button);
				row.appendChild(joinButton);
				
				tbody.appendChild(row);
			}
		},
		
		joinGame: function(joined) {
			if(joined) {
				document.getElementById("loungeList").style.display = "none";
			}
		}
	}
};

dojo.addOnLoad(function() {
	console.log("loaded");
	
	socket = new WebSocket(config.server);
	socket.onopen = function(message) {
		console.log("open");
	}
	socket.onmessage = function(message) {
		//console.log("connected " + message);
		//console.dir(message);
		
		if(!message.data) {
			return;
		}
		
		try {
			
			//var methodCall = eval("(" + message.data + ")");
			var methodCall = JSON.parse(message.data);
			
			// Is this a response?
			if('response' in methodCall) {
				
				if(methodCall && methodCall.action && client.response[methodCall.action]) {
					client.response[methodCall.action].apply(this, [methodCall.response, methodCall.args ? methodCall.args : []]);
				}
				
			} else {
				
				if(methodCall && methodCall.action && client[methodCall.action]) {
					client[methodCall.action].apply(this, methodCall.args ? methodCall.args : []);
				}
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

