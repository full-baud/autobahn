var sys = require('sys'),
     ws = require('ws')

// vary this to change the speed of the app...
var runLoopInterval = 20;

Player = function() {
	return {
		id: "",
		
		// user entered
		name: "",
		
		// eg. MD5'd email for gravatar
		avatar: "",
		
		// this player's socket connection
		socket: null,
		
		buttons: {
			up: false,
			down: false,
			left: false,
			right: false
		},
		
		position: {
			x: 0,
			y: 0,
			z: 0
		},
		
		velocity: {
			angle: 0,
			elevation: 0,
			speed: 0
		},
		
		invoke: function(methodName, args) {
			this.socket.write(JSON.stringify({
				action: methodName,
				args: args ? args : []
			})+ "\r\n");
		}
	}
};

Game = function() {
	return {
		numPlayers: 2,
		title: "Lounge",
		players: []
	}
};

var autoBahn = {
	// games are in progress
	games: {
		
	},
	
	players: {
		
	},
	
	getLoungeList: function(userId) {
		sys.puts("asked for lounge list");
		
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return;
		}
		
		var lounges = [];
		
		for(key in autoBahn.games) {
			if(autoBahn.games[key].players == autoBahn.games[key].numPlayers) {
				continue;
			}
			
			lounges.push({
				id: key,
				lounge: autoBahn.games[key]
			});
		}
		
		player.invoke("gotLoungeList", [lounges]);
	},
	
	createGame: function(userId, gameTitle, numPlayers) {
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return;
		}
		
		var id = "g" + Math.round(Math.random() * 1000000);
		
		var game = new Game();
		game.numPlayers = parseInt(numPlayers);
		game.title = gameTitle;
		
		autoBahn.games[id] = game;
		
		autoBahn.joinGame(userId, id);
	},
	
	joinGame: function(userId, gameId) {
		sys.puts("user " + userId + " trying to join game " + gameId);
		
		// get passed game
		var game = autoBahn.games[gameId];
		
		if(!game) {
			sys.puts("Could not find game with id " + gameId);
			
			return;
		}
		
		// get passed player
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return;
		}
		
		// make sure it's not full already
		if(game.players.length == game.numPlayers) {
			sys.puts("already " + game.players.length + " connected...");
			sys.puts("players: " + game.players);
			
			return;
		}
		
		// add player
		game.players.push(player);
		
		sys.puts("now have " + game.players.length + " of " + game.numPlayers + " for game " + gameId);
		
		// do we start the game?
		if(game.players.length == game.numPlayers) {
			// game on
			for(var i = 0; i < game.players.length; i++) {
				game.players[i].invoke("startGame", [gameId]);
			}
			
			autoBahn._startGame(gameId, game);
		} else {
			// no, bounce to chatroom...
			player.invoke("joinedGame", [gameId]);
		}
	},
	
	_startGame: function(gameId, game) {
		game.interval = setInterval(function() {
			var positions = [];
			var foo = 10;
			
			// update player positions
			for(var i = 0; i < game.players.length; i++) {
				var player = game.players[i];
				
				if(player.buttons.up) {
					player.position.x -= foo;
				}
				
				if(player.buttons.down) {
					player.position.x += foo;
				}
				
				if(player.buttons.right) {
					player.position.y += foo;
				}
				
				if(player.buttons.left) {
					player.position.y -= foo;
				}
				
				// this will be sent to the client
				positions.push({
					id: player.id,
					player: "player" + i,
					position: player.position,
					velocity: player.velocity
				});
			}
			
			// inform all players of new positions
			for(var i = 0; i < game.players.length; i++) {
				game.players[i].invoke("updateGame", [gameId, positions]);
			}
		}, runLoopInterval);
	},
	
	receiveKeyUp: function(userId, gameId, keyCode) {
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return;
		}
		
		if(keyCode == "Up") {
			player.buttons.up = false;
		} else if(keyCode == "Down") {
			player.buttons.down = false;
		} else if(keyCode == "Right") {
			player.buttons.right = false;
		} else if(keyCode == "Left") {
			player.buttons.left = false;
		}
	},
	
	receiveKeyDown: function(userId, gameId, keyCode) {
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return;
		}
		
		if(keyCode == "Up") {
			player.buttons.up = true;
		} else if(keyCode == "Down") {
			player.buttons.down = true;
		} else if(keyCode == "Right") {
			player.buttons.right = true;
		} else if(keyCode == "Left") {
			player.buttons.left = true;
		}
		
		sys.puts("recieved " + userId + " " + gameId + " " + keyCode);
	}
};

var server = ws.createServer(function(socket) {
	socket.addListener("connect", function(resource) {
		sys.puts("client connected from " + resource);
		
		var id = "u" + Math.round(Math.random() * 1000000);
		
		// new user, create their player
		var player = new Player();
		player.id = id;
		player.name = "Bob";
		player.avatar = "asfoj0f9jojs";
		player.socket = socket;
		
		autoBahn.players[id] = player;
		
		player.invoke("setUserId", [id]);
	});
	
	// answers method calls from the client
	socket.addListener("data", function (data) {
		sys.puts("got " + data);
		
		//{action: "methodName", args: [bar, baz]}
		
		try {
			var methodCall = eval("(" + data + ")");
			//var methodCall = JSON.parse(data);
			
			if(methodCall && methodCall.action && autoBahn[methodCall.action]) {
				sys.puts("calling method " + methodCall.action + " with args " + methodCall.args);
				
				var output = {
					action: methodCall.action,
					args: methodCall.args,
					response: autoBahn[methodCall.action].apply(this, methodCall.args ? methodCall.args : [])
				}
				
				socket.write(JSON.stringify(output)+ "\r\n");
			}
		} catch(e) {
			sys.puts(":( " + e);
			for(key in e) {
				sys.puts(e[key]);
			}
		}
	});
	
	socket.addListener("close", function () {
		sys.puts("client left");
	});
}).listen(8080);