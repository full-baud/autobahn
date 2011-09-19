dojo.require("dojo.cookie");
dojo.require("dojox.grid.DataGrid");

var socket;

var config = {
	//server: "ws://localhost:8000/socket/server/lounge"
	server: "ws://localhost:8080"
};

client = {
	id: null,
	gameId: null,
	players: {},
	_lastKeyPressSent: null,
	
	setUserId: function(id) {
		client.id = id;
		
		console.log("got id " + id);
		
		// we've connected to the server, display the list of available games
		socket.invoke("getLoungeList", [id]);
		
		// set up the new game button
		document.getElementById("createNewGameButton").onclick = function() {
			var gameName = document.getElementById("createNewGameTitle").value;
			var maxPlayers = parseInt(document.getElementById("createNewGamePlayers").value);
			
			if(!gameName) {
				document.getElementById("createNewGameTitle").style.borderColor = "red";
				
				return false;
			}
			
			socket.invoke("createGame", [id, gameName, maxPlayers]);
			
			return false;
		};
	},
	
	startGame: function(gameId, players) {
		
		if(client.gameId != gameId) {
			return;
		}
		
		console.log("should start game " + gameId);
		
		// Update the players list (we may have missed a playerJoinedGame call)
		for(var i = 0, len = players.length; i < len; ++i) {
			client.players[players[i].id] = players[i];
		}
		
		document.getElementById("loungeList").style.display = "none";
		
		dojo.connect(window, "onkeydown", client._keyDown);
		dojo.connect(window, "onkeyup", client._keyUp);
		
		// do something here to show the track!
	},

	/**
	 * Called when a player joins a game the client has joined.
	 * 
	 * @param gameId
	 * @param player
	 */
	playerJoinedGame: function(gameId, player) {
		
		console.log(player + ' joined game ' + gameId);
		
		client.players[player.id] = player;
		
		// TODO: Feedback to the user
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
		
		socket.invoke(remoteMethod, [client.id, client.gameId, event.keyIdentifier]);
		
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
	 * is received from the server. The last parameter of each function is
	 * an array of the arguments originally passed to the server.
	 */
	response: {
		
		getLoungeList: function(loungeList) {
			console.dir(loungeList);
			
			var tbody = document.getElementById("loungeTableList");
			
			dojo.empty("loungeTableList");
			
			for(var i = 0; i < loungeList.length; i++) {
				var lounge = loungeList[i];
				
				var row = document.createElement("tr");
				var title = document.createElement("td");
				title.appendChild(document.createTextNode(lounge.lounge.title));
				row.appendChild(title);
				
				var players = document.createElement("td");
				players.appendChild(document.createTextNode(lounge.lounge.players.length + "/" + lounge.lounge.maxPlayers));
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
		
		createGame:function(gameId, players) {
			
			if(created) {
				
				dojo.byId("container").style.display = "none";
				
				client.gameId = gameId;
				client.players = {};
				
				for(var i = 0, len = players.length; i < len; ++i) {
					client.players[players[i].id] = players[i];
				}
				
				alert('Game created! Waiting for players...');
				
			} else {
				
				alert('Failed to create game');
			}
		},
		
		joinGame: function(gameId, players) {
			
			if(gameId) {
				
				dojo.byId("container").style.display = "none";
				
				client.gameId = gameId;
				client.players = {};
				
				for(var i = 0, len = players.length; i < len; ++i) {
					client.players[players[i].id] = players[i];
				}
				
				alert('Game joined! Waiting for players...');
				
			} else {
				
				alert('Failed to join game');
			}
		}
	}
};

dojo.addOnLoad(function() {
	console.log("loaded");
	
	var playerName = dojo.byId('playerName'),
		playerAvatar = dojo.byId('playerAvatar');
	
	playerName.value = dojo.cookie("playerName") ? dojo.cookie("playerName") : '';
	playerAvatar.value = dojo.cookie("playerAvatar") ? dojo.cookie("playerAvatar") : '';
	
	dojo.connect(dojo.byId('createNewPlayerButton'), 'onclick', function() {
		
		var name = playerName.value,
			avatar = playerAvatar.value;
		
		dojo.byId('playerDetails').style.display = 'none';
		dojo.byId('loungeList').style.display = 'block';
		
		if(name) {
			
			dojo.cookie("playerName", name, {
				expires: 365
			});
			
			socket.invoke('setPlayerName', [client.id, name]);
		}
		
		if(avatar) {
			
			dojo.cookie("playerAvatar", name, {
				expires: 365
			});
			
			socket.invoke('setPlayerAvatar', [client.id, avatar]);
		}
	});
	
	socket = new WebSocket(config.server);
	
	socket.onopen = function(message) {
		console.log("open");
	};
	
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
					
					console.log('Got ' + methodCall.action + ' response');
					
					client.response[methodCall.action].apply(this, methodCall.response.push(methodCall.args));
				}
				
			} else {
				
				if(methodCall && methodCall.action && client[methodCall.action]) {
					
					console.log('Got ' + methodCall.action + ' request');
					
					client[methodCall.action].apply(this, methodCall.args ? methodCall.args : []);
				}
			}
			
		} catch(e) {
			
			console.error(e);
		}
	};
	
	socket.onerror = function(message) {
		console.log("error!");
		
		console.error(message);
	};
	
	socket.invoke = function(method, args) {
		socket.send(JSON.stringify({
			action: method,
			args: args ? args : []
		}) + "\r\n");
	};
});

