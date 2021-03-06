var sys = require('sys'),
     ws = require('modules/node-websocket-server/ws/server.js');

// Array Remove - By John Resig (MIT Licensed)
// http://ejohn.org/blog/javascript-array-remove/
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

function Player() {
	return {
		id: "",
		
		// user entered
		name: "",
		
		// eg. MD5'd email for gravatar
		avatar: 'http://www.gravatar.com/avatar/',
		
		// this player's socket connection
		socket: null,
		
		invoke: function(methodName, args) {
			this.socket.write(JSON.stringify({
				action: methodName,
				args: args ? args : []
			})+ "\r\n");
		},
		
		toJSON: function() {
			return {id: this.id, name: this.name, avatar: this.avatar};
		}
	}
}

function Game() {
	return {
		maxPlayers: 2,
		title: "",
		players: []
	}
}

var autoBahn = {
	
	// Games in progress
	games: {},
	
	// Players connected to AutoBahn
	players: {},

	/**
	 * Returns the list of games not currently full.
	 * 
	 * @param socket
	 * @param userId
	 */
	getLoungeList: function(socket, userId) {
		sys.puts(userId + " asked for lounge list");
		
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return false;
		}
		
		var lounges = [];
		
		for(var key in autoBahn.games) {
			
			if(autoBahn.games[key].players.length == autoBahn.games[key].maxPlayers) {
				continue;
			}
			
			if(autoBahn.games[key].players.indexOf(player) != -1) {
				continue;
			}
			
			lounges.push({
				id: key,
				lounge: autoBahn.games[key]
			});
		}
		
		return lounges;
	},

	/**
	 * Creates a new game and joins the creator to the game.
	 * 
	 * @param socket
	 * @param userId
	 * @param gameTitle
	 * @param maxPlayers
	 * @return Array A pair, containing the gameId and the current player list
	 */
	createGame: function(socket, userId, gameTitle, maxPlayers) {
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return false;
		}
		
		// No creating games on behalf of other players
		if(player.socket != socket) {
			sys.puts('Unauthorised createGame request from user masquerading as ' + userId + ' from ' + socket.remoteAddress);
			
			return false;
		}
		
		var gameId;
		
		while(!gameId || autoBahn.games[gameId]) gameId = "g" + Math.round(Math.random() * 1000000);
		
		var game = new Game();
		
		maxPlayers = parseInt(maxPlayers);
		
		game.maxPlayers = isNaN(maxPlayers) ? 2 : maxPlayers;
		game.title = gameTitle ? gameTitle : gameId;
		
		autoBahn.games[gameId] = game;
		
		return autoBahn.joinGame(socket, userId, gameId);
	},

	/**
	 * Joins a user to a game and informs other players of the event.
	 * 
	 * @param socket
	 * @param userId
	 * @param gameId
	 * @return Array A pair, containing the gameId and the current player list
	 */
	joinGame: function(socket, userId, gameId) {
		sys.puts("User " + userId + " trying to join game " + gameId);
		
		// get passed player
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return false;
		}
		
		// No joining games on behalf of other players
		if(player.socket != socket) {
			sys.puts('Unauthorised joinGame request from user masquerading as ' + userId + ' from ' + socket.remoteAddress);
			
			return false;
		}
		
		// get passed game
		var game = autoBahn.games[gameId];
		
		if(!game) {
			sys.puts("Could not find game with id " + gameId);
			
			return false;
		}
		
		// make sure it's not full already
		if(game.players.length == game.maxPlayers) {
			sys.puts("already " + game.players.length + " connected...");
			sys.puts("players: " + game.players);
			
			return false;
		}
		
		// Tell other players a new challenger has entered the arena
		for(var i = 0, ilen = game.players.length; i < ilen; ++i) {
			game.players[i].invoke('playerJoinedGame', [gameId, player]);
		}
		
		// add player
		game.players.push(player);
		
		sys.puts("now have " + game.players.length + " of " + game.maxPlayers + " for game " + gameId);
		
		// do we start the game?
		if(game.players.length == game.maxPlayers) {
			// game on
			for(var i = 0; i < game.players.length; i++) {
				game.players[i].invoke("startGame", [gameId]);
			}
			
		}
		
		return [gameId, game.players.remove(game.players.indexOf(player))];
	},

	/**
	 * Removes a user from a game. Informs other users and deletes the game if not more players are left.
	 * 
	 * @param socket
	 * @param userId
	 * @param gameId
	 */
	leaveGame:function(socket, userId, gameId) {
		
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return false;
		}
		
		// No leaving games on behalf of other players
		if(player.socket != socket) {
			sys.puts('Unauthorised leaveGame request from user masquerading as ' + userId + ' from ' + socket.remoteAddress);
			
			return false;
		}
		
		// get passed game
		var game = autoBahn.games[gameId];
		
		if(!game) {
			sys.puts("Could not find game with id " + gameId);
			
			return false;
		}
		
		// No leaving games you don't belong to
		var playerIndex = game.players.indexOf(player);
		
		if(playerIndex == -1) {
			sys.puts('Unauthorised leaveGame request from ' + userId + ' for game ' + gameId);
			
			return false;
		}
		
		game.players = game.players.remove(playerIndex);
		
		var playersLeft = game.players.length;
		
		if(playersLeft) {
		
			for(var i = 0; i < playersLeft; ++i) {
				game.players[i].invoke("leftGame", [gameId, userId]);
			}
		
		} else {
			
			// All players left the game
			delete autoBahn.games[gameId];
		}
		
		return true;
	},

	/**
	 * Allows a player to update their name from the random assigned user ID to a human readable name.
	 * 
	 * @param socket
	 * @param userId
	 * @param name
	 */
	setPlayerName:function(socket, userId, name) {
		
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return false;
		}
		
		// No changing names on behalf of other players
		if(player.socket != socket) {
			sys.puts('Unauthorised setPlayerName request from user masquerading as ' + userId + ' from ' + socket.remoteAddress);
			
			return false;
		}
		
		if(name) {
			
			player.name = name;
			
			// TODO: Push this information to other players in any games userId is in?
		}
		
		return true;
	},

	/**
	 * Allows a player to set their avatar (url).
	 * 
	 * @param socket
	 * @param userId
	 * @param avatar
	 */
	setPlayerAvatar:function(socket, userId, avatar) {
		
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return false;
		}
		
		// No changing avatars on behalf of other players
		if(player.socket != socket) {
			sys.puts('Unauthorised setPlayerAvatar request from user masquerading as ' + userId + ' from ' + socket.remoteAddress);
			
			return false;
		}
		
		if(avatar) {
			
			player.avatar = avatar;
		
			// TODO: Push this information to other players in any games userId is in?
		}
		
		return true;
	},
	
	updateGame:function(socket, userId, gameId, position, velocity) {
		
		sys.puts('Recieved update from ' + userId);
		
		var player = autoBahn.players[userId];
		
		if(!player) {
			sys.puts("Could not find player with id " + userId);
			
			return false;
		}
		
		// No updating the game on behalf of other players
		if(player.socket != socket) {
			sys.puts('Unauthorised updateGame request from user masquerading as ' + userId + ' from ' + socket.remoteAddress);
			
			return false;
		}
		
		// get passed game
		var game = autoBahn.games[gameId];
		
		if(!game) {
			sys.puts("Could not find game with id " + gameId);
			
			return false;
		}
		
		// No updating games you don't belong to
		if(!game.players[userId]) {
			sys.puts('Unauthorised updateGame request from ' + userId + ' for game ' + gameId);
			
			return false;
		}
		
		// inform all other players someone moved
		for(var i = 0, ilen = game.players.length; i < ilen; ++i) {
			
			if(game.players[i].id != userId) {
				
				game.players[i].invoke("updateGame", [gameId, userId, position, velocity]);
			}
		}
		
		return true;
	}
};

