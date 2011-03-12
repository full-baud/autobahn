var sys = require('sys'),
     ws = require('ws')

Player = function() {
	return {
		// user entered
		name: "",
		
		// eg. MD5'd email for gravatar
		avatar: ""
	}
};

Game = function() {
	return {
		numPlayers: 4,
		title: "Lounge",
		players: [
		
		]
	}
};

var autoBahn = {
	// a lounge is a game that hasn't started yet
	lounges: {
		
	},
	
	// games are in progress
	games: {
		
	},
	
	players: {
		
	},
	
	getLoungeList: function() {
		sys.puts("asked for lounge list");
		
		var lounges = [];
		
		for(key in autoBahn.lounges) {
			lounges.push({
				id: key,
				lounge: autoBahn.lounges[key]
			});
		}
		
		return lounges;
	},
	
	joinGame: function(userId, gameId) {
		sys.puts("user " + userId + " trying to join game " + gameId);
		
		var game = autoBahn.lounges[gameId];
		
		if(!game) {
			sys.puts("Could not find game with id " + gameId);
			
			return;
		}
		
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return;
		}
		
		if(game.players.length == game.numPlayers) {
			sys.puts("already " + game.players.length + " connected...");
			sys.puts("players: " + game.players);
			
			return;
		}
		
		game.players.push(player);
		
		sys.puts("now have " + game.players.length + " of " + game.numPlayers + " for game " + gameId);
		
		if(game.players.length == game.numPlayers) {
			// game on
			
		}
	}
};

// hard code one lounge
autoBahn.lounges["foo"] = new Game();


var server = ws.createServer(function(socket) {
	socket.addListener("connect", function(resource) {
		sys.puts("client connected from " + resource);
		
		var id = Math.round(Math.random() * 1000000);
		
		// new user, create their player
		var player = new Player();
		player.name = "Bob";
		player.avatar = "asfoj0f9jojs";
		
		autoBahn.players[id] = player;
		
		socket.write(JSON.stringify({
			action: "setUserId",
			args: [
				id
			]
		})+ "\r\n");
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
		}
	});
	
	socket.addListener("close", function () {
		sys.puts("client left");
	});
	
	
  var moveIt = function() {
  	var direction = Math.ceil(Math.random());
  	var amount = Math.random() * 10;
  	
  	var stuff = {
  		axis: direction,
  		distance: amount
  	};
  	
  	sys.puts("Sending to client " + JSON.stringify(stuff));
  	
  	socket.write(JSON.stringify(stuff)+ "\r\n");
  	var movementTime = Math.random() * 1000;
    setTimeout(moveIt, movementTime);
  }
 
}).listen(8080);