// TODO: update to use new ws connection module as per http://static.brandedcode.com/nws-docs/
var server = ws.createServer(function(socket) {
	
	socket.addListener("connect", function(resource) {
		sys.puts("Client connected from " + socket.remoteAddress);
		
		var id;
		
		while(!id || autoBahn.players[id]) id = "u" + Math.round(Math.random() * 1000000);
		
		// new user, create their player
		var player = new Player();
		
		player.id = id;
		player.name = id;
		player.socket = socket;
		
		autoBahn.players[id] = player;
		
		player.invoke("setUserId", [id]);
	});
	
	// answers method calls from the client
	socket.addListener("data", function(data) {
		
		//Expecting: {action: "methodName", args: [bar, baz]}
		
		try {
			
			var methodCall = JSON.parse(data);
			
			if(methodCall && methodCall.action && autoBahn[methodCall.action]) {
				sys.puts("Calling method " + methodCall.action + " with args " + methodCall.args);
				
				var result = autoBahn[methodCall.action].apply(this, [socket].concat(methodCall.args));
				
				// Any result that is not already an array of arguments to pass to the client
				// response function needs to be wrapped in an array.
				if(!(result instanceof Array)) {
					result = [result];
				}
				
				var output = JSON.stringify({
					action: methodCall.action,
					args: methodCall.args,
					response: result
				}) + "\r\n";
				
				sys.puts('Sending response: ' + output);
				
				socket.write(output);
			}
			
		} catch(e) {
			sys.puts(":( " + e);
			for(var key in e) {
				sys.puts(e[key]);
			}
		}
	});
	
	socket.addListener("close", function() {
		
		var player;
		
		// Get player
		for(var userId in autoBahn.players) {
			
			if(autoBahn.players[userId].socket == socket) {
				
				player = autoBahn.players[userId];
				break;
			}
		}
		
		sys.puts(player.id + " left the lounge\n");
		
		for(var gameId in autoBahn.games) {
			
			if(autoBahn.games[gameId].players.indexOf(player) != -1) {
				
				autoBahn.leaveGame(socket, player.id, gameId);
			}
		}
		
		delete autoBahn.players[userId];
	});
	
}).listen(8080);